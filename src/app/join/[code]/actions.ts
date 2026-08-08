'use server'

import { cookies } from 'next/headers'
import { INVITE_COOKIE } from '@/auth'

/**
 * Park the invite code in a cookie just before handing off to Google, so the
 * `jwt` callback can create a brand-new partner directly into the inviter's
 * household instead of giving them a solo household to merge away.
 *
 * `sameSite: 'lax'` is what makes this work: the cookie has to survive a
 * top-level navigation back from accounts.google.com, which 'strict' would
 * drop. It is short-lived because it only needs to outlive one OAuth round trip.
 */
export async function stashInviteCode(code: string): Promise<void> {
  const store = await cookies()
  store.set(INVITE_COOKIE, code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 10,
  })
}
