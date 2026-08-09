import { builder } from './builder'

import './user/type'
import './user/queries'
import './household/type'
import './household/queries'
import './householdInvite/type'
import './householdInvite/queries'
import './householdInvite/mutations'
import './budget/type'
import './budget/queries'
import './budget/mutations'

export const schema = builder.toSchema()
