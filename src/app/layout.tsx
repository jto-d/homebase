import type { Metadata } from 'next'
import '@/styles/globals.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from '@/lib/theme'
import { Providers } from '@/lib/urql'
import { AuthSessionProvider } from './session-provider'

export const metadata: Metadata = {
  title: 'Homebase',
  description: 'Shared personal finance for two',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ key: 'mui' }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthSessionProvider>
              <Providers>{children}</Providers>
            </AuthSessionProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
