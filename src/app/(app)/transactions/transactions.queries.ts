import { graphql } from '@/gql'

/**
 * One document for the page: the transaction list plus the budget leaves it
 * files into, since every row turns a budgetId back into a path for display.
 *
 * `budgetLeaves` rather than one person's month — filing spans both members'
 * trees, and only a leaf can be filed into.
 */
export const TransactionsMonthDocument = graphql(`
  query TransactionsMonth($year: Int!, $month: Int!) {
    household {
      budgetStartYear
      budgetStartMonth
    }
    budgetLeaves {
      id
      label
      path
      ownerId
    }
    transactions(year: $year, month: $month) {
      id
      merchant
      date
      amount
      note
      ownerId
      shared
      account {
        name
        mask
      }
      splits {
        id
        budgetId
        amount
      }
    }
    plaidItems {
      id
      institutionName
      ownerId
      lastSyncedAt
    }
  }
`)

export const CreateTransactionDocument = graphql(`
  mutation CreateTransaction($merchant: String!, $date: String!, $amount: Float!, $ownerId: String) {
    createTransaction(merchant: $merchant, date: $date, amount: $amount, ownerId: $ownerId) {
      id
    }
  }
`)

export const SetTransactionCategoryDocument = graphql(`
  mutation SetTransactionCategory($id: String!, $path: String) {
    setTransactionCategory(id: $id, path: $path)
  }
`)

export const SetTransactionSharedDocument = graphql(`
  mutation SetTransactionShared($id: String!, $shared: Boolean) {
    setTransactionShared(id: $id, shared: $shared)
  }
`)

export const SetTransactionSplitAmountDocument = graphql(`
  mutation SetTransactionSplitAmount($id: String!, $partnerAmount: Float!) {
    setTransactionSplitAmount(id: $id, partnerAmount: $partnerAmount)
  }
`)

export const DeleteTransactionDocument = graphql(`
  mutation DeleteTransaction($id: String!) {
    deleteTransaction(id: $id)
  }
`)

export const CreatePlaidLinkTokenDocument = graphql(`
  mutation CreatePlaidLinkToken {
    createPlaidLinkToken
  }
`)

export const LinkPlaidItemDocument = graphql(`
  mutation LinkPlaidItem($publicToken: String!, $institutionName: String!, $ownerId: String) {
    linkPlaidItem(publicToken: $publicToken, institutionName: $institutionName, ownerId: $ownerId) {
      id
    }
  }
`)

export const SyncPlaidTransactionsDocument = graphql(`
  mutation SyncPlaidTransactions {
    syncPlaidTransactions {
      imported
      updated
      removed
    }
  }
`)
