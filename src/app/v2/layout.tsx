import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { V2Shell } from './_components/v2-shell'

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.userId) {
    redirect('/login')
  }
  return <V2Shell>{children}</V2Shell>
}
