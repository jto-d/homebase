import { monthFromParams } from '@/lib/budget'
import { getHousehold } from '@/server/household'
import { getTransactionsMonth } from '@/server/transactions'
import { TransactionsView } from './_components/TransactionsView'

export default async function V2TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { y, m } = await searchParams
  const sel = monthFromParams(y, m)
  const [{ household }, data] = await Promise.all([getHousehold(), getTransactionsMonth(sel)])
  return <TransactionsView month={sel} members={household.members} data={data} />
}
