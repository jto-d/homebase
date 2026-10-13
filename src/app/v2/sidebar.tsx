'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  ArrowsClockwiseIcon,
  ArrowsLeftRightIcon,
  BankIcon,
  CaretDownIcon,
  ChartPieSliceIcon,
  CoinsIcon,
  GearIcon,
  HouseIcon,
  ReceiptIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  WalletIcon,
  type Icon,
} from '@phosphor-icons/react'
import { brand } from '@/lib/theme'
import { useSidebar } from './sidebar-context'

export const V2_SIDEBAR_WIDTH = 232

const NAV_ITEMS: { href: string; label: string; icon: Icon }[] = [
  { href: '/v2/home', label: 'Home', icon: HouseIcon },
  { href: '/v2/budget', label: 'Budget', icon: ChartPieSliceIcon },
  { href: '/v2/transactions', label: 'Transactions', icon: ArrowsLeftRightIcon },
  { href: '/v2/accounts', label: 'Accounts', icon: BankIcon },
  { href: '/v2/split', label: 'Split', icon: ReceiptIcon },
  { href: '/v2/subscriptions', label: 'Subscriptions', icon: ArrowsClockwiseIcon },
  { href: '/v2/wallet', label: 'Wallet', icon: WalletIcon },
  { href: '/v2/points', label: 'Points', icon: CoinsIcon },
]

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/')
}

function WorkspaceMenu() {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
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
        <Typography variant="bodyStrong" sx={{ fontSize: 13, fontWeight: 500 }}>
          Homebase
        </Typography>
        <CaretDownIcon size={12} weight="bold" color={brand.zinc[500]} />
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { mt: 0.5, minWidth: 200, borderRadius: '6px', boxShadow: brand.shadow.md, border: '1px solid', borderColor: 'divider' } },
          list: { dense: true },
        }}
      >
        <MenuItem disableRipple component={Link} href="/v2/settings" onClick={() => setAnchor(null)}>
          <ListItemIcon>
            <GearIcon size={16} weight="bold" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 500 } } }}>Settings</ListItemText>
        </MenuItem>
        <MenuItem disableRipple onClick={() => signOut({ callbackUrl: '/login' })}>
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
  const { collapsed, toggle } = useSidebar()

  return (
    <Box
      sx={{
        width: collapsed ? 0 : V2_SIDEBAR_WIDTH,
        flex: 'none',
        overflow: 'hidden',
        visibility: collapsed ? 'hidden' : 'visible',
        transition: 'width 150ms ease, visibility 150ms',
      }}
    >
      <Box
        component="nav"
        sx={{
          width: V2_SIDEBAR_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          px: 1,
          py: 1,
          height: '100vh',
          bgcolor: brand.zinc[50],
          borderRight: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}>
          <WorkspaceMenu />
          <IconButton
            disableRipple
            size="small"
            onClick={toggle}
            aria-label="Collapse sidebar"
            sx={{ borderRadius: '6px', color: brand.zinc[500], flex: 'none', '&:hover': { bgcolor: brand.zinc[200], color: brand.zinc[900] } }}
          >
            <SidebarSimpleIcon size={16} weight="bold" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV_ITEMS.map(({ href, label, icon: NavIcon }) => {
            const active = isActive(pathname, href)
            return (
              <ButtonBase
                disableRipple
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
    </Box>
  )
}
