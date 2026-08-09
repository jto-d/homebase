import { graphql } from '@/gql'

/**
 * One document for the page: the transaction list plus the budget nodes it files
 * into, since every row needs to turn a budgetId into a name.
 *
 * `budgetLeaves` rather than one person's month — filing spans both members'
 * trees, and only a leaf can be filed into.
 */
export const TransactionsMonthDocument = graphql(`
  query TransactionsMonth($year: Int!, $month: Int!) {
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
      splits {
        id
        budgetId
        amount
      }
    }
  }
`)

export const CreateTransactionDocument = graphql(`
  mutation CreateTransaction(
    $merchant: String!
    $date: String!
    $amount: Float!
    $ownerId: String
    $budgetId: String
  ) {
    createTransaction(
      merchant: $merchant
      date: $date
      amount: $amount
      ownerId: $ownerId
      budgetId: $budgetId
    ) {
      id
    }
  }
`)

export const SetTransactionSplitsDocument = graphql(`
  mutation SetTransactionSplits($transactionId: String!, $splits: [TransactionSplitInput!]!) {
    setTransactionSplits(transactionId: $transactionId, splits: $splits) {
      id
      splits {
        id
        budgetId
        amount
      }
    }
  }
`)

export const DeleteTransactionDocument = graphql(`
  mutation DeleteTransaction($id: String!) {
    deleteTransaction(id: $id)
  }
`)
