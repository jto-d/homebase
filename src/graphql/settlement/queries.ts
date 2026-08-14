import { builder } from '../builder'
import { requireAuth } from '../context'
import { SplitPagePayload } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange, toCents } from '@/lib/budget'

/** amount ≥ 0, with a direction — or no direction at all, at exactly zero. */
function balance(netCents: number, aId: string, bId: string) {
  if (netCents === 0) return { debtorUserId: null, creditorUserId: null, amount: 0 }
  // Positive netCents = b owes a (see callers).
  return netCents > 0
    ? { debtorUserId: bId, creditorUserId: aId, amount: netCents / 100 }
    : { debtorUserId: aId, creditorUserId: bId, amount: -netCents / 100 }
}

builder.queryFields((t) => ({
  /**
   * Who owes who, derived entirely from `TransactionSplit` (cross-owed shares)
   * and `Settlement` (paybacks) — there is no other source of truth here.
   *
   * `outstanding` nets every split and settlement ever recorded; `items` /
   * `monthNet` are scoped to the requested month, same shape as `transactions`.
   */
  splitPage: t.field({
    type: SplitPagePayload,
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
    },
    resolve: async (_root, { year, month }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const empty = { outstanding: balance(0, '', ''), monthNet: balance(0, '', ''), items: [], settlements: [] }

      const members = await prisma.user.findMany({
        where: { householdId },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      })
      // A solo household can't owe itself — nothing to derive a direction from.
      if (members.length < 2) return empty
      const [a, b] = members as [{ id: string }, { id: string }]

      // What b owes a, and what a owes b: every split whose payer and budget
      // owner differ. A joint-paid transaction (ownerId null) never matches
      // either side, so it's excluded by construction, not a filter.
      const crossOwed = (payerId: string, debtorId: string) =>
        prisma.transactionSplit.aggregate({
          _sum: { amount: true },
          where: { transaction: { householdId, ownerId: payerId }, budget: { ownerId: debtorId } },
        })
      const paidBy = (fromUserId: string) =>
        prisma.settlement.aggregate({ _sum: { amount: true }, where: { householdId, fromUserId } })

      const [bOwesA, aOwesB, aPaid, bPaid, monthSplits, monthSettlements] = await Promise.all([
        crossOwed(a.id, b.id),
        crossOwed(b.id, a.id),
        paidBy(a.id),
        paidBy(b.id),
        prisma.transactionSplit.findMany({
          where: {
            transaction: { householdId, date: monthRange({ year, month }) },
            OR: [
              { transaction: { ownerId: a.id }, budget: { ownerId: b.id } },
              { transaction: { ownerId: b.id }, budget: { ownerId: a.id } },
            ],
          },
          select: {
            amount: true,
            budget: { select: { ownerId: true } },
            transaction: { select: { id: true, merchant: true, date: true, ownerId: true } },
          },
          orderBy: { transaction: { date: 'desc' } },
        }),
        prisma.settlement.findMany({
          where: { householdId, date: monthRange({ year, month }) },
          orderBy: { date: 'desc' },
        }),
      ])

      // Net in integer cents throughout — never float subtraction on money.
      // b owes a: (what b owes a) − (what a paid b, i.e. paidBy(a) reduces a's
      // own debt to b) − ... spelled out below rather than folded into one
      // expression, since each term settles a different leg.
      const netCents =
        toCents(bOwesA._sum.amount?.toNumber() ?? 0) -
        toCents(aOwesB._sum.amount?.toNumber() ?? 0) -
        toCents(aPaid._sum.amount?.toNumber() ?? 0) +
        toCents(bPaid._sum.amount?.toNumber() ?? 0)

      const monthCents = monthSplits.reduce((sum, s) => {
        const payerId = s.transaction.ownerId!
        const debtorId = s.budget.ownerId
        const cents = toCents(s.amount.toNumber())
        return sum + (payerId === a.id ? cents : -cents)
      }, 0)

      return {
        outstanding: balance(netCents, a.id, b.id),
        monthNet: balance(monthCents, a.id, b.id),
        items: monthSplits.map((s) => ({
          transactionId: s.transaction.id,
          merchant: s.transaction.merchant,
          date: s.transaction.date.toISOString(),
          payerUserId: s.transaction.ownerId!,
          debtorUserId: s.budget.ownerId,
          amount: s.amount.toNumber(),
        })),
        settlements: monthSettlements,
      }
    },
  }),
}))
