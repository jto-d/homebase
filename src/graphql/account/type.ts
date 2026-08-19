import { builder } from '../builder'

/**
 * Everything below comes from Plaid at request time, not the DB — `simpleObject`
 * rather than `prismaObject`, same as the Split page's computed payloads.
 */
const Holding = builder.simpleObject('Holding', {
  fields: (t) => ({
    ticker: t.string(),
    name: t.string(),
    /// "320 sh" for equities/ETFs, '' for anything a share count doesn't describe.
    detail: t.string(),
    value: t.float(),
  }),
})

export const Account = builder.simpleObject('Account', {
  fields: (t) => ({
    id: t.string(),
    name: t.string(),
    mask: t.string({ nullable: true }),
    /// 'cash' | 'investment' — credit/loan accounts are filtered out before this.
    kind: t.string(),
    subtype: t.string({ nullable: true }),
    institutionName: t.string(),
    /// From the owning PlaidItem. null = joint.
    ownerId: t.string({ nullable: true }),
    balance: t.float(),
    /// Empty for cash accounts and for investment accounts Plaid has no holdings for.
    holdings: t.field({ type: [Holding] }),
  }),
})
