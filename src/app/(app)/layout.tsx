import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from './app-shell'

/**
 * The route gate. There is no middleware.ts — everything that requires a
 * session lives inside this route group, and everything public ( /login,
 * /join/[code] ) lives outside it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.userId) {
    redirect('/login')
  }
  return <AppShell>{children}</AppShell>
}
