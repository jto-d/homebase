import { builder } from '../builder'

builder.prismaObject('Household', {
  fields: (t) => ({
    id: t.exposeID('id'),
    // Creator first — the UI needs a stable order to pick out "me" vs "partner".
    members: t.relation('members', { query: { orderBy: { createdAt: 'asc' } } }),
    /// The stepper's back-stop — see the field's doc comment on the Prisma model.
    budgetStartYear: t.exposeInt('budgetStartYear', { nullable: true }),
    budgetStartMonth: t.exposeInt('budgetStartMonth', { nullable: true }),
  }),
})
