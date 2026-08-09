import { graphql } from '@/gql'

/**
 * The one query the app shell runs. `me { id }` rides along so the shell knows
 * which member is the viewer without trusting the session payload — the household
 * is the source of truth, and is current even immediately after pairing.
 */
export const HouseholdDocument = graphql(`
  query Household {
    me {
      id
    }
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
`)

export const CreateHouseholdInviteDocument = graphql(`
  mutation CreateHouseholdInvite {
    createHouseholdInvite {
      code
      url
    }
  }
`)
