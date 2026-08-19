import { graphql } from '@/gql'

export const AccountsDocument = graphql(`
  query Accounts {
    accounts {
      id
      name
      mask
      kind
      subtype
      institutionName
      ownerId
      balance
      holdings {
        ticker
        name
        detail
        value
      }
    }
  }
`)

/**
 * Distinct operation names from transactions.queries.ts's plaid mutations —
 * this one always links for balances/holdings, never transactions.
 */
export const CreateInvestmentLinkTokenDocument = graphql(`
  mutation CreateInvestmentLinkToken {
    createPlaidLinkToken(investments: true)
  }
`)

export const LinkInvestmentAccountDocument = graphql(`
  mutation LinkInvestmentAccount($publicToken: String!, $institutionName: String!, $ownerId: String) {
    linkPlaidItem(
      publicToken: $publicToken
      institutionName: $institutionName
      ownerId: $ownerId
      investmentsOnly: true
    ) {
      id
    }
  }
`)
