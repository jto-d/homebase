import { CountryCode, Products, type Transaction as PlaidTransaction } from 'plaid'
import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { plaidClient, plaid } from '@/lib/plaid'
import { parseDateOnly, monthRange } from '@/lib/budget'
import { PlaidSyncResult } from './type'

/** Same guard as the budget mutations: a guessed id can't reach into another household. */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

builder.mutationFields((t) => ({
  createPlaidLinkToken: t.string({
    resolve: async (_root, _args, ctx) => {
      const { userId } = requireAuth(ctx)
      // Only set for OAuth-required banks (Chase, Capital One, ...) — Plaid rejects
      // any redirect_uri that isn't https and pre-registered in its Dashboard, so
      // this is left unset in local dev.
      const redirectUri = process.env.PLAID_REDIRECT_URI
      const res = await plaid(() =>
        plaidClient.linkTokenCreate({
          user: { client_user_id: userId },
          client_name: 'Homebase',
          products: [Products.Transactions],
          country_codes: [CountryCode.Us],
          language: 'en',
          ...(redirectUri ? { redirect_uri: redirectUri } : {}),
        })
      )
      return res.data.link_token
    },
  }),

  linkPlaidItem: t.prismaField({
    type: 'PlaidItem',
    args: {
      publicToken: t.arg.string({ required: true }),
      institutionName: t.arg.string({ required: true }),
      ownerId: t.arg.string({ description: 'Who this account belongs to. Omit for joint.' }),
    },
    resolve: async (query, _root, { publicToken, institutionName, ownerId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (ownerId) await assertMember(householdId, ownerId)

      const exchange = await plaid(() => plaidClient.itemPublicTokenExchange({ public_token: publicToken }))

      return prisma.plaidItem.create({
        ...query,
        data: {
          householdId,
          itemId: exchange.data.item_id,
          accessToken: exchange.data.access_token,
          institutionName,
          ownerId: ownerId ?? null,
        },
      })
    },
  }),

  unlinkPlaidItem: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const item = await prisma.plaidItem.findFirst({
        where: { id, householdId: requireAuth(ctx).householdId },
      })
      if (!item) throw new UserFacingError('Bank connection not found')
      // Imported transactions stay — unlinking removes the connection, not its history.
      await plaid(() => plaidClient.itemRemove({ access_token: item.accessToken }))
      await prisma.plaidItem.delete({ where: { id } })
      return true
    },
  }),

  /**
   * Pull new/changed/removed transactions for every linked bank via Plaid's
   * cursor-based /transactions/sync, and land them in the inbox unfiled.
   *
   * Each item's cursor is only persisted after its writes commit, so a failure
   * mid-sync re-fetches the same page next time instead of silently skipping it.
   */
  syncPlaidTransactions: t.field({
    type: PlaidSyncResult,
    resolve: async (_root, _args, ctx) => {
      const { householdId } = requireAuth(ctx)
      const [items, household] = await Promise.all([
        prisma.plaidItem.findMany({ where: { householdId } }),
        prisma.household.findUniqueOrThrow({
          where: { id: householdId },
          select: { budgetStartYear: true, budgetStartMonth: true },
        }),
      ])
      if (items.length === 0) throw new UserFacingError('Link a bank first')

      // Nothing before the budget's start month counts — the household hasn't
      // been tracking spend before then, so importing it would just be noise.
      const cutoff =
        household.budgetStartYear != null && household.budgetStartMonth != null
          ? monthRange({ year: household.budgetStartYear, month: household.budgetStartMonth }).gte
          : null

      let imported = 0
      let updated = 0
      let removed = 0

      for (const item of items) {
        let cursor = item.cursor ?? undefined
        const added: PlaidTransaction[] = []
        const modified: PlaidTransaction[] = []
        const removedIds: string[] = []

        let hasMore = true
        while (hasMore) {
          const res = await plaid(() => plaidClient.transactionsSync({ access_token: item.accessToken, cursor }))
          added.push(...res.data.added)
          modified.push(...res.data.modified)
          removedIds.push(...res.data.removed.map((r) => r.transaction_id))
          cursor = res.data.next_cursor
          hasMore = res.data.has_more
        }

        // Pending charges still change amount and id before they post, and
        // Plaid's sign convention is positive = money out — amount <= 0 is a
        // refund or deposit, neither of which belongs in a spend budget.
        const inScope = (txn: PlaidTransaction) =>
          !txn.pending && txn.amount > 0 && (cutoff == null || parseDateOnly(txn.date) >= cutoff)

        const toAdd = added.filter(inScope)
        const toUpdate = modified.filter(inScope)

        await prisma.$transaction(async (tx) => {
          if (toAdd.length > 0) {
            const created = await tx.transaction.createMany({
              data: toAdd.map((txn) => ({
                householdId,
                merchant: txn.merchant_name ?? txn.name,
                date: parseDateOnly(txn.date),
                amount: txn.amount,
                ownerId: item.ownerId,
                plaidTransactionId: txn.transaction_id,
              })),
              skipDuplicates: true,
            })
            imported += created.count
          }

          for (const txn of toUpdate) {
            const existing = await tx.transaction.findUnique({
              where: { plaidTransactionId: txn.transaction_id },
            })
            // ponytail: a modified transaction that's since gone pending, or been
            // refunded to zero, has nothing to reconcile against here — it's just
            // skipped rather than deleted. Revisit if that turns out to matter.
            if (!existing) continue

            const amountChanged = !existing.amount.equals(txn.amount)
            if (amountChanged) await tx.transactionSplit.deleteMany({ where: { transactionId: existing.id } })
            await tx.transaction.update({
              where: { id: existing.id },
              data: {
                merchant: txn.merchant_name ?? txn.name,
                date: parseDateOnly(txn.date),
                amount: txn.amount,
                ...(amountChanged ? { shared: null } : {}),
              },
            })
            updated++
          }

          if (removedIds.length > 0) {
            const deleted = await tx.transaction.deleteMany({
              where: { householdId, plaidTransactionId: { in: removedIds } },
            })
            removed += deleted.count
          }

          await tx.plaidItem.update({ where: { id: item.id }, data: { cursor, lastSyncedAt: new Date() } })
        })
      }

      return { imported, updated, removed }
    },
  }),
}))
