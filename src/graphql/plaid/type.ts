import { builder } from '../builder'

builder.prismaObject('PlaidItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    institutionName: t.exposeString('institutionName'),
    /// Who this connection is attributed to. null = joint.
    ownerId: t.exposeString('ownerId', { nullable: true }),
    lastSyncedAt: t.string({
      nullable: true,
      resolve: (item) => item.lastSyncedAt?.toISOString() ?? null,
    }),
  }),
})

builder.prismaObject('PlaidAccount', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    mask: t.exposeString('mask', { nullable: true }),
    type: t.exposeString('type'),
    subtype: t.exposeString('subtype', { nullable: true }),
  }),
})

export const PlaidSyncResult = builder.simpleObject('PlaidSyncResult', {
  fields: (t) => ({
    imported: t.int(),
    updated: t.int(),
    removed: t.int(),
  }),
})
