'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { CaretDownIcon, GearIcon, HouseIcon, SignOutIcon, type Icon } from '@phosphor-icons/react'
import { brand } from '@/lib/theme'

export const V2_SIDEBAR_WIDTH = 232

const NAV_ITEMS: { href: string; label: string; icon: Icon }[] = [
  { href: '/v2/home', label: 'Home', icon: HouseIcon },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

function WorkspaceMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          justifyContent: 'flex-start',
          px: 1,
          height: 32,
          borderRadius: '6px',
          '&:hover, &[aria-expanded="true"]': { bgcolor: brand.zinc[200] },
        }}
        aria-haspopup="menu"
        aria-expanded={anchor ? 'true' : undefined}
      >
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '6px',
            bgcolor: brand.teal[600],
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 700,
            flex: 'none',
          }}
        >
          H
        </Box>
        <Typography variant="bodyStrong" sx={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'left' }}>
          Homebase
        </Typography>
        <CaretDownIcon size={12} weight="bold" color={brand.zinc[500]} />
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        slotProps={{
          paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: '6px', boxShadow: brand.shadow.md, border: '1px solid', borderColor: 'divider' } },
          list: { dense: true },
        }}
      >
        <MenuItem component={Link} href="/v2/settings" onClick={() => setAnchor(null)}>
          <ListItemIcon>
            <GearIcon size={16} weight="bold" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 500 } } }}>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
          <ListItemIcon>
            <SignOutIcon size={16} weight="bold" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 500 } } }}>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}

export function V2Sidebar() {
  const pathname = usePathname()

  return (
    <Box
      component="nav"
      sx={{
        width: V2_SIDEBAR_WIDTH,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        px: 1,
        py: 1,
        height: '100%',
        bgcolor: brand.zinc[50],
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <WorkspaceMenu />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map(({ href, label, icon: NavIcon }) => {
          const active = isActive(pathname, href)
          return (
            <ButtonBase
              key={href}
              component={Link}
              href={href}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 1.25,
                px: 1,
                height: 30,
                borderRadius: '6px',
                color: active ? 'text.primary' : 'text.secondary',
                bgcolor: active ? brand.zinc[200] : 'transparent',
                '&:hover': { bgcolor: active ? brand.zinc[200] : brand.zinc[100] },
              }}
            >
              <NavIcon size={16} weight="bold" />
              <Typography variant="body" sx={{ fontSize: 13, fontWeight: 500, color: 'inherit' }}>
                {label}
              </Typography>
            </ButtonBase>
          )
        })}
      </Box>
    </Box>
  )
}
