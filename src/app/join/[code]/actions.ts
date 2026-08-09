'use server'

import { cookies } from 'next/headers'
import { INVITE_COOKIE } from '@/auth'

/**
 * Park the invite code in a cookie before handing off to Google, so the `jwt`
 * callback creates the partner directly into the inviter's household.
 *
 * `sameSite: 'lax'` is what makes it work — the cookie must survive the top-level
 * navigation back from accounts.google.com, which 'strict' would drop. Short-lived
 * because it only needs to outlive one OAuth round trip.
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
