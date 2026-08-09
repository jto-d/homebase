import { JoinCard } from './join-card'

/**
 * Public invite landing page — outside the (app) route group so it renders for a
 * partner who hasn't signed in. The preview comes from the one resolver that skips auth.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <JoinCard code={code} />
}
