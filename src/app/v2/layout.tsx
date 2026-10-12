import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function V2Layout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.userId) {
    redirect('/login')
  }
  return <>{children}</>
}
