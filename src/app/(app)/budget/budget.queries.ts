import { graphql } from '@/gql'

export const BudgetMonthDocument = graphql(`
  query BudgetMonth($year: Int!, $month: Int!) {
    budgetMonth(year: $year, month: $month) {
      id
      name
      ownerId
      amount
      spent
    }
  }
`)

export const CreateBudgetDocument = graphql(`
  mutation CreateBudget($name: String!, $amount: Float!, $ownerId: String!) {
    createBudget(name: $name, amount: $amount, ownerId: $ownerId) {
      id
    }
  }
`)

export const UpdateBudgetDocument = graphql(`
  mutation UpdateBudget($id: String!, $amount: Float) {
    updateBudget(id: $id, amount: $amount) {
      id
      amount
    }
  }
`)

export const DeleteBudgetDocument = graphql(`
  mutation DeleteBudget($id: String!) {
    deleteBudget(id: $id)
  }
`)
