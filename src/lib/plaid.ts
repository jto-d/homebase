import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

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
