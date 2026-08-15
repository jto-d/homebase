import { graphql } from '@/gql'

/**
 * One person's whole month. The node list arrives flat; `buildBudgetTree` shapes
 * it and rolls the money up.
 */
export const BudgetMonthDocument = graphql(`
  query BudgetMonth($year: Int!, $month: Int!, $ownerId: String!) {
    budgetMonth(year: $year, month: $month, ownerId: $ownerId) {
      budgetStartYear
      budgetStartMonth
      nodes {
        id
        parentId
        label
        icon
        position
        budget
        annualLimit
        isSavings
        spent
        ytd
      }
      income {
        id
        label
        sub
        amount
        position
      }
    }
  }
`)

export const AddBudgetNodeDocument = graphql(`
  mutation AddBudgetNode($ownerId: String!, $parentId: String, $label: String!, $icon: String!) {
    addBudgetNode(ownerId: $ownerId, parentId: $parentId, label: $label, icon: $icon)
  }
`)

export const RenameBudgetNodeDocument = graphql(`
  mutation RenameBudgetNode($id: String!, $label: String!) {
    renameBudgetNode(id: $id, label: $label)
  }
`)

export const DeleteBudgetNodeDocument = graphql(`
  mutation DeleteBudgetNode($id: String!) {
    deleteBudgetNode(id: $id)
  }
`)

export const SetNodeBudgetDocument = graphql(`
  mutation SetNodeBudget($id: String!, $year: Int!, $month: Int!, $budget: Float!) {
    setNodeBudget(id: $id, year: $year, month: $month, budget: $budget)
  }
`)

export const SetNodeAnnualLimitDocument = graphql(`
  mutation SetNodeAnnualLimit($id: String!, $annualLimit: Float) {
    setNodeAnnualLimit(id: $id, annualLimit: $annualLimit)
  }
`)

export const SetNodeContributedDocument = graphql(`
  mutation SetNodeContributed($id: String!, $year: Int!, $month: Int!, $amount: Float!) {
    setNodeContributed(id: $id, year: $year, month: $month, amount: $amount)
  }
`)

export const AddIncomeSourceDocument = graphql(`
  mutation AddIncomeSource($ownerId: String!, $label: String!, $amount: Float!) {
    addIncomeSource(ownerId: $ownerId, label: $label, amount: $amount)
  }
`)

export const RenameIncomeSourceDocument = graphql(`
  mutation RenameIncomeSource($id: String!, $label: String!) {
    renameIncomeSource(id: $id, label: $label)
  }
`)

export const SetIncomeAmountDocument = graphql(`
  mutation SetIncomeAmount($id: String!, $amount: Float!) {
    setIncomeAmount(id: $id, amount: $amount)
  }
`)

export const RemoveIncomeSourceDocument = graphql(`
  mutation RemoveIncomeSource($id: String!) {
    removeIncomeSource(id: $id)
  }
`)

export const SetBudgetStartDocument = graphql(`
  mutation SetBudgetStart($year: Int!, $month: Int!) {
    setBudgetStart(year: $year, month: $month)
  }
`)

export const CopyBudgetFromDocument = graphql(`
  mutation CopyBudgetFrom($fromOwnerId: String!, $toOwnerId: String!, $year: Int!, $month: Int!) {
    copyBudgetFrom(fromOwnerId: $fromOwnerId, toOwnerId: $toOwnerId, year: $year, month: $month)
  }
`)
