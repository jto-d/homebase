import { builder } from './builder'

import './user/type'
import './user/queries'
import './household/type'
import './household/queries'
import './householdInvite/type'
import './householdInvite/queries'
import './householdInvite/mutations'

export const schema = builder.toSchema()
