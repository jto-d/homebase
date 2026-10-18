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

  // ponytail: the default month comes from the server's clock, so for a few hours
  // around midnight on the 1st it can disagree with the viewer's. Have the client
  // replace the URL with its own month if that ever bites.
  const now = new Date()
  const year = Number(y)
  const month = Number(m)
  const sel =
    Number.isInteger(year) && Number.isInteger(month) && year > 0 && month >= 1 && month <= 12
      ? { year, month }
      : { year: now.getFullYear(), month: now.getMonth() + 1 }
  const ownerId = household.members.find((member) => member.id === owner)?.id ?? meId

  const data = await getBudgetMonth({ ...sel, ownerId })
  return <BudgetView month={sel} ownerId={ownerId} members={household.members} data={data} />
}
