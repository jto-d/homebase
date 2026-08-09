'use client'

import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export const SIDEBAR_WIDTH = 200

/** Only routes that exist. A feature brief adds its own line when it lands. */
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/budget', label: 'Budget' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/settings', label: 'Settings' },
]

/** `/` only matches exactly; everything else also matches its subroutes. */
function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <List
      component="nav"
      disablePadding
      sx={{
        width: SIDEBAR_WIDTH,
        flex: 'none',
        p: 1.5,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: '#fff',
      }}
    >
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActive(pathname, href)
        return (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={active}
            sx={{ borderRadius: 1, color: active ? 'primary.main' : 'text.secondary' }}
          >
            <ListItemText
              primary={label}
              slotProps={{ primary: { sx: { fontSize: 14, fontWeight: active ? 600 : 500 } } }}
            />
          </ListItemButton>
        )
      })}
    </List>
  )
}
