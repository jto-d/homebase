'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import SyncIcon from '@mui/icons-material/SyncOutlined'
import AccountBalanceIcon from '@mui/icons-material/AccountBalanceOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import { MonthStepper, currentMonth } from '@/components/MonthStepper'
import { Eyebrow, ProgressBar, Segmented, Stack, SurfaceCard } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import { brand } from '@/lib/theme'
import { useHousehold } from '../household-context'
import {
  CreatePlaidLinkTokenDocument,
  CreateTransactionDocument,
  DeleteTransactionDocument,
  LinkPlaidItemDocument,
  SetTransactionCategoryDocument,
  SetTransactionSharedDocument,
  SyncPlaidTransactionsDocument,
  TransactionsMonthDocument,
} from './transactions.queries'
import { AddTransactionDialog } from './add-transaction-dialog'
import { LinkBankDialog } from './link-bank-dialog'
import { TransactionRow, type CategoryGroup } from './transaction-row'
import type { TransactionsMonthQuery } from '@/gql/graphql'

type Txn = TransactionsMonthQuery['transactions'][number]
type Tab = 'all' | 'unfiled' | 'filed'

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

/** Group de-duplicated budget paths by their first segment, for the category menu. */
function groupPaths(paths: readonly string[]): CategoryGroup[] {
  const byGroup = new Map<string, string[]>()
  for (const path of paths) {
    const group = path.split(' › ')[0]!
    if (!byGroup.has(group)) byGroup.set(group, [])
    byGroup.get(group)!.push(path)
  }
  return Array.from(byGroup, ([group, paths]) => ({ group, paths }))
}

export default function TransactionsPage() {
  const { me, partner, members } = useHousehold()
  const [sel, setSel] = useState(currentMonth)
  const [tab, setTab] = useState<Tab>('all')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const [{ data, fetching }, refetch] = useQuery({ query: TransactionsMonthDocument, variables: sel })
  const [, createTransaction] = useMutation(CreateTransactionDocument)
  const [, setCategory] = useMutation(SetTransactionCategoryDocument)
  const [, setShared] = useMutation(SetTransactionSharedDocument)
  const [, deleteTransaction] = useMutation(DeleteTransactionDocument)
  const [, createLinkToken] = useMutation(CreatePlaidLinkTokenDocument)
  const [, linkPlaidItem] = useMutation(LinkPlaidItemDocument)
  const [, syncPlaidTransactions] = useMutation(SyncPlaidTransactionsDocument)

  const leaves = data?.budgetLeaves ?? []
  const transactions = data?.transactions ?? []
  const plaidItems = data?.plaidItems ?? []
  const budgetStart =
    data?.household.budgetStartYear != null && data?.household.budgetStartMonth != null
      ? { year: data.household.budgetStartYear, month: data.household.budgetStartMonth }
      : null

  const pathById = useMemo(() => new Map(leaves.map((l) => [l.id, l.path])), [leaves])
  const categoryGroups = useMemo(
    () => groupPaths(Array.from(new Set(leaves.map((l) => l.path))).sort()),
    [leaves]
  )

  function isFiled(txn: Txn): boolean {
    return txn.splits.length > 0 && (partner == null || txn.shared != null)
  }

  const unfiled = transactions.filter((t) => !isFiled(t))
  const filed = transactions.filter(isFiled)
  const total = transactions.length
  const filedPct = total === 0 ? 1 : filed.length / total

  function reload() {
    refetch({ requestPolicy: 'network-only' })
  }

  function report(result: MutationResult): boolean {
    if (result.error) {
      setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      return false
    }
    setError(null)
    return true
  }

  async function handleSync() {
    setSyncing(true)
    const result = await syncPlaidTransactions({})
    setSyncing(false)
    if (!report(result)) return
    reload()
    const { imported, updated, removed } = result.data!.syncPlaidTransactions
    setInfo(
      imported || updated || removed
        ? `${imported} new, ${updated} updated, ${removed} removed`
        : 'Already up to date'
    )
  }

  async function run(fire: () => Promise<MutationResult>) {
    if (report(await fire())) reload()
  }

  function payerLabel(txn: Txn): string {
    if (!txn.ownerId) return 'Joint'
    return memberLabel(members.find((m) => m.id === txn.ownerId) ?? me)
  }

  function accountLabel(txn: Txn): string | null {
    if (!txn.account) return null
    return txn.account.mask ? `${txn.account.name} •${txn.account.mask}` : txn.account.name
  }

  function renderGroup(title: string, tone: string, items: Txn[]) {
    if (items.length === 0) return null
    return (
      <Box key={title}>
        <Stack direction="row" align="center" gap={1} sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
          <Eyebrow sx={{ color: tone }}>{title}</Eyebrow>
          <Box
            sx={{
              display: 'inline-grid',
              placeItems: 'center',
              minWidth: 20,
              height: 18,
              px: '6px',
              borderRadius: '999px',
              bgcolor: 'grey.100',
              color: 'text.secondary',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {items.length}
          </Box>
        </Stack>
        {items.map((txn, i) => (
          <TransactionRow
            key={txn.id}
            txn={txn}
            payerLabel={payerLabel(txn)}
            accountLabel={accountLabel(txn)}
            partner={partner}
            currentPath={txn.splits[0] ? (pathById.get(txn.splits[0].budgetId) ?? null) : null}
            categoryGroups={categoryGroups}
            onSetCategory={(path) => run(() => setCategory({ id: txn.id, path }))}
            onSetShared={(shared) => run(() => setShared({ id: txn.id, shared }))}
            onDelete={() => run(() => deleteTransaction({ id: txn.id }))}
            last={i === items.length - 1}
          />
        ))}
      </Box>
    )
  }

  return (
    <Stack gap={3} sx={{ maxWidth: 1040, mx: 'auto' }}>
      <Stack direction="row" align="center" justify="between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Transactions
        </Typography>
        <Stack direction="row" gap={1.5} align="center">
          <MonthStepper value={sel} onChange={setSel} min={budgetStart} />
          <Button
            variant="outlined"
            startIcon={<AccountBalanceIcon />}
            onClick={() => setLinkOpen(true)}
          >
            {plaidItems.length === 0 ? 'Link a bank' : 'Link another'}
          </Button>
          {plaidItems.length > 0 && (
            <Button
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
              disabled={syncing}
              onClick={handleSync}
            >
              Sync
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {info && <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert>}

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <SurfaceCard>
          <Stack direction="row" align="center" justify="between" gap={2.5} sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <Stack sx={{ minWidth: 220 }} gap={0.5}>
              <Stack direction="row" justify="between">
                <Eyebrow>Filed</Eyebrow>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {filed.length} of {total}
                </Typography>
              </Stack>
              <ProgressBar value={filedPct} color={brand.teal[600]} thin />
            </Stack>
            <Segmented
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              options={[
                { value: 'all', label: `All ${total}` },
                { value: 'unfiled', label: `Unfiled ${unfiled.length}` },
                { value: 'filed', label: `Filed ${filed.length}` },
              ]}
            />
          </Stack>

          {tab !== 'filed' && renderGroup('Needs assignment', brand.amber[700], unfiled)}
          {tab !== 'unfiled' && renderGroup('Filed', 'text.secondary', filed)}

          {total > 0 && unfiled.length === 0 && tab !== 'filed' && (
            <Stack align="center" gap={1} sx={{ py: 6, px: 3, textAlign: 'center' }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '999px', bgcolor: brand.accentSoft, display: 'grid', placeItems: 'center' }}>
                <CheckCircleOutlineIcon sx={{ color: brand.teal[700] }} />
              </Box>
              <Typography sx={{ fontWeight: 600 }}>Everything&rsquo;s filed</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                All {total} transactions are assigned to a budget{partner ? ', a split, or both' : ''}.
              </Typography>
            </Stack>
          )}

          {total === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', p: 3 }}>
              Nothing this month.
            </Typography>
          )}
        </SurfaceCard>
      )}

      <AddTransactionDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        members={members}
        meId={me.id}
        onSubmit={async ({ merchant, date, amount, ownerId }) => {
          const ok = report(await createTransaction({ merchant, date, amount, ownerId }))
          if (ok) reload()
          return ok
        }}
      />

      <LinkBankDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        members={members}
        meId={me.id}
        createLinkToken={async () => {
          const result = await createLinkToken({})
          return report(result) ? result.data!.createPlaidLinkToken : null
        }}
        onLinked={async ({ publicToken, institutionName, ownerId }) => {
          const ok = report(await linkPlaidItem({ publicToken, institutionName, ownerId }))
          if (ok) reload()
          return ok
        }}
      />
    </Stack>
  )
}
