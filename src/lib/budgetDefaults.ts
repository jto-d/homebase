/**
 * What a new person's budget starts as.
 *
 * Seeded once per member, the first time their budget is opened. Every amount is
 * zero on purpose — the shape is the useful part, and a fabricated $400 grocery
 * budget is worse than an empty one because it looks like a decision someone made.
 */

export interface DefaultCategory {
  label: string
  icon: string
  /** Set only on savings categories — draws the year-to-date limit bar. */
  annualLimit?: number
}

export interface DefaultGroup {
  label: string
  icon: string
  categories: DefaultCategory[]
}

export const DEFAULT_GROUPS: DefaultGroup[] = [
  {
    label: 'Housing',
    icon: 'home',
    categories: [
      { label: 'Rent / mortgage', icon: 'home' },
      { label: 'Utilities', icon: 'bolt' },
      { label: 'Internet', icon: 'wifi' },
    ],
  },
  {
    label: 'Food',
    icon: 'restaurant',
    categories: [
      { label: 'Groceries', icon: 'local_grocery_store' },
      { label: 'Restaurants', icon: 'restaurant' },
    ],
  },
  {
    label: 'Transport',
    icon: 'directions_car',
    categories: [
      { label: 'Transportation', icon: 'directions_transit' },
      { label: 'Gas', icon: 'local_gas_station' },
    ],
  },
  {
    label: 'Health',
    icon: 'favorite',
    categories: [
      { label: 'Medicine / supplements', icon: 'favorite' },
      { label: 'Gym', icon: 'fitness_center' },
    ],
  },
  {
    label: 'Personal',
    icon: 'shopping_bag',
    categories: [
      { label: 'Personal spending', icon: 'shopping_bag' },
      { label: 'Phone', icon: 'smartphone' },
    ],
  },
  {
    label: 'Savings',
    icon: 'savings',
    // An ordinary group whose children carry a limit — that is all "savings" is.
    // The 2026 Roth IRA limit; editable inline once the row is on screen.
    categories: [{ label: 'Roth IRA', icon: 'savings', annualLimit: 7500 }],
  },
]

export const DEFAULT_INCOME: { label: string; sub: string }[] = [
  { label: 'Salary', sub: 'Net, monthly' },
]

/** What a node added from the UI starts as, before it is named. */
export const NEW_GROUP = { label: 'New group', icon: 'banknote' }
export const NEW_CATEGORY = { label: 'New category', icon: 'banknote' }
export const NEW_LINE_ITEM = { label: 'New line', icon: 'banknote' }
export const NEW_INCOME = { label: 'New income' }
