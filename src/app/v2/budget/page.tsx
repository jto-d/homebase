import { monthFromParams } from '@/lib/budget'
import { getBudgetMonth } from '@/server/budget'
import { getHousehold } from '@/server/household'
import { BudgetView } from './_components/BudgetView'

export default async function V2BudgetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { y, m, owner } = await searchParams
  const { meId, household } = await getHousehold()
  const sel = monthFromParams(y, m)
  const ownerId = household.members.find((member) => member.id === owner)?.id ?? meId

  const data = await getBudgetMonth({ ...sel, ownerId })
  return <BudgetView month={sel} ownerId={ownerId} members={household.members} data={data} />
}
