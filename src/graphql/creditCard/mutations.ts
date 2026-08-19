import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { parseDateOnly, roundCents } from '@/lib/budget'
import { CARD_CATALOG } from '@/lib/cardCatalog'
import { PERK_CATALOG } from '@/lib/perkCatalog'

/** Ids arrive from the client — re-check against the caller's household before they reach a write. */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

function parseOpenedDate(openedDate: string | null | undefined): Date | null {
  if (!openedDate) return null
  const date = parseDateOnly(openedDate)
  if (date > new Date()) throw new UserFacingError('Opened date cannot be in the future')
  return date
}

builder.mutationFields((t) => ({
  /** Catalog-driven create: name, issuer, art and perks all come from the slug. */
  addCard: t.prismaField({
    type: 'CreditCard',
    args: {
      catalogKey: t.arg.string({ required: true }),
      ownerId: t.arg.string({ required: true }),
      lastFour: t.arg.string(),
      openedDate: t.arg.string({ description: 'YYYY-MM-DD.' }),
    },
    resolve: async (query, _root, { catalogKey, ownerId, lastFour, openedDate }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const entry = CARD_CATALOG[catalogKey]
      if (!entry) throw new UserFacingError('Unknown card')
      await assertMember(householdId, ownerId)

      if (lastFour != null && lastFour !== '' && !/^\d{4}$/.test(lastFour)) {
        throw new UserFacingError('Last four must be exactly 4 digits')
      }
      const opened = parseOpenedDate(openedDate)

      const perks = PERK_CATALOG[catalogKey] ?? []

      return prisma.creditCard.create({
        ...query,
        data: {
          householdId,
          ownerId,
          name: entry.name,
          issuer: entry.issuer,
          design: catalogKey,
          lastFour: lastFour || null,
          openedDate: opened,
          perks: perks.length ? { create: perks } : undefined,
        },
      })
    },
  }),

  /** Attribution and card facts are editable after creation — only the catalog-derived name/issuer/perks aren't. */
  updateCard: t.prismaField({
    type: 'CreditCard',
    args: {
      cardId: t.arg.string({ required: true }),
      ownerId: t.arg.string({ required: true }),
      lastFour: t.arg.string(),
      openedDate: t.arg.string({ description: 'YYYY-MM-DD.' }),
    },
    resolve: async (query, _root, { cardId, ownerId, lastFour, openedDate }, ctx) => {
      const { householdId } = requireAuth(ctx)
      await assertMember(householdId, ownerId)

      if (lastFour != null && lastFour !== '' && !/^\d{4}$/.test(lastFour)) {
        throw new UserFacingError('Last four must be exactly 4 digits')
      }
      const opened = parseOpenedDate(openedDate)

      const { count } = await prisma.creditCard.updateMany({
        where: { id: cardId, householdId },
        data: { ownerId, lastFour: lastFour || null, openedDate: opened },
      })
      if (count === 0) throw new UserFacingError('Card not found')

      return prisma.creditCard.findUniqueOrThrow({ ...query, where: { id: cardId } })
    },
  }),

  /** Cascades its perks and their credit history — the confirm dialog says so. */
  removeCard: t.boolean({
    args: { cardId: t.arg.string({ required: true }) },
    resolve: async (_root, { cardId }, ctx) => {
      const { count } = await prisma.creditCard.deleteMany({
        where: { id: cardId, householdId: requireAuth(ctx).householdId },
      })
      if (count === 0) throw new UserFacingError('Card not found')
      return true
    },
  }),

  logPerkCredit: t.prismaField({
    type: 'PerkCredit',
    args: {
      perkId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      date: t.arg.string({ required: true, description: 'YYYY-MM-DD.' }),
      description: t.arg.string(),
    },
    resolve: async (query, _root, { perkId, amount, date, description }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (amount <= 0) throw new UserFacingError('Amount must be more than $0')
      const parsedDate = parseDateOnly(date)

      const perk = await prisma.perk.findFirst({
        where: { id: perkId, creditCard: { householdId } },
        select: { id: true },
      })
      if (!perk) throw new UserFacingError('Perk not found')

      return prisma.perkCredit.create({
        ...query,
        data: {
          perkId,
          amount: roundCents(amount),
          date: parsedDate,
          description: description?.trim() || null,
        },
      })
    },
  }),

  /** Undo for a mis-logged credit. */
  deletePerkCredit: t.boolean({
    args: { creditId: t.arg.string({ required: true }) },
    resolve: async (_root, { creditId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const { count } = await prisma.perkCredit.deleteMany({
        where: { id: creditId, perk: { creditCard: { householdId } } },
      })
      if (count === 0) throw new UserFacingError('Credit not found')
      return true
    },
  }),
}))
