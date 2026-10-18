'use client'

import { useState } from 'react'
import styled from '@emotion/styled'
import { EmptyNote, Section } from '@/components/v2'
import { currentMonth } from '@/components/MonthStepper'
import type { MonthSel } from '@/lib/budget'
import { PageHeader } from '../_components/PageHeader'
import { Toolbar } from './_components/Toolbar'

const List = styled.div({ flex: 1, minHeight: 0, overflow: 'auto' })

export default function V2TransactionsPage() {
  const [month, setMonth] = useState<MonthSel>(currentMonth)

  return (
    <>
      <PageHeader title="Transactions" />
      <Toolbar month={month} onMonthChange={setMonth} />
      <List>
        <Section title="Unfiled" count={0}>
          <EmptyNote>No unfiled transactions</EmptyNote>
        </Section>
        <Section title="Filed" count={0}>
          <EmptyNote>No filed transactions</EmptyNote>
        </Section>
      </List>
    </>
  )
}
