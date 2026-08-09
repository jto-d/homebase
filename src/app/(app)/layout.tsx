import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { AppShell } from './app-shell'

/**
 * The route gate. No middleware.ts — everything needing a session lives inside
 * this route group, everything public (/login, /join/[code]) outside it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.userId) {
    redirect('/login')
  }
  return <AppShell>{children}</AppShell>
}
