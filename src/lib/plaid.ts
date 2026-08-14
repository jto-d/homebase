import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
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
