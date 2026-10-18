'use client'

import { useState } from 'react'
import { useQuery } from '@urql/next'
import styled from '@emotion/styled'
import { CaretLeftIcon, CaretRightIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { brand } from '@/lib/theme'
import { Collapsible, color, Count, radius, currentMonth, IconButton, step, Tabs, Text, type MonthSel } from '@/components/v2'
import { buildBudgetTree, type BudgetTreeNode } from '@/lib/budget'
import { fmtDollars, fmtSigned, monthLabel } from '@/lib/format'
import { BudgetMonthDocument } from '../../(app)/budget/budget.queries'
import { HouseholdDocument } from '../../(app)/household.queries'
import { PageHeader } from '../page-header'
import { PlanChart } from './plan-chart'

const Page = styled.div({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
})

const List = styled.div({
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

const Islands = styled.aside({
  position: 'sticky',
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
})

// Same inset as Collapsible.Root + Trigger, so header, rows and footer share columns.
const Line = styled.div<{ indent?: number }>(({ indent = 0 }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 32,
  padding: `0 8px 0 ${8 + indent}px`,
  fontSize: 13,
}))

const Label = styled.span({
  flex: 1,
  minWidth: 0,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const Num = styled.span<{ tone?: 'muted' | 'warn' | 'over' }>(({ tone }) => ({
  width: 88,
  flex: 'none',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color:
    tone === 'over' ? brand.red[600] : tone === 'warn' ? brand.amber[700] : tone === 'muted' ? color.textMuted : color.text,
}))

const Head = styled(Line)({ margin: '0 8px', fontSize: 12, color: color.textMuted })

const Footer = styled(Line)({
  margin: '4px 8px 0',
  borderTop: `1px solid ${color.border}`,
  fontWeight: 600,
})

// Same shell as the Plan island; only the icon carries the tone.
const Banner = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 16px',
  borderRadius: radius.md * 2,
  border: `1px solid ${color.border}`,
  backgroundColor: color.surface,
})

const BannerText = styled.div({ display: 'flex', flexDirection: 'column', gap: 2 })

// Budget should equal income (zero-based). No income entered = nothing to compare against.
function IncomeBanner({ income, budgeted }: { income: number; budgeted: number }) {
  const gap = income - budgeted
  if (income <= 0 || Math.abs(gap) < 0.01) return null
  const over = gap < 0
  return (
    <Banner role="status">
      <WarningCircleIcon
        size={16}
        weight="fill"
        color={over ? brand.amber[700] : color.accent}
        style={{ flex: 'none', marginTop: 1 }}
      />
      <BannerText>
        <Text variant="strong">
          {over ? `Budget is ${fmtDollars(-gap)} over income` : `${fmtDollars(gap)} of income unassigned`}
        </Text>
        <Text variant="label">
          {over
            ? 'Trim a few categories so your plan fits what’s coming in.'
            : 'Give it a job — add it to a category or savings.'}
        </Text>
      </BannerText>
    </Banner>
  )
}

const Empty = styled.div({ padding: '8px 8px 12px 28px' })

// Carried folds into spent, not budget — a debt from last month reads as already
// spent, a banked surplus as spend below zero. Same rule as v1's LedgerRow.
function Money({ node }: { node: BudgetTreeNode }) {
  const netSpent = node.spent - node.carried
  const left = node.budget - netSpent
  return (
    <>
      <Num>{fmtDollars(node.budget)}</Num>
      <Num tone="muted">{node.rollsOver ? fmtSigned(netSpent) : fmtDollars(node.spent)}</Num>
      <Num tone={left < -0.001 ? 'over' : left < node.budget * 0.12 ? 'warn' : 'muted'}>{fmtSigned(left)}</Num>
    </>
  )
}

function Group({ group }: { group: BudgetTreeNode }) {
  return (
    <Collapsible.Root defaultOpen>
      <Collapsible.Trigger>
        <Collapsible.Caret>
          <CaretRightIcon size={12} weight="bold" />
        </Collapsible.Caret>
        {group.label}
        <Count>{group.children.length}</Count>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        {group.children.length === 0 && (
          <Empty>
            <Text variant="muted">Nothing in here yet</Text>
          </Empty>
        )}
        {group.children.map((category) => (
          <div key={category.id}>
            <Line indent={20}>
              <Label>{category.label}</Label>
              <Money node={category} />
            </Line>
            {category.children.map((line) => (
              <Line key={line.id} indent={40}>
                <Label>{line.label}</Label>
                <Money node={line} />
              </Line>
            ))}
          </div>
        ))}
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

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
    <Page>
      <PageHeader
        title={monthLabel(month.year, month.month)}
        tabs={
          household && (
            <Tabs.Root value={ownerId} onValueChange={setPicked} style={{ height: '100%' }}>
              <Tabs.List>
                {household.household.members.map((m) => (
                  <Tabs.Tab key={m.id} value={m.id}>
                    {m.name?.split(' ')[0] ?? m.email}
                  </Tabs.Tab>
                ))}
                <Tabs.Indicator />
              </Tabs.List>
            </Tabs.Root>
          )
        }
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
      <List>
        {error && (
          <Empty>
            <Text variant="muted">{error.message}</Text>
          </Empty>
        )}
        {data && (
          <>
            <div>
              <Head indent={20}>
                <Label>Category</Label>
                <Num tone="muted">Budget</Num>
                <Num tone="muted">Spent</Num>
                <Num tone="muted">Left</Num>
              </Head>
              {roots.map((group) => (
                <Group key={group.id} group={group} />
              ))}
              <Footer indent={20}>
                <Label>Total budgeted</Label>
                <Num>{fmtDollars(budgeted)}</Num>
                <Num>{fmtDollars(spent)}</Num>
                <Num tone={left < 0 ? 'over' : undefined}>{fmtSigned(left)}</Num>
              </Footer>
            </div>
            <Islands>
              <IncomeBanner income={data.budgetMonth.income.reduce((s, i) => s + i.amount, 0)} budgeted={budgeted} />
              <PlanChart roots={roots} />
            </Islands>
          </>
        )}
      </List>
    </Page>
  )
}
