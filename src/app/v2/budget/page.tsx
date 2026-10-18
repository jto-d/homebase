'use client'

import { useState } from 'react'
import { useQuery } from '@urql/next'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { currentMonth, IconButton, step, Tabs, type MonthSel } from '@/components/v2'
import { monthLabel } from '@/lib/format'
import { HouseholdDocument } from '../../(app)/household.queries'
import { PageHeader } from '../page-header'

export default function V2BudgetPage() {
  const [month, setMonth] = useState<MonthSel>(currentMonth)
  const [{ data }] = useQuery({ query: HouseholdDocument })
  const [picked, setPicked] = useState<string | null>(null)
  const memberId = picked ?? data?.me.id

  return (
    <PageHeader
      title={monthLabel(month.year, month.month)}
      tabs={
        data && (
          <Tabs.Root value={memberId} onValueChange={setPicked} style={{ height: '100%' }}>
            <Tabs.List>
              {data.household.members.map((m) => (
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
  )
}
