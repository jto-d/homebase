# AGENTS.md

Guidance for coding agents (Claude Code, Conductor, Cursor) working in this repository.
`CLAUDE.md` is a pointer to this file — put all project rules here, not there.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Git workflow

**Do NOT use git worktrees.** Work directly in this checkout. No `git worktree add`, no
`EnterWorktree`. Work straight on `main`.

**Do NOT create feature branches or PRs.** Commit directly on `main` and push there — the
user has confirmed this explicitly. No `git checkout -b`, no `gh pr create`.

## What Homebase is

A **two-person** personal finance app. Homebase is a ground-up rebuild of Anchor (the previous
single-user app, still at `../anchor` for reference) around a shared `Household` rather than a
flat per-user scope.

The repo contains the **foundation** (auth, households, the invite/pairing flow, the ownership
convention below) plus the features landed on top of it so far: Budgeting, Accounts, Split, and
Cards & Perks (see below). Subscriptions still gets its own design brief.

## Ask before acting

**Before starting any non-trivial task, ask to clarify intent** (`AskUserQuestion` in Claude Code;
a plain question elsewhere). Do not assume.
The cost of a quick question is far lower than the cost of a wrong implementation. Use it when a
request could be read more than one way, when two approaches have real tradeoffs, when adding UI
(placement, which view), when touching the DB schema (is a migration expected?), and when a task
spans both frontend and backend. Present 2–4 concrete options.

## The ownership convention — the headline invariant

**Every domain model is scoped to a household, never to a user.**

```prisma
householdId String    // FK → Household, required. All queries scope through
                      // ctx.householdId, not ctx.userId.
ownerId     String?   // FK → User, nullable. null = shared/joint; set = attributed
                      // to that person. Editable after creation.
```

Both relations use `onDelete: Cascade`. `ownerId` is *attribution*, not permission — either member
can read and edit everything in the household. There are no per-member permissions in v1.

Two rules that follow from this, and are easy to get wrong:

1. **`ctx.userId` is almost never the right scope.** The only legitimate uses are the `me` query
   and stamping `createdByUserId` / `ownerId`. Anything else scoped by `userId` is a bug: it hides
   one member's data from the other, which is the whole point of the app.
2. **Adding a household-scoped model means adding a line to `migrateHouseholdRecords()`** in
   `src/lib/household.ts`. When a solo user pairs up, their old household is deleted; anything that
   function does not move is stranded and cascade-deleted with it.

## Stack

Next.js 16 (App Router, Turbopack, React 19) · MUI 9 (Material UI + Emotion) · GraphQL Yoga 5 +
Pothos 4 (code-first) · Prisma 7 + `@prisma/adapter-neon` over Neon · urql 5 via `@urql/next` ·
`graphql-codegen` client-preset · pnpm.

## Commands

```
pnpm dev               # Next dev server (Turbopack is default in Next 16, no flag needed)
pnpm build             # Production build — also runs full tsc type-check
pnpm schema            # Print Pothos schema → ./schema.graphql
pnpm codegen           # pnpm schema && graphql-codegen → src/gql/
pnpm codegen:watch     # graphql-codegen --watch (schema must already be current)
pnpm db:migrate        # prisma migrate dev (uses DIRECT_URL)
pnpm db:studio         # prisma studio
```

**There are no tests and no test runner in this project — this is deliberate.** Do not add vitest,
jest, testing-library, or test files, and do not propose "let me add a test for that" as a next
step. `pnpm build` (full `tsc` type-check) is the verification signal for code changes; exercise
behavior by running the app. There is also no linter — `--no-eslint` was passed to
`create-next-app` and Next 16 removed `next lint` entirely. `postinstall` runs `prisma generate`.

## Schema-and-codegen pipeline

One-way, and must run in this order whenever Prisma models or Pothos types change:

1. **`prisma/schema.prisma`** — models live here. `datasource db` has no `url`; the URL comes from
   `prisma.config.ts` (Prisma 7 split). Two generators run: `prisma-client-js` and
   `prisma-pothos-types` (with `generateDatamodel = "true"` — required so the runtime
   `getDatamodel()` function is emitted).
2. **`prisma generate`** writes the Prisma client + `generated.{d.ts,js}` into
   `node_modules/@pothos/plugin-prisma/`.
3. **`src/graphql/builder.ts`** passes `dmmf: getDatamodel()` to the SchemaBuilder. **Required in
   Prisma 7** — the old `client._runtimeDataModel` path is gone, so the builder throws
   `Model 'X' is missing required datamodel information` without it.
4. **`pnpm schema`** runs `tsx src/graphql/print-schema.ts` → SDL to `./schema.graphql`. It loads
   `dotenv/config` first because importing the schema pulls in `src/lib/prisma.ts`, which reads
   `DATABASE_URL` at module load.
5. **`graphql-codegen`** reads `./schema.graphql` + operations from `src/**/*.{ts,tsx}` and emits
   `src/gql/` (client-preset, `fragmentMasking: false`).

`schema.graphql` and `src/gql/` are gitignored — regenerate after `git pull`.

## GraphQL schema layout

`src/graphql/schema.ts` imports every type/query/mutation file for side effects, then calls
`builder.toSchema()`. **A new file that isn't imported there silently doesn't exist.** Each domain
gets a subfolder:

- `src/graphql/user/` — `type.ts`, `queries.ts` (`me`)
- `src/graphql/household/` — `type.ts`, `queries.ts` (`household`)
- `src/graphql/householdInvite/` — `type.ts`, `queries.ts` (`householdInvitePreview`),
  `mutations.ts` (`createHouseholdInvite`, `acceptHouseholdInvite`)

## Pothos conventions

- `defaultFieldNullability: false` (and the matching `DefaultFieldNullability: false` generic) —
  every field is non-null unless you add `{ nullable: true }`.
- No custom scalars. `Decimal` → `Float` via `.toNumber()`; `DateTime` → `String` via
  `.toISOString()` in a field resolver.
- **Errors: `throw new UserFacingError('…')`** (from `src/lib/errors.ts`) for anything a person is
  meant to read; a plain `Error` for everything else. Yoga masks every error as `"Unexpected
  error."` by default — right for unplanned failures, since a raw Prisma error would otherwise leak
  table names and stack traces to the client, but it would also swallow the pairing flow's
  messages. The single `maskError` hook in `src/app/api/graphql/route.ts` lets `UserFacingError`
  through by class and masks the rest. `GraphQLError` is not thrown directly anywhere.
- The Pothos Prisma plugin warns against putting the Prisma client into Context — keep it the
  module singleton (`src/lib/prisma.ts`).
- **Plain payload objects** use `builder.simpleObject('NamePayload', …)`
  (`@pothos/plugin-simple-objects`). Only fall back to `objectRef` + `objectType` when a field needs
  a real resolver — `AcceptInvitePayload` in `src/graphql/householdInvite/type.ts` is the one case,
  because its `household` field needs `t.prismaField` so the plugin can build the nested selection.
- Timestamps stay out of the schema unless a client needs them (`HouseholdInvite.createdAt` /
  `acceptedAt` are omitted; `status` carries everything the UI needs).

## Auth / household context

Auth.js v5 (`next-auth@5.0.0-beta.31`), Google OAuth only, JWT session strategy. `src/auth.ts`
exports `{ handlers, auth, signIn, signOut }`.

- **First sign-in** upserts a `User` by email via `upsertUserForSignIn()` in `src/lib/household.ts`.
  A user with no invite gets their own solo `Household` — `User.householdId` is non-null, so
  everyone is in a household from the first request and nothing is gated on pairing.
- **Page-level gate** — `src/app/(app)/layout.tsx` (server component) calls `auth()` and redirects
  to `/login`. There is no `middleware.ts`: everything requiring a session lives inside the `(app)`
  route group, everything public (`/login`, `/join/[code]`) lives outside it.
- **GraphQL context** — `src/app/api/graphql/route.ts` reads the JWT with
  `getToken({ req: request, … })` rather than `auth()`; Yoga's request handling doesn't reliably
  preserve the async context `headers()` relies on.

  Two things differ from Anchor and matter:

  **The context does not throw.** It returns `{ userId: null, householdId: null }` for anonymous
  requests, because `householdInvitePreview` has to render the invite landing page before the
  partner has signed in. **Every other resolver must call `requireAuth(ctx)`** from
  `src/graphql/context.ts` — that is now the auth gate, and a resolver that forgets it is a data
  leak. `householdInvitePreview` is the *only* permitted exception; it exposes just the inviter's
  display name and whether the household is full.

  **`householdId` is read from the DB, not the token.** Accepting an invite moves a user to a
  different household and deletes the old one, so a token minted at sign-in would scope every query
  to a household that no longer exists.

- **Env vars** — `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_APP_URL`. See `.env.example`.

## Pairing flow

1. Settings → `createHouseholdInvite` → single-use `code` + shareable `url`
   (`{NEXT_PUBLIC_APP_URL}/join/{code}`). Codes never expire. Refused once the household has 2 members.
2. The partner opens `/join/{code}`, which renders from `householdInvitePreview` while signed out.
3. On acceptance:
   - **New account** — `/join/[code]` stashes the code in a short-lived httpOnly cookie
     (`homebase.invite`, `sameSite: 'lax'` so it survives the OAuth redirect back), and the `jwt`
     callback creates the user directly into the inviter's household. They never hold a solo household.
   - **Existing solo account** — `acceptInvite()` migrates their records, moves their
     `User.householdId`, and deletes the empty solo household.
   - **Already paired** — rejected. The cap is 2 and pairing is permanent in v1 (no leave/unpair).
4. Filling a household deletes every other outstanding `PENDING` invite for it.

**Single-use is enforced by a conditional write**, not a read-then-write:
`updateMany({ where: { code, status: 'PENDING' }, data: { status: 'ACCEPTED', … } })`. A count of
zero means someone else redeemed it first. Don't "simplify" this into a find-then-update.

## Member colors

`src/lib/members.ts` holds a two-hue fixed palette. The DB stores a slug (`"teal"` / `"amber"`) on
`User.color`; hex lives in the registry. The household creator always gets the first hue, the
partner the second, so every household looks the same. `MemberAvatar`
(`src/components/MemberAvatar.tsx`) is the shared "whose is whose" primitive — card ownership tags,
budget attribution, and split rows should all render identity through it rather than reinventing a
badge.

## Cards & Perks

A household-scoped port of Anchor's card/perk tracker (`../anchor/src/utils/{perk,card,cardRewards}.ts`,
`src/data/{cardCatalog,perkCatalog}.ts`) — same models, same cycle math, same catalogs, ported
verbatim rather than redesigned. `src/graphql/creditCard/`, `src/app/(app)/cards/`.

- **`CreditCard.ownerId` is the one deliberate exception to the nullable-`ownerId` convention
  above — it is required, not nullable.** A card is issued to one person; there is no joint card,
  and the whole Cards page groups and totals by owner. Every other domain keeps `ownerId` nullable.
- `src/lib/cardCatalog.ts` and `src/lib/perkCatalog.ts` are **data, not code** — a ~80-card catalog
  (branding, network, annual fee, reward multipliers) and per-product perk templates, both copied
  from Anchor unedited. Don't "clean up" or restructure them; a diff against Anchor's copy should
  stay a diff of content, not shape.
- `src/lib/perk.ts` is the reason the feature works: reset-cycle windows (calendar and
  card-anniversary, all five `PerkPeriod`s) and `perkCoverage` — the single "how much of this perk
  is left" function everything else (`perkStatus`, the tracker, the summary, the detail page)
  routes through. It runs **client-side** against the `CreditCards` query payload, not in a
  resolver — one implementation serving three screens instead of one per screen.
- Two timezone conventions coexist on purpose and must not be mixed: `src/lib/perk.ts` builds
  cycle windows in **local** time and parses a stored date as `date + 'T00:00:00'`; the budgeting
  domain (`src/lib/budget.ts`, `src/lib/format.ts`) reads dates in **UTC**. Each is correct for its
  own domain.
- `src/lib/card.ts` (annual-fee ROI: `cardVerdict` — Worth it / Marginal / Review it / No annual
  fee) and `src/lib/cardRewards.ts` (best-card-by-category ranking, `CARD_CATALOG` ↔ GraphQL
  bridge) round out the port. `annualFee` is resolved from the catalog in the GraphQL layer
  (`CreditCard.annualFee`) — never stored on the row.

## urql client

`src/lib/urql.tsx` (`Providers`) is the only urql wiring; every consumer is a client component.
Two non-obvious choices:

- `suspense: false`. With suspense on, `useQuery` fetches during SSR and Node's native `fetch`
  rejects the relative URL `/api/graphql` with `Failed to parse URL`.
- `url` is conditional: absolute `http://localhost:${PORT}` on the server, relative on the client.

GraphQL documents live in co-located `*.queries.ts` files exporting `<OpName>Document` consts
(e.g. `src/app/(app)/household.queries.ts`), consumed via `useQuery({ query: HouseholdDocument })`.
Refetch after a mutation with `reexecuteQuery({ requestPolicy: 'network-only' })`.

## Yoga ↔ Next route handler

`src/app/api/graphql/route.ts` wraps Yoga because Next 16's `RouteHandlerConfig` types are strict —
Yoga's `handle(request, ctx)` second argument doesn't match Next's `{ params: Promise<{}> }`. The
wrapper takes only `request: Request` and calls `yoga.handle(request, {})`, exported as `GET`,
`POST`, and `OPTIONS`.

## Styling — MUI

Material UI v9 on Emotion. No Tailwind. `src/lib/theme.ts` is deliberately minimal for now — the
full design system (brand scales, typography variants, a `components/ui` primitives barrel) lands
with the first feature brief; port it from `../anchor/src/lib/theme.ts` and
`../anchor/src/components/ui/` when that happens. `AppRouterCacheProvider` must stay above
`ThemeProvider` in `src/app/layout.tsx` or you get hydration class mismatches.

## When something looks off

- **`PothosSchemaError: Model 'X' is missing required datamodel information`** → re-run
  `pnpm exec prisma generate`; or `generateDatamodel = "true"` / `dmmf: getDatamodel()` went missing.
- **Type errors after editing an operation or a Prisma model** → run `pnpm codegen`.
- **`Failed to parse URL from /api/graphql`** → urql is fetching server-side with a relative URL.
- **Prisma CLI error about `url`/`directUrl`** → removed from `datasource` in Prisma 7; they belong
  in `prisma.config.ts`.
- **MUI styles flash unstyled / hydration class mismatch** → `AppRouterCacheProvider` must wrap the
  app above `ThemeProvider`.
- **`builder.simpleObject is not a function`** → `SimpleObjectsPlugin` dropped from `builder.ts`.
- **A signed-in user sees an empty app right after pairing** → something is reading `householdId`
  off the JWT instead of the database.
