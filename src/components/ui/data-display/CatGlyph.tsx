'use client'

import Box from '@mui/material/Box'
import type { SxProps } from '@mui/material/styles'
import HomeIcon from '@mui/icons-material/HomeOutlined'
import BoltIcon from '@mui/icons-material/BoltOutlined'
import WifiIcon from '@mui/icons-material/WifiOutlined'
import RestaurantIcon from '@mui/icons-material/RestaurantOutlined'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCarOutlined'
import DirectionsTransitIcon from '@mui/icons-material/DirectionsTransitOutlined'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStationOutlined'
import FavoriteIcon from '@mui/icons-material/FavoriteBorderOutlined'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenterOutlined'
import HeartPulseIcon from '@mui/icons-material/MonitorHeartOutlined'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBagOutlined'
import SmartphoneIcon from '@mui/icons-material/SmartphoneOutlined'
import SavingsIcon from '@mui/icons-material/SavingsOutlined'
import ShieldIcon from '@mui/icons-material/ShieldOutlined'
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined'
import BeachAccessIcon from '@mui/icons-material/BeachAccessOutlined'
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined'
import BanknoteIcon from '@mui/icons-material/PaidOutlined'
import { brand } from '@/lib/theme'

/**
 * Icon slugs a budget node can carry. Stored as a string on `BudgetNode.icon`
 * so the DB never holds a component reference; anything unrecognised falls back
 * to a banknote rather than rendering an empty square.
 */
const ICON_MAP: Record<string, React.ElementType> = {
  home: HomeIcon,
  bolt: BoltIcon,
  wifi: WifiIcon,
  restaurant: RestaurantIcon,
  dining: RestaurantIcon,
  local_grocery_store: ShoppingCartIcon,
  directions_car: DirectionsCarIcon,
  car: DirectionsCarIcon,
  directions_transit: DirectionsTransitIcon,
  local_gas_station: LocalGasStationIcon,
  favorite: FavoriteIcon,
  fitness_center: FitnessCenterIcon,
  heartPulse: HeartPulseIcon,
  shopping_bag: ShoppingBagIcon,
  smartphone: SmartphoneIcon,
  savings: SavingsIcon,
  piggyBank: SavingsIcon,
  shield: ShieldIcon,
  landmark: AccountBalanceIcon,
  beach_access: BeachAccessIcon,
  palmtree: BeachAccessIcon,
  wallet: WalletIcon,
  trendingUp: TrendingUpIcon,
  calendar: CalendarIcon,
  banknote: BanknoteIcon,
}

const TONE_STYLES = {
  neutral: { bgcolor: 'grey.100', color: 'text.secondary' },
  // Literal, not `primary.50`: createTheme generates no numeric shades for
  // `primary`, so that token resolves to nothing and the glyph loses its ground.
  accent: { bgcolor: brand.teal[50], color: 'primary.main' },
  amber: { bgcolor: brand.gold[50], color: brand.amber[700] },
  red: { bgcolor: brand.red[50], color: brand.red[600] },
} as const

type Tone = keyof typeof TONE_STYLES

interface CatGlyphProps {
  icon: string
  size?: number
  tone?: Tone
  sx?: SxProps
}

/** The rounded-square icon tile that fronts every category, group and panel. */
export function CatGlyph({ icon, size = 32, tone = 'neutral', sx }: CatGlyphProps) {
  const Icon = ICON_MAP[icon] ?? BanknoteIcon

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.3)}px`,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        ...TONE_STYLES[tone],
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.52) }} />
    </Box>
  )
}
