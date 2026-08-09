/**
 * An error safe to send to the client verbatim.
 *
 * Yoga masks every other error as "Unexpected error." — right for anything
 * unplanned (a Prisma failure would leak table names), but it would also swallow
 * pairing-flow messages like "This invite has already been used". Throw this for
 * anything a user is meant to read, a plain Error for everything else.
 *
 * Unmasked in one place: the maskError hook in src/app/api/graphql/route.ts.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}
