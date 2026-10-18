'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import styled from '@emotion/styled'
import { color, EmptyNote, Section, Text } from '@/components/v2'
import type { MonthSel } from '@/lib/budget'
import { fmtDay, fmtMoney } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import type { TransactionsMonth } from '@/server/transactions'
import { PageHeader } from '../../_components/PageHeader'
import { syncTransactions } from '../actions'
import { Toolbar } from './Toolbar'

type Txn = TransactionsMonth['transactions'][number]
type Member = { id: string; name: string | null; email: string }

const List = styled.div({ flex: 1, minHeight: 0, overflow: 'auto' })

// Same inset as Section's root + trigger, like the budget table's rows.
const Line = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  height: 32,
  margin: '0 8px',
  padding: '0 8px 0 28px',
  fontSize: 13,
})

const Cell = styled.span<{ width?: number; muted?: boolean; tone?: 'warn' }>(({ width, muted, tone }) => ({
  ...(width ? { width, flex: 'none' } : { flex: 1, minWidth: 0 }),
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: tone === 'warn' ? color.warn : muted ? color.textMuted : color.text,
}))

const Amount = styled.span({ width: 88, flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums' })

/**
 * Month lives in the URL; changing it re-renders the server page.
 *
 * On first mount it also syncs Plaid in the background — the page renders from
 * the database immediately, then refreshes only if the sync brought anything in.
 */
export function TransactionsView({
  month,
  members,
  data,
}: {
  month: MonthSel
  members: readonly Member[]
  data: TransactionsMonth
}) {
  const router = useRouter()
  const [sync, setSync] = useState<{ running: boolean; error?: string }>({ running: data.hasLinkedBank })

  // A ref, not deps: month changes keep this component mounted, and the sync
  // isn't month-scoped. Also stops Strict Mode's double effect firing it twice.
  const synced = useRef(false)
  useEffect(() => {
    if (synced.current || !data.hasLinkedBank) return
    synced.current = true
    syncTransactions().then(({ changed, error }) => {
      setSync({ running: false, error })
      if (changed) router.refresh()
    })
  }, [data.hasLinkedBank, router])

  const pathById = new Map(data.leaves.map((leaf) => [leaf.id, leaf.path]))
  const solo = members.length < 2
  // Same rule as v1: filed once it has a budget, and (when paired) a split decision.
  const isFiled = (txn: Txn) => txn.splits.length > 0 && (solo || txn.shared != null)
  const unfiled = data.transactions.filter((txn) => !isFiled(txn))
  const filed = data.transactions.filter(isFiled)

  const payer = (txn: Txn) => {
    const member = members.find((m) => m.id === txn.ownerId)
    return member ? memberLabel(member).split(' ')[0] : 'Joint'
  }
  const category = (txn: Txn) => {
    const first = txn.splits[0] && pathById.get(txn.splits[0].budgetId)
    if (!first) return null
    return txn.splits.length > 1 ? `${first} +${txn.splits.length - 1}` : first
  }

  const row = (txn: Txn) => (
    <Line key={txn.id}>
      <Cell width={48} muted>
        {fmtDay(txn.date)}
      </Cell>
      <Cell>{txn.merchant}</Cell>
      <Cell width={160} muted>
        {txn.account ? `${txn.account.name}${txn.account.mask ? ` •${txn.account.mask}` : ''}` : ''}
      </Cell>
      <Cell width={200} muted={!!category(txn)} tone={category(txn) ? undefined : 'warn'}>
        {category(txn) ?? 'Uncategorized'}
      </Cell>
      <Cell width={64} muted>
        {payer(txn)}
      </Cell>
      <Amount>{fmtMoney(txn.amount)}</Amount>
    </Line>
  )

  return (
    <>
      <PageHeader
        title="Transactions"
        actions={
          (sync.running || sync.error) && (
            <Text variant="label" style={sync.error ? { color: color.warn } : undefined}>
              {sync.error ?? 'Syncing…'}
            </Text>
          )
        }
      />
      <Toolbar
        month={month}
        onMonthChange={(sel) => router.push(`/v2/transactions?y=${sel.year}&m=${sel.month}`, { scroll: false })}
      />
      <List>
        <Section title="Unfiled" count={unfiled.length}>
          {unfiled.length === 0 ? <EmptyNote>No unfiled transactions</EmptyNote> : unfiled.map(row)}
        </Section>
        <Section title="Filed" count={filed.length}>
          {filed.length === 0 ? <EmptyNote>No filed transactions</EmptyNote> : filed.map(row)}
        </Section>
      </List>
    </>
  )
}
