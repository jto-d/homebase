import { randomBytes } from 'node:crypto'
import type { Prisma, User } from '@prisma/client'
import { prisma } from './prisma'
import { UserFacingError } from './errors'
import { nextMemberColor, MEMBER_COLORS } from './members'

/** v1 cap. Pairing is permanent (no leave/unpair), so this is only enforced on the way in. */
export const HOUSEHOLD_MAX_MEMBERS = 2

/** Codes are single-use and never expire, so they only need to be unguessable. */
export function generateInviteCode(): string {
  return randomBytes(9).toString('base64url')
}

// ---------------------------------------------------------------------------
// Pure decision logic — no DB.
// ---------------------------------------------------------------------------

export interface AcceptInviteFacts {
  /** The invite being redeemed, or null when the code matches nothing. */
  invite: { status: 'PENDING' | 'ACCEPTED'; householdId: string } | null
  targetMemberCount: number
  /** The household the accepting user is currently in. */
  userHouseholdId: string
  userHouseholdMemberCount: number
}

export type AcceptInviteDecision = { ok: true } | { ok: false; error: string }

/**
 * Whether an invite may be redeemed, and if not, the message the user sees.
 *
 * Ordering matters: "already used" comes before "household full" — it is the
 * likelier case and explains the situation better.
 */
export function decideAcceptInvite(facts: AcceptInviteFacts): AcceptInviteDecision {
  const { invite, targetMemberCount, userHouseholdId, userHouseholdMemberCount } = facts

  if (!invite) return { ok: false, error: 'Invite not found' }
  if (invite.householdId === userHouseholdId) {
    return { ok: false, error: "You're already a member of this household" }
  }
  if (invite.status !== 'PENDING') {
    return { ok: false, error: 'This invite has already been used' }
  }
  if (userHouseholdMemberCount >= HOUSEHOLD_MAX_MEMBERS) {
    return { ok: false, error: "You're already paired with someone" }
  }
  if (targetMemberCount >= HOUSEHOLD_MAX_MEMBERS) {
    return { ok: false, error: 'That household is already full' }
  }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * Move every household-scoped record from one household to another.
 *
 * **Every model carrying `householdId` must add a `tx.<model>.updateMany` line
 * here**, or a solo user's data is stranded on the household deleted when they
 * pair up. Child rows need none — `TransactionSplit` travels with its
 * transaction and `BudgetNodeMonth` with its node, and `ownerId` is untouched
 * because the owner is moving too.
 *
 * `BudgetNode.parentId` needs no fixup either: a whole tree moves at once, so
 * every parent lands in the new household alongside its children.
 */
export async function migrateHouseholdRecords(
  tx: Prisma.TransactionClient,
  fromHouseholdId: string,
  toHouseholdId: string
): Promise<void> {
  const move = { where: { householdId: fromHouseholdId }, data: { householdId: toHouseholdId } }
  await tx.budgetNode.updateMany(move)
  await tx.incomeSource.updateMany(move)
  await tx.transaction.updateMany(move)
  await tx.plaidItem.updateMany(move)
  await tx.settlement.updateMany(move)
  await tx.creditCard.updateMany(move)
}

/** Consume an invite and clear out any other outstanding invites for the household. */
async function claimInvite(
  tx: Prisma.TransactionClient,
  code: string,
  acceptedByUserId: string,
  householdId: string
): Promise<boolean> {
  // The conditional status transition IS the single-use lock — a read-then-write
  // would let two redemptions both see PENDING. Zero rows means someone beat us.
  const claimed = await tx.householdInvite.updateMany({
    where: { code, status: 'PENDING' },
    data: { status: 'ACCEPTED', acceptedByUserId, acceptedAt: new Date() },
  })
  if (claimed.count === 0) return false

  // Household is full, so every other outstanding code is dead. No REVOKED status
  // in the schema (out of scope for v1), so deletion expresses invalidation.
  await tx.householdInvite.deleteMany({ where: { householdId, status: 'PENDING' } })
  return true
}

/**
 * Create a household containing exactly this user. `User.householdId` is non-null,
 * so solo users get full app access with nothing gated on pairing.
 */
async function createSoloUser(email: string, name: string | null): Promise<User> {
  return prisma.$transaction(async (tx) => {
    const household = await tx.household.create({ data: {} })
    return tx.user.create({
      data: { email, name, color: MEMBER_COLORS[0], householdId: household.id },
    })
  })
}

/**
 * Create a new user directly inside an invite's household. Returns null if the
 * invite isn't redeemable (used, unknown, or filled up), so the caller falls back to solo.
 */
async function createUserIntoInvite(
  email: string,
  name: string | null,
  inviteCode: string
): Promise<User | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const invite = await tx.householdInvite.findUnique({
        where: { code: inviteCode },
        select: {
          status: true,
          householdId: true,
          household: { select: { members: { select: { color: true } } } },
        },
      })

      if (!invite || invite.status !== 'PENDING') return null
      const members = invite.household.members
      if (members.length >= HOUSEHOLD_MAX_MEMBERS) return null

      const user = await tx.user.create({
        data: {
          email,
          name,
          color: nextMemberColor(members.map((m) => m.color)),
          householdId: invite.householdId,
        },
      })

      // Losing the race means the row we just created sits in a now-full household.
      // Throw so the transaction unwinds it and the caller retries solo.
      if (!(await claimInvite(tx, inviteCode, user.id, invite.householdId))) {
        throw new InviteRaceLost()
      }

      return user
    })
  } catch (err) {
    if (err instanceof InviteRaceLost) return null
    throw err
  }
}

class InviteRaceLost extends Error {}

/**
 * Mint a fresh invite code. Multiple codes may be outstanding at once; all are
 * invalidated together the moment the household fills.
 */
export async function createInvite(input: {
  householdId: string
  createdByUserId: string
}): Promise<{ code: string }> {
  const memberCount = await prisma.user.count({ where: { householdId: input.householdId } })
  if (memberCount >= HOUSEHOLD_MAX_MEMBERS) {
    throw new UserFacingError('Your household is already full')
  }

  // 72 bits makes collision vanishingly unlikely, but `code` is unique — retry
  // rather than surface a raw constraint violation.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode()
    const taken = await prisma.householdInvite.findUnique({ where: { code }, select: { id: true } })
    if (taken) continue
    await prisma.householdInvite.create({
      data: { code, householdId: input.householdId, createdByUserId: input.createdByUserId },
    })
    return { code }
  }
  throw new UserFacingError('Could not generate an invite code, please try again')
}

/**
 * The single entry point for the Auth.js `jwt` callback on first sign-in.
 *
 * `inviteCode` carries across the OAuth round trip so a partner is created
 * directly into the inviter's household, never briefly holding a solo one.
 * Without a usable code they get their own household and `acceptInvite` can
 * still merge them later.
 */
export async function upsertUserForSignIn(input: {
  email: string
  name?: string | null
  inviteCode?: string | null
}): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) return existing

  const name = input.name?.trim() || null
  if (input.inviteCode) {
    const joined = await createUserIntoInvite(input.email, name, input.inviteCode)
    if (joined) return joined
  }
  return createSoloUser(input.email, name)
}

/**
 * Redeem an invite for an existing signed-in user: merge their household into
 * the inviter's, delete the one they came from, return the new household id.
 */
export async function acceptInvite(input: { code: string; userId: string }): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: input.userId },
      select: {
        id: true,
        householdId: true,
        household: { select: { _count: { select: { members: true } } } },
      },
    })

    const invite = await tx.householdInvite.findUnique({
      where: { code: input.code },
      select: {
        status: true,
        householdId: true,
        household: { select: { members: { select: { color: true } } } },
      },
    })

    const decision = decideAcceptInvite({
      invite: invite && { status: invite.status, householdId: invite.householdId },
      targetMemberCount: invite?.household.members.length ?? 0,
      userHouseholdId: user.householdId,
      userHouseholdMemberCount: user.household._count.members,
    })
    if (!decision.ok) throw new UserFacingError(decision.error)

    const target = invite!
    if (!(await claimInvite(tx, input.code, user.id, target.householdId))) {
      throw new UserFacingError('This invite has already been used')
    }

    const previousHouseholdId = user.householdId
    await migrateHouseholdRecords(tx, previousHouseholdId, target.householdId)

    await tx.user.update({
      where: { id: user.id },
      data: {
        householdId: target.householdId,
        color: nextMemberColor(target.household.members.map((m) => m.color)),
      },
    })

    // Only safe because the user was already moved off it: Household cascades to
    // members, so deleting an occupied one would delete the person.
    const remaining = await tx.user.count({ where: { householdId: previousHouseholdId } })
    if (remaining === 0) {
      await tx.household.delete({ where: { id: previousHouseholdId } })
    }

    return target.householdId
  })
}
