'use client'

import { createContext, useContext } from 'react'

type SidebarState = { collapsed: boolean; toggle: () => void }

export const SidebarContext = createContext<SidebarState>({ collapsed: false, toggle: () => {} })

export function useSidebar(): SidebarState {
  return useContext(SidebarContext)
}
