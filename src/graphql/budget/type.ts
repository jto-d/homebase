import { builder } from '../builder'

builder.prismaObject('Transaction', {
  fields: (t) => ({
    id: t.exposeID('id'),
    merchant: t.exposeString('merchant'),
    date: t.string({ resolve: (txn) => txn.date.toISOString() }),
    amount: t.float({ resolve: (txn) => txn.amount.toNumber() }),
    note: t.exposeString('note', { nullable: true }),
    /// Who paid. null = a joint account.
    ownerId: t.exposeString('ownerId', { nullable: true }),
    /// The split decision: null = not decided, false = all on the payer,
    /// true = halved with the other member. See setTransactionShared.
    shared: t.exposeBoolean('shared', { nullable: true }),
    /// Empty means unfiled: the transaction counts against no budget.
    splits: t.relation('splits'),
    /// Which card/account it was charged to. Null for hand-entered rows.
    account: t.relation('account', { nullable: true }),
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
 * One node of the budget tree, resolved for a specific month.
 *
 * Deliberately *not* a `prismaObject`. `BudgetNode.budget` is a rolling default
 * that a `BudgetNodeMonth` row may override, and `spent`/`ytd` are derived from
 * transactions — none of the three mean anything without a month in scope, and
 * a Prisma object would invite reading them without one.
 */
export const BudgetNodePayload = builder.simpleObject('BudgetNodePayload', {
  fields: (t) => ({
    id: t.string(),
    /// null = a top-level group. The client trees the flat list up itself.
    parentId: t.string({ nullable: true }),
    label: t.string(),
    icon: t.string(),
    position: t.int(),
    /// This month's override, or the rolling default. Ignore it on a node with
    /// children — that one is the sum of its children (see `buildBudgetTree`).
    budget: t.float(),
    /// Set = draws a year-to-date bar against this limit. Only meaningful on a
    /// savings node.
    annualLimit: t.float({ nullable: true }),
    /// Inherited: true for a node flagged directly, or under one that is. A
    /// savings node can't be filed into, and its spend/ytd below are typed
    /// transfers rather than derived from transactions.
    isSavings: t.boolean(),
    /// Unspent budget accrues forward instead of evaporating at month end. Not
    /// inherited, unlike `isSavings` — set per node.
    rollsOver: t.boolean(),
    /// This node's *own* figure for the month: splits, unless `isSavings`, in
    /// which case it's the typed transfer. Children are added on top by the
    /// client, so a node filed/contributed to before it grew children keeps its
    /// history.
    spent: t.float(),
    /// January through the selected month. Zero unless `isSavings`.
    ytd: t.float(),
    /// Balance through the end of the *previous* month. Zero unless `rollsOver`;
    /// can go negative — overspending one month is a debt against the next.
    carried: t.float(),
  }),
})

export const IncomeSourcePayload = builder.simpleObject('IncomeSourcePayload', {
  fields: (t) => ({
    id: t.string(),
    label: t.string(),
    sub: t.string({ nullable: true }),
    amount: t.float(),
    position: t.int(),
  }),
})

/** Everything one person's Monthly view needs, in one round trip. */
export const BudgetMonthPayload = builder.simpleObject('BudgetMonthPayload', {
  fields: (t) => ({
    nodes: t.field({ type: [BudgetNodePayload] }),
    income: t.field({ type: [IncomeSourcePayload] }),
    /// The household's budget start, if one is set — the stepper's back-stop.
    budgetStartYear: t.int({ nullable: true }),
    budgetStartMonth: t.int({ nullable: true }),
  }),
})

/**
 * A node a transaction can be filed into: household-wide, both people's trees,
 * leaves only.
 *
 * Both people's, because splitting one charge across two budgets is the single
 * place the separate trees meet. Leaves only, because filing against a parent
 * would count the money twice — once on its own and once through the roll-up.
 */
export const BudgetLeafPayload = builder.simpleObject('BudgetLeafPayload', {
  fields: (t) => ({
    id: t.string(),
    label: t.string(),
    /// Ancestors included: `"Food › Groceries"`. Two people can both have a
    /// "Gas", and the bare label would make the picker a coin flip.
    path: t.string(),
    ownerId: t.string(),
  }),
})
