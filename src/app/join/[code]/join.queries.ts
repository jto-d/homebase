import { graphql } from '@/gql'

export const HouseholdInvitePreviewDocument = graphql(`
  query HouseholdInvitePreview($code: String!) {
    householdInvitePreview(code: $code) {
      inviterName
      householdFull
    }
  }
`)

export const AcceptHouseholdInviteDocument = graphql(`
  mutation AcceptHouseholdInvite($code: String!) {
    acceptHouseholdInvite(code: $code) {
      household {
        id
        members {
          id
          name
          email
          color
        }
      }
    }
  }
`)
