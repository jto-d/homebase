import { GraphQLError } from 'graphql'
import { createGraphQLError, createYoga } from 'graphql-yoga'
import { getToken } from 'next-auth/jwt'
import { schema } from '@/graphql/schema'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import type { Context } from '@/graphql/context'

const yoga = createYoga<Record<string, never>, Context>({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  maskedErrors: {
    // Yoga replaces every resolver error with "Unexpected error." — right for
    // anything unplanned, but it would hide the pairing flow's messages. Let those
    // through by class; keep masking the rest so Prisma internals never reach a client.
    maskError(error, message) {
      const original = error instanceof GraphQLError ? error.originalError : error
      if (original instanceof UserFacingError) return error as GraphQLError
      console.error(error)
      return createGraphQLError(message)
    },
  },
  // Read the JWT off the request: auth() relies on Next's headers() async-context,
  // which Yoga's request handling doesn't reliably preserve.
  context: async ({ request }): Promise<Context> => {
    // Yoga's request URL is the internal http:// container address, so force
    // secureCookie to find the __Secure- cookie Auth.js sets in production.
    const secureCookie = process.env.NODE_ENV === 'production'
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET, secureCookie })
    if (!token?.userId) return { userId: null, householdId: null }

    // householdId is read fresh, not from the token: accepting an invite moves the
    // user and deletes the old household, so a sign-in-minted token would scope
    // every query to a household that no longer exists.
    const user = await prisma.user.findUnique({
      where: { id: token.userId },
      select: { householdId: true },
    })
    return { userId: user ? token.userId : null, householdId: user?.householdId ?? null }
  },
})

async function handler(request: Request): Promise<Response> {
  return yoga.handle(request, {})
}

export { handler as GET, handler as POST, handler as OPTIONS }
