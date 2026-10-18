import { CountryCode, Products } from 'plaid'
import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { plaidClient, plaid } from '@/lib/plaid'
import { syncPlaidTransactions } from '@/server/plaid'
import { PlaidSyncResult } from './type'

/** Same guard as the budget mutations: a guessed id can't reach into another household. */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

builder.mutationFields((t) => ({
  createPlaidLinkToken: t.string({
    args: {
      investments: t.arg.boolean({ description: 'Link for balances/holdings (brokerage) rather than transactions.' }),
    },
    resolve: async (_root, { investments }, ctx) => {
      const { userId } = requireAuth(ctx)
      // Only set for OAuth-required banks (Chase, Capital One, ...) — Plaid rejects
      // any redirect_uri that isn't https and pre-registered in its Dashboard, so
      // this is left unset in local dev.
      const redirectUri = process.env.PLAID_REDIRECT_URI
      const res = await plaid(() =>
        plaidClient.linkTokenCreate({
          user: { client_user_id: userId },
          client_name: 'Homebase',
          products: investments ? [Products.Investments] : [Products.Transactions],
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
      investmentsOnly: t.arg.boolean({ description: 'Excludes this item from transaction sync.' }),
    },
    resolve: async (query, _root, { publicToken, institutionName, ownerId, investmentsOnly }, ctx) => {
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
          investmentsOnly: investmentsOnly ?? false,
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

  /** Pull new and changed transactions from every linked bank — see src/server/plaid.ts. */
  syncPlaidTransactions: t.field({
    type: PlaidSyncResult,
    resolve: (_root, _args, ctx) => syncPlaidTransactions(requireAuth(ctx).householdId),
  }),
}))
