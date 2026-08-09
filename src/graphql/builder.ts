import SchemaBuilder from '@pothos/core'
import PrismaPlugin from '@pothos/plugin-prisma'
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects'
import type PrismaTypes from '@pothos/plugin-prisma/generated'
import { getDatamodel } from '@pothos/plugin-prisma/generated'
import { prisma } from '@/lib/prisma'
import type { Context } from './context'

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes
  DefaultFieldNullability: false
  Context: Context
}>({
  defaultFieldNullability: false,
  plugins: [PrismaPlugin, SimpleObjectsPlugin],
  prisma: {
    client: prisma,
    // Required under Prisma 7 — client._runtimeDataModel is gone. Without this:
    // "Model 'X' is missing required datamodel information".
    dmmf: getDatamodel(),
    onUnusedQuery: process.env.NODE_ENV === 'production' ? null : 'warn',
  },
})

builder.queryType({})
builder.mutationType({})
