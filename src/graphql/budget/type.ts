import { builder } from '../builder'

builder.prismaObject('Budget', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    // Owner is exposed as a raw id, not a relation: the client already holds
    // both members from useHousehold(), so it resolves the name, colour and
    // avatar locally rather than paying for a nested user on every row.
    ownerId: t.exposeString('ownerId'),
    amount: t.float({ resolve: (budget) => budget.amount.toNumber() }),
  }),
})

builder.prismaObject('Transaction', {
  fields: (t) => ({
    id: t.exposeID('id'),
    merchant: t.exposeString('merchant'),
    date: t.string({ resolve: (txn) => txn.date.toISOString() }),
    amount: t.float({ resolve: (txn) => txn.amount.toNumber() }),
    note: t.exposeString('note', { nullable: true }),
    /// Who paid. null = a joint account.
    ownerId: t.exposeString('ownerId', { nullable: true }),
    /// Empty means unfiled: the transaction counts against no budget.
    splits: t.relation('splits'),
  }),
})

builder.prismaObject('TransactionSplit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    budgetId: t.exposeString('budgetId'),
    amount: t.float({ resolve: (split) => split.amount.toNumber() }),
  }),
})

/**
 * A budget plus what was spent against it in one month.
 *
 * Flat rather than a `Budget` with a month-scoped field, because `spent` only
 * means anything relative to the month that was asked for — putting it on the
 * Prisma object would invite reading it without one.
 */
export const BudgetSpend = builder.simpleObject('BudgetSpend', {
  fields: (t) => ({
    id: t.string(),
    name: t.string(),
    ownerId: t.string(),
    amount: t.float(),
    spent: t.float(),
  }),
})
