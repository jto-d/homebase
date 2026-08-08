import { graphql } from '@/gql'

/**
 * The one query the app shell runs. `me { id }` rides along so the shell can
 * tell which member is the viewer without trusting the session payload — the
 * household is the source of truth for names and colors, and it is always
 * current, including immediately after pairing.
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
