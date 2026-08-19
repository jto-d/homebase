import { graphql } from '@/gql'

export const CreditCardsDocument = graphql(`
  query CreditCards {
    creditCards {
      id
      name
      issuer
      design
      lastFour
      openedDate
      ownerId
      annualFee
      perks {
        id
        name
        totalAmount
        period
        resetType
        enrollmentRequired
        notes
        perkCredits {
          id
          amount
          date
          description
        }
      }
    }
  }
`)

export const AddCardDocument = graphql(`
  mutation AddCard($catalogKey: String!, $ownerId: String!, $lastFour: String, $openedDate: String) {
    addCard(catalogKey: $catalogKey, ownerId: $ownerId, lastFour: $lastFour, openedDate: $openedDate) {
      id
    }
  }
`)

export const UpdateCardDocument = graphql(`
  mutation UpdateCard($cardId: String!, $ownerId: String!, $lastFour: String, $openedDate: String) {
    updateCard(cardId: $cardId, ownerId: $ownerId, lastFour: $lastFour, openedDate: $openedDate) {
      id
    }
  }
`)

export const RemoveCardDocument = graphql(`
  mutation RemoveCard($cardId: String!) {
    removeCard(cardId: $cardId)
  }
`)

export const LogPerkCreditDocument = graphql(`
  mutation LogPerkCredit($perkId: String!, $amount: Float!, $date: String!, $description: String) {
    logPerkCredit(perkId: $perkId, amount: $amount, date: $date, description: $description) {
      id
    }
  }
`)

export const DeletePerkCreditDocument = graphql(`
  mutation DeletePerkCredit($creditId: String!) {
    deletePerkCredit(creditId: $creditId)
  }
`)
