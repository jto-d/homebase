'use client'

import {
  cacheExchange,
  createClient,
  fetchExchange,
  ssrExchange,
  UrqlProvider,
} from '@urql/next'
import { useMemo, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [client, ssr] = useMemo(() => {
    const ssr = ssrExchange()
    const client = createClient({
      url:
        typeof window === 'undefined'
          ? `http://localhost:${process.env.PORT ?? 3000}/api/graphql`
          : '/api/graphql',
      exchanges: [cacheExchange, ssr, fetchExchange],
      // With suspense on, useQuery tries to fetch during SSR and Node's native
      // fetch rejects the relative URL with "Failed to parse URL".
      suspense: false,
    })
    return [client, ssr]
  }, [])

  return (
    <UrqlProvider client={client} ssr={ssr}>
      {children}
    </UrqlProvider>
  )
}
