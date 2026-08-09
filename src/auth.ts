import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { upsertUserForSignIn } from '@/lib/household'

/** Carries an invite code across the Google OAuth round trip, so a new partner is created straight into the inviter's household. Set on /join/[code], read here. */
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
    // Not a mutable request scope. acceptHouseholdInvite still works, so this is a downgrade, not a failure.
    return null
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Infer the callback URL from the request host — Cloud Run's host isn't trusted by default.
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
        // Accepting an invite moves the user to a different household, leaving this
        // token stale. The client calls session.update() to land here.
        const user = await prisma.user.findUnique({
          where: { id: token.userId },
          select: { householdId: true },
        })
        if (user) token.householdId = user.householdId
      }
      return token
    },
    async session({ session, token }) {
      // Narrowed rather than cast: `session` is a union including AdapterSession,
      // whose `userId` is a required string.
      if (token.userId) session.userId = token.userId
      if (token.householdId) session.householdId = token.householdId
      return session
    },
  },
})
