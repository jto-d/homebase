'use client'

import styled from '@emotion/styled'
import { CatIcon, color, EmptyNote, Section } from '@/components/v2'
import type { BudgetTreeNode } from '@/lib/budget'
import { fmtDollars, fmtSigned } from '@/lib/format'

// Same inset as Section's root + trigger, so header, rows and footer share columns.
const Line = styled.div<{ indent?: number }>(({ indent = 0 }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 32,
  padding: `0 8px 0 ${8 + indent}px`,
  fontSize: 13,
}))

const Head = styled(Line)({ margin: '0 8px', fontSize: 12, color: color.textMuted })

const Footer = styled(Line)({
  margin: '4px 8px 0',
  borderTop: `1px solid ${color.border}`,
  fontWeight: 600,
})

const Label = styled.span({
  flex: 1,
  minWidth: 0,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const TONE = { muted: color.textMuted, warn: color.warn, over: color.danger }

const Num = styled.span<{ tone?: keyof typeof TONE }>(({ tone }) => ({
  width: 88,
  flex: 'none',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: tone ? TONE[tone] : color.text,
}))

// Carried folds into spent, not budget — a debt from last month reads as already
// spent, a banked surplus as spend below zero. Same rule as v1's LedgerRow.
function Row({ node, indent }: { node: BudgetTreeNode; indent: number }) {
  const netSpent = node.spent - node.carried
  const left = node.budget - netSpent
  return (
    <Line indent={indent}>
      <CatIcon icon={node.icon} />
      <Label>{node.label}</Label>
      <Num>{fmtDollars(node.budget)}</Num>
      <Num tone="muted">{node.rollsOver ? fmtSigned(netSpent) : fmtDollars(node.spent)}</Num>
      <Num tone={left < -0.001 ? 'over' : left < node.budget * 0.12 ? 'warn' : 'muted'}>{fmtSigned(left)}</Num>
    </Line>
  )
}

function Group({ group }: { group: BudgetTreeNode }) {
  return (
    <Section title={group.label} count={group.children.length}>
      {group.children.length === 0 && <EmptyNote>Nothing in here yet</EmptyNote>}
      {group.children.map((category) => (
        <div key={category.id}>
          <Row node={category} indent={20} />
          {category.children.map((line) => (
            <Row key={line.id} node={line} indent={40} />
          ))}
        </div>
      ))}
    </Section>
  )
}

export function BudgetTable({
  roots,
  budgeted,
  spent,
  left,
}: {
  roots: BudgetTreeNode[]
  budgeted: number
  spent: number
  left: number
}) {
  return (
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
  )
}
