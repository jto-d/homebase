/**
 * Multiplier / best-card-for-category engine — ported from Anchor's
 * src/utils/cardRewards.ts, with its tiny cardDesigns.ts and issuer.ts folded
 * in rather than kept as separate one-function files.
 */
import { CARD_CATALOG, FALLBACK_CARD } from './cardCatalog'

export type CategoryKey =
  | 'dining'
  | 'groceries'
  | 'travel'
  | 'hotels'
  | 'gas'
  | 'transit'
  | 'streaming'
  | 'drugstore'
  | 'retail'
  | 'portal'
  | 'base'

export type CardType = 'cashback' | 'points'

export interface Category {
  key: CategoryKey
  label: string
  icon: string
  blurb: string
}

export interface Reward {
  cat: CategoryKey
  rate: number
  unit: 'x' | '%'
  note?: string
  viaBase?: boolean
}

export interface RewardCardData {
  id: string
  name: string
  issuer: string
  lastFour: string
  design?: string
  type: CardType
  network: string
  rewards: Reward[]
}

export interface RankedCard {
  card: RewardCardData
  reward: Reward
  winner: boolean
  viaBase: boolean
}

export const CATEGORIES: Category[] = [
  { key: 'dining', label: 'Dining', icon: 'dining', blurb: 'Restaurants, bars, takeout & delivery' },
  { key: 'groceries', label: 'Groceries', icon: 'local_grocery_store', blurb: 'Supermarkets & grocery stores' },
  { key: 'travel', label: 'Travel', icon: 'luggage', blurb: 'Flights, trains & travel portals' },
  { key: 'hotels', label: 'Hotels', icon: 'hotel', blurb: 'Hotels & lodging' },
  { key: 'gas', label: 'Gas', icon: 'local_gas_station', blurb: 'Fuel & gas stations' },
  { key: 'transit', label: 'Transit', icon: 'directions_transit', blurb: 'Rideshare, parking, tolls & transit' },
  { key: 'streaming', label: 'Streaming', icon: 'streaming', blurb: 'Streaming subscriptions' },
  { key: 'drugstore', label: 'Drugstores', icon: 'drugstore', blurb: 'Pharmacies & drugstores' },
  { key: 'retail', label: 'Online retail', icon: 'shopping_bag', blurb: 'Online shopping & marketplaces' },
  { key: 'portal', label: 'Portals', icon: 'portal', blurb: 'Card-specific portals & search engines' },
  { key: 'base', label: 'Everything else', icon: 'category', blurb: 'The flat catch-all rate' },
]

export const CAT: Record<CategoryKey, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<CategoryKey, Category>

export const TYPE_META: Record<CardType, { label: string; icon: string }> = {
  cashback: { label: 'Cash back', icon: 'percent' },
  points: { label: 'Points', icon: 'redeem' },
}

export function cardRate(card: RewardCardData, catKey: CategoryKey): Reward | null {
  const direct = card.rewards.find((r) => r.cat === catKey)
  if (direct) return direct
  const base = card.rewards.find((r) => r.cat === 'base')
  return base ? { ...base, cat: catKey, viaBase: true } : null
}

export function topRewards(card: RewardCardData): Reward[] {
  return [...card.rewards].filter((r) => r.cat !== 'base').sort((a, b) => b.rate - a.rate)
}

export const baseReward = (card: RewardCardData): Reward | null => card.rewards.find((r) => r.cat === 'base') ?? null

export function rankForCategory(cards: RewardCardData[], catKey: CategoryKey): RankedCard[] {
  const rows = cards
    .map((card) => ({ card, reward: cardRate(card, catKey) }))
    .filter((r): r is { card: RewardCardData; reward: Reward } => r.reward !== null)
    .sort((a, b) => b.reward.rate - a.reward.rate)
  const top = rows.length ? rows[0].reward.rate : 0
  return rows.map((r) => ({ ...r, winner: r.reward.rate === top, viaBase: !!r.reward.viaBase }))
}

export const fmtRate = (r: Reward): string => (r.unit === 'x' ? `${r.rate}×` : `${r.rate}%`)

export interface CardDesign {
  color: string
  text: string
}

export function resolveCardDesign(design?: string | null): CardDesign {
  const entry = (design && CARD_CATALOG[design]) || FALLBACK_CARD
  return { color: entry.color, text: entry.text }
}

/** Issuer name → short label (e.g. for compact card chips). */
export function issuerShort(issuer: string): string {
  const lower = issuer.toLowerCase()
  if (lower.includes('american express')) return 'Amex'
  if (lower.includes('bank of america')) return 'BofA'
  return issuer.split(' ')[0]
}

export function dbCardToRewardCard(card: { id: string; name: string; issuer: string; lastFour?: string | null; design?: string | null }): RewardCardData {
  const entry = (card.design && CARD_CATALOG[card.design]) || FALLBACK_CARD
  const unit: 'x' | '%' = entry.type === 'points' ? 'x' : '%'
  return {
    id: card.id,
    name: card.name,
    issuer: card.issuer,
    lastFour: card.lastFour ?? '',
    design: card.design ?? undefined,
    type: entry.type,
    network: entry.network,
    rewards: entry.rewards.map((r) => ({ ...r, unit })),
  }
}
