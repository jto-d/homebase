'use client'

import { Tabs } from '@/components/v2'
import { memberLabel } from '@/lib/members'

type Member = { id: string; name?: string | null; email: string }

/** One tab per household member, labelled by first name. */
export function MemberTabs({
  members,
  value,
  onChange,
}: {
  members: readonly Member[]
  value: string | undefined
  onChange: (id: string) => void
}) {
  return (
    <Tabs.Root value={value} onValueChange={onChange} style={{ height: '100%' }}>
      <Tabs.List>
        {members.map((m) => (
          <Tabs.Tab key={m.id} value={m.id}>
            {memberLabel(m).split(' ')[0]}
          </Tabs.Tab>
        ))}
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  )
}
