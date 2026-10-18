'use client'

import { useState } from 'react'
import { useQuery } from '@urql/next'
import styled from '@emotion/styled'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { EmptyNote, IconButton } from '@/components/v2'
import { currentMonth, step } from '@/components/MonthStepper'
import { buildBudgetTree, type BudgetTreeNode, type MonthSel } from '@/lib/budget'
import { monthLabel } from '@/lib/format'
import { BudgetMonthDocument } from '../../(app)/budget/budget.queries'
import { HouseholdDocument } from '../../(app)/household.queries'
import { PageHeader } from '../_components/page-header'
import { BudgetTable } from './_components/budget-table'
import { IncomeBanner } from './_components/income-banner'
import { MemberTabs } from './_components/member-tabs'
import { PlanChart } from './_components/plan-chart'
import { TrendChart } from './_components/trend-chart'

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

export default function V2BudgetPage() {
  const [month, setMonth] = useState<MonthSel>(currentMonth)
  const [{ data: household }] = useQuery({ query: HouseholdDocument })
  const [picked, setPicked] = useState<string | null>(null)
  const ownerId = picked ?? household?.me.id

  const [{ data, error }] = useQuery({
    query: BudgetMonthDocument,
    variables: { ...month, ownerId: ownerId ?? '' },
    pause: !ownerId,
    requestPolicy: 'cache-and-network',
  })
  const roots = buildBudgetTree(data?.budgetMonth.nodes ?? [])
  const sum = (of: (n: BudgetTreeNode) => number) => roots.reduce((s, r) => s + of(r), 0)
  const budgeted = sum((r) => r.budget)
  const spent = sum((r) => r.spent)
  const left = sum((r) => r.carried) + budgeted - spent

  return (
    <>
      <PageHeader
        title={monthLabel(month.year, month.month)}
        tabs={household && <MemberTabs members={household.household.members} value={ownerId} onChange={setPicked} />}
        actions={
          <>
            <IconButton aria-label="Previous month" onClick={() => setMonth(step(month, -1))}>
              <CaretLeftIcon size={14} weight="bold" />
            </IconButton>
            <IconButton aria-label="Next month" onClick={() => setMonth(step(month, 1))}>
              <CaretRightIcon size={14} weight="bold" />
            </IconButton>
          </>
        }
      />
      <Layout>
        {error && <EmptyNote>{error.message}</EmptyNote>}
        {data && (
          <>
            <BudgetTable roots={roots} budgeted={budgeted} spent={spent} left={left} />
            <Islands>
              <IncomeBanner income={data.budgetMonth.income.reduce((s, i) => s + i.amount, 0)} budgeted={budgeted} />
              <PlanChart roots={roots} />
              <TrendChart
                month={month}
                dailySpend={data.budgetMonth.dailySpend}
                lastMonthDailySpend={data.budgetMonth.lastMonthDailySpend}
              />
            </Islands>
          </>
        )}
      </Layout>
    </>
  )
}
