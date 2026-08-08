import { builder } from '../builder'

builder.prismaObject('Household', {
  fields: (t) => ({
    id: t.exposeID('id'),
    // Ordered by creation so the household creator is always first — the UI
    // relies on a stable order to pick out "me" vs "partner".
    members: t.relation('members', { query: { orderBy: { createdAt: 'asc' } } }),
  }),
})
