'use server'

import { UserFacingError } from '@/lib/errors'
import { syncPlaidTransactions } from '@/server/plaid'
import { requireHousehold } from '@/server/session'

/**
 * Background sync fired by the transactions page on load. Returns whether
 * anything changed, so the page only re-renders when there's something new.
 * Plaid's own messages (e.g. a bank needing re-login) come back as `error`;
 * anything else is logged and reported generically, never leaked.
 */
export async function syncTransactions(): Promise<{ changed: boolean; error?: string }> {
  const { householdId } = await requireHousehold()
  try {
    const { imported, updated, removed } = await syncPlaidTransactions(householdId)
    return { changed: imported + updated + removed > 0 }
  } catch (error) {
    if (error instanceof UserFacingError) return { changed: false, error: error.message }
    console.error(error)
    return { changed: false, error: 'Couldn’t sync with your bank' }
  }
}
