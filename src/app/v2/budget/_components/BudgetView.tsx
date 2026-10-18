'use client'

import { useRouter } from 'next/navigation'
import styled from '@emotion/styled'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { IconButton } from '@/components/v2'
import { step } from '@/components/MonthStepper'
import { buildBudgetTree, type BudgetTreeNode, type MonthSel } from '@/lib/budget'
import { monthLabel } from '@/lib/format'
import type { BudgetMonth } from '@/server/budget'
import { PageHeader } from '../../_components/PageHeader'
import { BudgetTable } from './BudgetTable'
import { IncomeBanner } from './IncomeBanner'
import { MemberTabs } from './MemberTabs'
import { PlanChart } from './PlanChart'
import { TrendChart } from './TrendChart'

const Layout = styled.div({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
  alignItems: 'start',
  gap: 8,
  padding: '8px 8px 16px 0',
  '@media (max-width: 900px)': { gridTemplateColumns: 'minmax(0, 1fr)', paddingLeft: 8 },
})

const Islands = styled.aside({ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 12 })

/** Month and member live in the URL; changing either re-renders the server page. */
export function BudgetView({
  month,
  ownerId,
  members,
  data,
}: {
  month: MonthSel
  ownerId: string
  members: readonly { id: string; name: string | null; email: string }[]
  data: BudgetMonth
}) {
  const router = useRouter()
  const go = (sel: MonthSel, owner: string) =>
    router.push(`/v2/budget?y=${sel.year}&m=${sel.month}&owner=${owner}`, { scroll: false })

  const roots = buildBudgetTree(data.nodes)
  const sum = (of: (n: BudgetTreeNode) => number) => roots.reduce((s, r) => s + of(r), 0)
  const budgeted = sum((r) => r.budget)
  const spent = sum((r) => r.spent)
  const left = sum((r) => r.carried) + budgeted - spent

  return (
    <>
      <PageHeader
        title={monthLabel(month.year, month.month)}
        tabs={<MemberTabs members={members} value={ownerId} onChange={(owner) => go(month, owner)} />}
        actions={
          <>
            <IconButton aria-label="Previous month" onClick={() => go(step(month, -1), ownerId)}>
              <CaretLeftIcon size={14} weight="bold" />
            </IconButton>
            <IconButton aria-label="Next month" onClick={() => go(step(month, 1), ownerId)}>
              <CaretRightIcon size={14} weight="bold" />
            </IconButton>
          </>
        }
      />
      <Layout>
        <BudgetTable roots={roots} budgeted={budgeted} spent={spent} left={left} />
        <Islands>
          <IncomeBanner income={data.income.reduce((s, i) => s + i.amount, 0)} budgeted={budgeted} />
          <PlanChart roots={roots} />
          <TrendChart month={month} dailySpend={data.dailySpend} lastMonthDailySpend={data.lastMonthDailySpend} />
        </Islands>
      </Layout>
    </>
  )
}
