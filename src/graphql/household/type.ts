import { builder } from '../builder'

builder.prismaObject('Household', {
  fields: (t) => ({
    id: t.exposeID('id'),
    // Creator first — the UI needs a stable order to pick out "me" vs "partner".
    members: t.relation('members', { query: { orderBy: { createdAt: 'asc' } } }),
  }),
})
