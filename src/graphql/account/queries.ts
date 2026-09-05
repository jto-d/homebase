import type { AccountBase, Holding as PlaidHolding, Security } from 'plaid'
import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { plaidClient, plaid, upsertPlaidAccounts } from '@/lib/plaid'
import { Account } from './type'

/** Equities/ETFs/mutual funds have a share count worth showing; everything else doesn't. */
const SHARE_TYPES = new Set(['equity', 'etf', 'mutual fund'])

builder.queryFields((t) => ({
  /**
   * Every cash and investment account across the household's linked banks,
   * with live balances (and holdings, for investment accounts) pulled from
   * Plaid on every call — there is no balance column to go stale.
   */
  accounts: t.field({
    type: [Account],
    resolve: async (_root, _args, ctx) => {
      const { householdId } = requireAuth(ctx)
      const items = await prisma.plaidItem.findMany({ where: { householdId } })

      const perItem = await Promise.all(
        items.map(async (item) => {
          const balances = await plaid(() => plaidClient.accountsBalanceGet({ access_token: item.accessToken }))
          const kept = balances.data.accounts.filter(
            (a: AccountBase) => a.type === 'depository' || a.type === 'investment'
          )
          if (kept.length === 0) return []

          const existing = await prisma.plaidAccount.findMany({
            where: { itemId: item.id },
            select: { id: true, plaidAccountId: true, nickname: true },
          })
          const byPlaid = new Map(existing.map((row) => [row.plaidAccountId, row]))
          const missing = kept.filter((a) => !byPlaid.has(a.account_id))
          if (missing.length > 0) {
            await prisma.$transaction((tx) => upsertPlaidAccounts(tx, item.id, missing))
            const created = await prisma.plaidAccount.findMany({
              where: { itemId: item.id, plaidAccountId: { in: missing.map((a) => a.account_id) } },
              select: { id: true, plaidAccountId: true, nickname: true },
            })
            for (const row of created) byPlaid.set(row.plaidAccountId, row)
          }

          // Plaid types some accounts (e.g. a Merrill CMA) as `depository` even
          // though they hold securities — investmentsOnly is the household's own
          // signal that this item is a brokerage, so it forces the holdings call
          // regardless of what Plaid calls the account. Not every account on an
          // investmentsOnly item necessarily has holdings (e.g. a plain checking
          // account linked investments-only), so the call can legitimately fail
          // for accounts with no investments product — caught below rather than
          // failing the whole accounts query.
          const hasInvestment = item.investmentsOnly || kept.some((a) => a.type === 'investment')
          const holdingsByAccount = new Map<string, PlaidHolding[]>()
          const securities = new Map<string, Security>()
          if (hasInvestment) {
            try {
              const inv = await plaid(() => plaidClient.investmentsHoldingsGet({ access_token: item.accessToken }))
              for (const s of inv.data.securities) securities.set(s.security_id, s)
              for (const h of inv.data.holdings) {
                if (!holdingsByAccount.has(h.account_id)) holdingsByAccount.set(h.account_id, [])
                holdingsByAccount.get(h.account_id)!.push(h)
              }
            } catch {
              // No investments product on this item — leave holdings empty.
            }
          }

          return kept.map((a) => ({
            id: byPlaid.get(a.account_id)!.id,
            name: byPlaid.get(a.account_id)?.nickname || a.name,
            mask: a.mask,
            kind: a.type === 'investment' || holdingsByAccount.has(a.account_id) ? 'investment' : 'cash',
            subtype: a.subtype,
            institutionName: item.institutionName,
            ownerId: item.ownerId,
            balance: a.balances.current ?? a.balances.available ?? 0,
            holdings: (holdingsByAccount.get(a.account_id) ?? []).map((h) => {
              const security = securities.get(h.security_id)
              return {
                ticker: security?.ticker_symbol ?? '—',
                name: security?.name ?? 'Unknown security',
                detail: security?.type && SHARE_TYPES.has(security.type) ? `${Math.round(h.quantity * 100) / 100} sh` : '',
                value: h.institution_value,
              }
            }),
          }))
        })
      )

      return perItem.flat().sort((a, b) => (a.kind === b.kind ? b.balance - a.balance : a.kind === 'cash' ? -1 : 1))
    },
  }),
}))
