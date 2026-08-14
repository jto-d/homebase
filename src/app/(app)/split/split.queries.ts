import { graphql } from '@/gql'

/**
 * One document for the page: the all-time balance, this month's cross-owed
 * splits, and this month's settlements. `household` rides along for the
 * stepper's back-stop, same as the transactions page.
 */
export const SplitPageDocument = graphql(`
  query SplitPage($year: Int!, $month: Int!) {
    household {
      budgetStartYear
      budgetStartMonth
    }
    splitPage(year: $year, month: $month) {
      outstanding {
        debtorUserId
        creditorUserId
        amount
      }
      items {
        transactionId
        merchant
        date
        payerUserId
        debtorUserId
        amount
      }
      settlements {
        id
        fromUserId
        toUserId
        amount
        date
        note
      }
    }
  }
`)

export const CreateSettlementDocument = graphql(`
  mutation CreateSettlement($fromUserId: String!, $toUserId: String!, $amount: Float!, $date: String!, $note: String) {
    createSettlement(fromUserId: $fromUserId, toUserId: $toUserId, amount: $amount, date: $date, note: $note) {
      id
    }
  }
`)

export const DeleteSettlementDocument = graphql(`
  mutation DeleteSettlement($id: String!) {
    deleteSettlement(id: $id)
  }
`)
