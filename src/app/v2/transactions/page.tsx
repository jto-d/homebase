'use client'

import { useState } from 'react'
import styled from '@emotion/styled'
import { CaretRightIcon, FunnelSimpleIcon, PlusIcon, BankIcon } from '@phosphor-icons/react'
import {
  Button,
  Collapsible,
  color,
  currentMonth,
  MonthStepper,
  Stack,
  Text,
  type MonthSel,
} from '@/components/v2'
import { PageHeader } from '../page-header'

const counts = { unfiled: 0, filed: 0 }

const Page = styled.div({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
})

const Toolbar = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  height: 36,
  padding: '0 12px 0 16px',
  flex: 'none',
})

const List = styled.div({
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
})

const Count = styled.span({
  display: 'inline-grid',
  placeItems: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 4,
  backgroundColor: color.hover,
  color: color.textMuted,
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
})

const Empty = styled.div({
  padding: '8px 8px 12px 28px',
})

function Section({
  title,
  count,
  defaultOpen = true,
}: {
  title: string
  count: number
  defaultOpen?: boolean
}) {
  return (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger>
        <Collapsible.Caret>
          <CaretRightIcon size={12} weight="bold" />
        </Collapsible.Caret>
        {title}
        <Count>{count}</Count>
      </Collapsible.Trigger>
      <Collapsible.Panel>
        <Empty>
          <Text variant="muted">
            {count === 0 ? `No ${title.toLowerCase()} transactions` : 'Rows go here'}
          </Text>
        </Empty>
      </Collapsible.Panel>
    </Collapsible.Root>
  )
}

export default function V2TransactionsPage() {
  const [month, setMonth] = useState<MonthSel>(currentMonth)

  return (
    <Page>
      <PageHeader title="Transactions" />
      <Toolbar>
        <MonthStepper value={month} onChange={setMonth} />
        <Stack direction="row" align="center" gap={2}>
          <Button variant="subtle">
            <FunnelSimpleIcon size={14} weight="bold" />
            Filter
          </Button>
          <Button variant="subtle">
            <BankIcon size={14} weight="bold" />
            Link a bank
          </Button>
          <Button variant="subtle">
            <PlusIcon size={14} weight="bold" />
            Add
          </Button>
        </Stack>
      </Toolbar>
      <List>
        <Section title="Unfiled" count={counts.unfiled} />
        <Section title="Filed" count={counts.filed} />
      </List>
    </Page>
  )
}
