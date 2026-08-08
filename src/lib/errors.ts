/**
 * An error whose message was written for the person using the app, and is
 * therefore safe to send to the client verbatim.
 *
 * Yoga masks every other error as "Unexpected error." — which is the behaviour
 * we want for anything unplanned (a Prisma failure would otherwise leak table
 * names and stack traces), but it would also swallow the messages the pairing
 * flow depends on, like "This invite has already been used". Throw this class
 * for anything a user is meant to read; throw a plain Error for everything else.
 *
 * The unmasking happens in one place: the maskError hook in
 * src/app/api/graphql/route.ts.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UserFacingError'
  }
}
