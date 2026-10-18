import { prisma } from '@/lib/prisma'
import { requireHousehold } from './session'

/** The viewer and their household — what v1's `Household` query returns, minus GraphQL. */
export async function getHousehold() {
  const { userId, householdId } = await requireHousehold()
  const household = await prisma.household.findUniqueOrThrow({
    where: { id: householdId },
    select: {
      id: true,
      budgetStartYear: true,
      budgetStartMonth: true,
      // Creator first — the UI needs a stable order to pick out "me" vs "partner".
      members: { orderBy: { createdAt: 'asc' }, select: { id: true, name: true, email: true, color: true } },
    },
  })
  return { meId: userId, household }
}
