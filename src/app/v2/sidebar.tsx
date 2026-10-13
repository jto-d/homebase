'use client'

import styled from '@emotion/styled'
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
import { buttonReset, color, focusRing, IconButton, Menu, radius, Stack } from '@/components/v2'
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

const Rail = styled.div({
  width: V2_SIDEBAR_WIDTH,
  flex: 'none',
  overflow: 'hidden',
  transition: 'width 150ms ease, visibility 150ms',
  '&[data-collapsed]': { width: 0, visibility: 'hidden' },
})

const Nav = styled.nav({
  width: V2_SIDEBAR_WIDTH,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 8,
  backgroundColor: color.surfaceSunken,
  borderRight: `1px solid ${color.border}`,
})

const WorkspaceTrigger = styled(Menu.Trigger)({
  ...buttonReset,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  height: 32,
  padding: '0 8px',
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '-0.005em',
  color: color.text,
  '&:hover, &[data-popup-open]': { backgroundColor: color.selected },
})

const WorkspaceBadge = styled.span({
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  width: 20,
  height: 20,
  borderRadius: radius.md,
  backgroundColor: color.accent,
  color: '#fff',
  fontSize: 11,
  fontWeight: 700,
})

const CollapseButton = styled(IconButton)({
  '&:hover': { backgroundColor: color.selected },
})

const NavItem = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 30,
  padding: '0 8px',
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.45,
  color: color.textMuted,
  textDecoration: 'none',
  outline: 0,
  ...focusRing,
  '&:hover': { backgroundColor: color.hover },
  '&[aria-current="page"]': { color: color.text, backgroundColor: color.selected },
})

function WorkspaceMenu() {
  return (
    <Menu.Root>
      <WorkspaceTrigger>
        <WorkspaceBadge>H</WorkspaceBadge>
        Homebase
        <CaretDownIcon size={12} weight="bold" color={color.icon} />
      </WorkspaceTrigger>
      <Menu.Popup>
        <Menu.LinkItem closeOnClick render={<Link href="/v2/settings" />}>
          <GearIcon size={16} weight="bold" />
          Settings
        </Menu.LinkItem>
        <Menu.Item onClick={() => signOut({ callbackUrl: '/login' })}>
          <SignOutIcon size={16} weight="bold" />
          Log out
        </Menu.Item>
      </Menu.Popup>
    </Menu.Root>
  )
}

export function V2Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  return (
    <Rail data-collapsed={collapsed || undefined}>
      <Nav>
        <Stack direction="row" align="center" justify="space-between" gap={4}>
          <WorkspaceMenu />
          <CollapseButton onClick={toggle} aria-label="Collapse sidebar">
            <SidebarSimpleIcon size={16} weight="bold" />
          </CollapseButton>
        </Stack>
        <Stack gap={4}>
          {NAV_ITEMS.map(({ href, label, icon: NavIcon }) => (
            <NavItem key={href} href={href} aria-current={isActive(pathname, href) ? 'page' : undefined}>
              <NavIcon size={16} weight="bold" />
              {label}
            </NavItem>
          ))}
        </Stack>
      </Nav>
    </Rail>
  )
}
