import { JoinCard } from './join-card'

/**
 * Public invite landing page — deliberately outside the (app) route group, so
 * it renders for a partner who has not signed in yet. The preview it shows is
 * fetched client-side through the one resolver in the schema that skips auth.
 */
export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  return <JoinCard code={code} />
}
