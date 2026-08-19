/** Annual-fee ROI for a card — ported from Anchor's src/utils/card.ts. */
import { annualValue, capturedInCycle, capturedYTD, type PerkLike } from './perk'
import { sumMoney } from './budget'
import { CARD_CATALOG } from './cardCatalog'

export type VerdictKey = 'worthIt' | 'marginal' | 'reviewIt' | 'noFee'

interface CardLike {
  design?: string | null
  openedDate?: string | null
  perks: readonly PerkLike[]
}

export function cardCaptured(card: CardLike): number {
  return sumMoney(card.perks, (p) => capturedInCycle(p, card.openedDate))
}

export function cardCapturedYTD(card: CardLike): number {
  return sumMoney(card.perks, (p) => capturedYTD(p))
}

export function cardAvailable(card: CardLike): number {
  return sumMoney(card.perks, (p) => annualValue(p))
}

/** How many of the card's perks have had at least one credit logged this year. */
export function cardPerksUsed(card: CardLike): number {
  return card.perks.filter((p) => capturedYTD(p) > 0).length
}

export function cardAnnualFee(card: CardLike): number {
  return CARD_CATALOG[card.design ?? '']?.annualFee ?? 0
}

export function cardNet(card: CardLike): number {
  return cardCapturedYTD(card) - cardAnnualFee(card)
}

export function cardVerdict(card: CardLike): { key: VerdictKey; label: string } {
  if (cardAnnualFee(card) === 0) return { key: 'noFee', label: 'No annual fee' }
  const net = cardNet(card)
  if (net >= 100) return { key: 'worthIt', label: 'Worth it' }
  if (net >= 0) return { key: 'marginal', label: 'Marginal' }
  return { key: 'reviewIt', label: 'Review it' }
}
