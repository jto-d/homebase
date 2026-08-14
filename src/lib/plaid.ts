import { Configuration, PlaidApi, PlaidEnvironments, type AccountBase } from 'plaid'
import type { Prisma } from '@prisma/client'
import { UserFacingError } from '@/lib/errors'

/**
 * The Plaid client singleton, mirroring src/lib/prisma.ts. `PLAID_ENV` defaults
 * to sandbox so a missing env var fails loudly at Plaid (bad keys) rather than
 * silently hitting production.
 */
const env = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments

export const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
)

/** Plaid SDK failures are axios errors; the useful message is in response.data. */
export async function plaid<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call()
  } catch (e) {
    const data = (e as { response?: { data?: { error_code?: string; error_message?: string } } })
      .response?.data
    if (!data?.error_message) throw e
    console.error('Plaid error', data)
    throw new UserFacingError(`Plaid: ${data.error_message}`)
  }
}

/**
 * Upsert a page of Plaid's account payload (dumb mirror, overwritten wholesale
 * every call — see PlaidAccount's schema comment) and return a
 * Plaid account_id -> PlaidAccount.id map for stamping onto transactions.
 * Shared by the sync mutation and the one-off backfill script.
 */
export async function upsertPlaidAccounts(
  tx: Prisma.TransactionClient,
  itemId: string,
  accounts: AccountBase[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  for (const acct of accounts) {
    const row = await tx.plaidAccount.upsert({
      where: { plaidAccountId: acct.account_id },
      create: {
        plaidAccountId: acct.account_id,
        name: acct.name,
        mask: acct.mask,
        type: acct.type,
        subtype: acct.subtype,
        itemId,
      },
      update: {
        name: acct.name,
        mask: acct.mask,
        type: acct.type,
        subtype: acct.subtype,
      },
    })
    map.set(acct.account_id, row.id)
  }
  return map
}
