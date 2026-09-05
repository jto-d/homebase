import { builder } from '../builder'

export const PointsProgramKind = builder.enumType('PointsProgramKind', {
  values: ['TRANSFERABLE', 'HOTEL', 'AIRLINE'] as const,
})

builder.prismaObject('PointsProgram', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    kind: t.expose('kind', { type: PointsProgramKind }),
    balance: t.exposeInt('balance'),
    ownerId: t.exposeString('ownerId'),
    redemptions: t.relation('redemptions', { query: { orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] } }),
  }),
})

builder.prismaObject('PointsRedemption', {
  fields: (t) => ({
    id: t.exposeID('id'),
    programId: t.exposeString('programId'),
    points: t.exposeInt('points'),
    date: t.string({ resolve: (redemption) => redemption.date.toISOString().slice(0, 10) }),
    description: t.exposeString('description'),
    ownerId: t.exposeString('ownerId', { nullable: true }),
  }),
})
