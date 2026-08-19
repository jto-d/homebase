import { builder } from '../builder'
import { CARD_CATALOG } from '@/lib/cardCatalog'

const PerkPeriod = builder.enumType('PerkPeriod', {
  values: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'QUADRENNIAL'] as const,
})

const ResetType = builder.enumType('ResetType', {
  values: ['CALENDAR', 'ANNIVERSARY'] as const,
})

builder.prismaObject('CreditCard', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    issuer: t.exposeString('issuer'),
    /// Catalog slug — src/lib/cardCatalog.ts. Null = hand-entered, falls back
    /// to a generic look with no auto-added perks.
    design: t.exposeString('design', { nullable: true }),
    lastFour: t.exposeString('lastFour', { nullable: true }),
    openedDate: t.string({ nullable: true, resolve: (card) => card.openedDate?.toISOString().slice(0, 10) ?? null }),
    ownerId: t.exposeString('ownerId'),
    /// Catalog-derived, never stored — see cardAnnualFee in src/lib/card.ts.
    annualFee: t.float({ resolve: (card) => CARD_CATALOG[card.design ?? '']?.annualFee ?? 0 }),
    perks: t.relation('perks'),
  }),
})

builder.prismaObject('Perk', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    totalAmount: t.float({ resolve: (perk) => perk.totalAmount.toNumber() }),
    period: t.expose('period', { type: PerkPeriod }),
    resetType: t.expose('resetType', { type: ResetType }),
    enrollmentRequired: t.exposeBoolean('enrollmentRequired'),
    notes: t.exposeString('notes', { nullable: true }),
    perkCredits: t.relation('perkCredits', { query: { orderBy: { date: 'desc' } } }),
  }),
})

builder.prismaObject('PerkCredit', {
  fields: (t) => ({
    id: t.exposeID('id'),
    amount: t.float({ resolve: (credit) => credit.amount.toNumber() }),
    date: t.string({ resolve: (credit) => credit.date.toISOString().slice(0, 10) }),
    description: t.exposeString('description', { nullable: true }),
  }),
})
