import { builder } from '../builder'

const SettlementType = builder.prismaObject('Settlement', {
  fields: (t) => ({
    id: t.exposeID('id'),
    fromUserId: t.exposeString('fromUserId'),
    toUserId: t.exposeString('toUserId'),
    amount: t.float({ resolve: (s) => s.amount.toNumber() }),
    date: t.string({ resolve: (s) => s.date.toISOString() }),
    note: t.exposeString('note', { nullable: true }),
  }),
})

/**
 * Who owes who, and how much. `debtorUserId`/`creditorUserId` are both null
 * only at exactly zero — "you're square" has no direction to render.
 */
export const SplitBalancePayload = builder.simpleObject('SplitBalancePayload', {
  fields: (t) => ({
    debtorUserId: t.string({ nullable: true }),
    creditorUserId: t.string({ nullable: true }),
    amount: t.float(),
  }),
})

/** One split row that crosses between the two members' budgets, for the month list. */
export const SplitDebtItemPayload = builder.simpleObject('SplitDebtItemPayload', {
  fields: (t) => ({
    transactionId: t.string(),
    merchant: t.string(),
    date: t.string(),
    payerUserId: t.string(),
    debtorUserId: t.string(),
    /// The full transaction total — what reads as "the bill".
    amount: t.float(),
    /// The debtor's actual share, which can differ from `amount` on an uneven split.
    owed: t.float(),
  }),
})

/** Everything the Split page needs, in one round trip. */
export const SplitPagePayload = builder.simpleObject('SplitPagePayload', {
  fields: (t) => ({
    /// All-time, after settlements. The headline balance.
    outstanding: t.field({ type: SplitBalancePayload }),
    /// This month's cross-owed splits only — settlements are listed separately.
    monthNet: t.field({ type: SplitBalancePayload }),
    items: t.field({ type: [SplitDebtItemPayload] }),
    settlements: t.field({ type: [SettlementType] }),
  }),
})
