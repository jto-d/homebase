FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
# Dummy values: codegen imports src/lib/prisma.ts and prisma.config.ts, which read these
# at module load. Nothing connects at build time.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV DIRECT_URL=postgres://build:build@localhost:5432/build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile          # postinstall runs `prisma generate`
COPY . .
# Inlined into the bundle at build time — rebuild to change it.
ARG NEXT_PUBLIC_APP_URL=https://homebase.jtod.dev
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN pnpm codegen && pnpm build

FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
CMD ["node", "server.js"]
