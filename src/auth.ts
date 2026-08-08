import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { upsertUserForSignIn } from '@/lib/household'

/**
 * Carries an invite code across the Google OAuth round trip. Set on the
 * /join/[code] landing page just before sign-in; read here on the way back so
 * a brand-new partner is created straight into the inviter's household instead
 * of getting a solo one that immediately has to be merged away.
 */
export const INVITE_COOKIE = 'homebase.invite'

declare module 'next-auth' {
  interface Session {
    userId?: string
    householdId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string
    householdId?: string
  }
}

async function takeInviteCookie(): Promise<string | null> {
  try {
    const store = await cookies()
    const code = store.get(INVITE_COOKIE)?.value ?? null
    if (code) store.delete(INVITE_COOKIE)
    return code
  } catch {
    // Not in a mutable request scope. The invite can still be redeemed through
    // the acceptHouseholdInvite mutation, so this is a downgrade, not a failure.
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Cloud Run serves from a host next-auth doesn't recognize as trusted by
  // default; trust it so the callback URL is inferred from the request host
  // instead of a hardcoded NEXTAUTH_URL/AUTH_URL.
  trustHost: true,
  providers: [Google],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      if (account && profile?.email) {
        const user = await upsertUserForSignIn({
          email: profile.email,
          name: profile.name,
          inviteCode: await takeInviteCookie(),
        })
        token.userId = user.id
        token.householdId = user.householdId
      } else if (trigger === 'update' && token.userId) {
        // Accepting an invite moves the user to a different household, which
        // would otherwise leave this token pointing at a household that no
        // longer exists. The client calls session.update() to land here.
        const user = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { householdId: true },
        })
        if (user) token.householdId = user.householdId
      }
      return token
    },
    async session({ session, token }) {
      // Narrowed rather than cast: this callback's `session` is a union that
      // includes AdapterSession, whose `userId` is a required string.
      if (token.userId) session.userId = token.userId
      if (token.householdId) session.householdId = token.householdId
      return session
    },
  },
})
