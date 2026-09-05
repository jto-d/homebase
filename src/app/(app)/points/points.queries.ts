import { graphql } from '@/gql'

export const PointsProgramsDocument = graphql(`
  query PointsPrograms {
    pointsPrograms {
      id
      name
      kind
      balance
      ownerId
      redemptions {
        id
        points
        date
        description
        ownerId
      }
    }
  }
`)

export const AddPointsProgramDocument = graphql(`
  mutation AddPointsProgram($name: String!, $kind: PointsProgramKind!, $ownerId: String!, $balance: Int!) {
    addPointsProgram(name: $name, kind: $kind, ownerId: $ownerId, balance: $balance) {
      id
    }
  }
`)

export const UpdatePointsProgramBalanceDocument = graphql(`
  mutation UpdatePointsProgramBalance($programId: String!, $balance: Int!) {
    updatePointsProgramBalance(programId: $programId, balance: $balance) {
      id
    }
  }
`)

export const RemovePointsProgramDocument = graphql(`
  mutation RemovePointsProgram($programId: String!) {
    removePointsProgram(programId: $programId)
  }
`)

export const LogPointsRedemptionDocument = graphql(`
  mutation LogPointsRedemption($programId: String!, $points: Int!, $date: String!, $description: String!, $ownerId: String) {
    logPointsRedemption(programId: $programId, points: $points, date: $date, description: $description, ownerId: $ownerId) {
      id
    }
  }
`)

export const DeletePointsRedemptionDocument = graphql(`
  mutation DeletePointsRedemption($redemptionId: String!) {
    deletePointsRedemption(redemptionId: $redemptionId)
  }
`)
