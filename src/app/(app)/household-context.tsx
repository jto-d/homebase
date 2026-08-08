'use client'

import { createContext, useContext } from 'react'
import type { Member } from '@/components/MemberAvatar'

export interface HouseholdContextValue {
  householdId: string
  /** The signed-in member. */
  me: Member
  /** The other member, or null while the household is still solo. */
  partner: Member | null
  members: Member[]
  /** Re-run the household query from the network (after a mutation). */
  refetch: () => void
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null)

export const HouseholdProvider = HouseholdContext.Provider

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext)
  if (!ctx) throw new Error('useHousehold must be used within the app layout')
  return ctx
}
