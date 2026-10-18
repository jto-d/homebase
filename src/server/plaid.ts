/**
 * Plaid transaction sync, shared by the v1 GraphQL mutation and v2's sync-on-load.
 * Takes `householdId` and does no auth of its own — callers gate first.
 */
import { type Transaction as PlaidTransaction, type AccountBase } from 'plaid'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { plaidClient, plaid, upsertPlaidAccounts } from '@/lib/plaid'
import { parseDateOnly, monthRange } from '@/lib/budget'

/**
 * Pull new/changed/removed transactions for every linked bank via Plaid's
 * cursor-based /transactions/sync, and land them in the inbox unfiled.
 *
 * Each item's cursor is only persisted after its writes commit, so a failure
 * mid-sync re-fetches the same page next time instead of silently skipping it.
 */
export async function syncPlaidTransactions(
  householdId: string
): Promise<{ imported: number; updated: number; removed: number }> {
  const [items, household] = await Promise.all([
    // investmentsOnly items (e.g. a brokerage) have no transactions product —
    // syncing them would just throw.
    prisma.plaidItem.findMany({ where: { householdId, investmentsOnly: false } }),
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
    // Keyed by account_id — every page of a sync repeats the same accounts.
    const accounts = new Map<string, AccountBase>()

    let hasMore = true
    while (hasMore) {
      const res = await plaid(() => plaidClient.transactionsSync({ access_token: item.accessToken, cursor }))
      added.push(...res.data.added)
      modified.push(...res.data.modified)
      removedIds.push(...res.data.removed.map((r) => r.transaction_id))
      for (const acct of res.data.accounts) accounts.set(acct.account_id, acct)
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
      const accountMap = await upsertPlaidAccounts(tx, item.id, [...accounts.values()])

      if (toAdd.length > 0) {
        const created = await tx.transaction.createMany({
          data: toAdd.map((txn) => ({
            householdId,
            merchant: txn.merchant_name ?? txn.name,
            date: parseDateOnly(txn.date),
            amount: txn.amount,
            ownerId: item.ownerId,
            plaidTransactionId: txn.transaction_id,
            accountId: accountMap.get(txn.account_id) ?? null,
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

        const overridden = existing.originalAmount != null
        const amountChanged = !existing.amount.equals(txn.amount)
        if (!overridden && amountChanged) {
          await tx.transactionSplit.deleteMany({ where: { transactionId: existing.id } })
        }
        await tx.transaction.update({
          where: { id: existing.id },
          data: {
            merchant: txn.merchant_name ?? txn.name,
            date: parseDateOnly(txn.date),
            accountId: accountMap.get(txn.account_id) ?? existing.accountId,
            ...(overridden
              ? { originalAmount: existing.amount.equals(txn.amount) ? null : txn.amount }
              : {
                  amount: txn.amount,
                  ...(amountChanged ? { shared: null } : {}),
                }),
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
}
