'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { MemberAvatar } from '@/components/MemberAvatar'
import { MonthStepper, currentMonth, type MonthSel } from '@/components/MonthStepper'
import { AppDialog, Row, Segmented, Stack } from '@/components/ui'
import { budgetTotals, buildBudgetTree, type BudgetNodeData } from '@/lib/budget'
import { NEW_CATEGORY, NEW_GROUP, NEW_INCOME, NEW_LINE_ITEM } from '@/lib/budgetDefaults'
import { monthLabel } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { useHousehold } from '../household-context'
import { BudgetLedger, type LedgerHandlers } from './budget-ledger'
import { DeleteNodeDialog, type PendingDelete } from './delete-node-dialog'
import { IncomePanel } from './income-panel'
import { SummaryStrip } from './summary-strip'
import {
  AddBudgetNodeDocument,
  AddIncomeSourceDocument,
  BudgetMonthDocument,
  CopyBudgetFromDocument,
  DeleteBudgetNodeDocument,
  RemoveIncomeSourceDocument,
  RenameBudgetNodeDocument,
  RenameIncomeSourceDocument,
  SetIncomeAmountDocument,
  SetNodeAnnualLimitDocument,
  SetNodeBudgetDocument,
  SetNodeContributedDocument,
  SetNodeRolloverDocument,
} from './budget.queries'

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

export default function BudgetPage() {
  const { me, members } = useHousehold()

  const [sel, setSel] = useState(currentMonth)
  const [ownerId, setOwnerId] = useState(me.id)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  const [confirmCopy, setConfirmCopy] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [{ data, fetching }, refetch] = useQuery({
    query: BudgetMonthDocument,
    variables: { ...sel, ownerId },
    requestPolicy: 'cache-and-network',
  })

  const [, addNode] = useMutation(AddBudgetNodeDocument)
  const [, renameNode] = useMutation(RenameBudgetNodeDocument)
  const [, deleteNode] = useMutation(DeleteBudgetNodeDocument)
  const [, setNodeBudget] = useMutation(SetNodeBudgetDocument)
  const [, setAnnualLimit] = useMutation(SetNodeAnnualLimitDocument)
  const [, setContributed] = useMutation(SetNodeContributedDocument)
  const [, setRollover] = useMutation(SetNodeRolloverDocument)
  const [, addIncome] = useMutation(AddIncomeSourceDocument)
  const [, renameIncome] = useMutation(RenameIncomeSourceDocument)
  const [, setIncomeAmount] = useMutation(SetIncomeAmountDocument)
  const [, removeIncome] = useMutation(RemoveIncomeSourceDocument)
  const [, copyBudgetFrom] = useMutation(CopyBudgetFromDocument)

  /**
   * Amounts committed locally but not yet echoed by the server.
   *
   * `EditableMoney` renders from its `value` prop, so without this the figure
   * snaps back to the old one for the length of a round trip. Applied before the
   * tree is built, so an edited line item rolls up into its parent and into the
   * summary strip with no extra bookkeeping.
   */
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const seen = useRef(data?.budgetMonth)
  useEffect(() => {
    if (data?.budgetMonth !== seen.current) {
      seen.current = data?.budgetMonth
      setOverrides({})
    }
  }, [data?.budgetMonth])

  const month = data?.budgetMonth
  const budgetStart: MonthSel | null =
    month?.budgetStartYear != null && month.budgetStartMonth != null
      ? { year: month.budgetStartYear, month: month.budgetStartMonth }
      : null

  const nodes: BudgetNodeData[] = useMemo(
    () =>
      (month?.nodes ?? []).map((n) => ({
        ...n,
        budget: overrides[n.id] ?? n.budget,
        annualLimit: overrides[`limit:${n.id}`] ?? n.annualLimit,
        spent: overrides[`spent:${n.id}`] ?? n.spent,
      })),
    [month?.nodes, overrides]
  )
  const income = useMemo(
    () => (month?.income ?? []).map((i) => ({ ...i, amount: overrides[i.id] ?? i.amount })),
    [month?.income, overrides]
  )

  const roots = useMemo(() => buildBudgetTree(nodes), [nodes])
  const totals = useMemo(() => budgetTotals(roots, income), [roots, income])

  /** Apply the optimistic value, fire, surface any message, then resync. */
  async function run(fire: () => Promise<MutationResult>, optimistic?: { key: string; value: number }) {
    if (optimistic) setOverrides((prev) => ({ ...prev, [optimistic.key]: optimistic.value }))
    const result = await fire()
    if (result.error) {
      setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      // Drop the optimistic value — the server did not take it.
      if (optimistic) setOverrides(({ [optimistic.key]: _, ...rest }) => rest)
    } else {
      setError(null)
    }
    refetch({ requestPolicy: 'network-only' })
  }

  const handlers: LedgerHandlers = {
    onAddGroup: () => run(() => addNode({ ownerId, parentId: null, ...NEW_GROUP })),
    onAddChild: (parentId) => {
      // Depth decides the label: a child of a group is a category, a child of a
      // category is a line item.
      const isGroup = nodes.find((n) => n.id === parentId)?.parentId == null
      setCollapsed((prev) => ({ ...prev, [parentId]: false }))
      return run(() => addNode({ ownerId, parentId, ...(isGroup ? NEW_CATEGORY : NEW_LINE_ITEM) }))
    },
    onRename: (id, label) => run(() => renameNode({ id, label })),
    onDelete: (node) => setPendingDelete(node),
    onBudget: (id, budget) => run(() => setNodeBudget({ id, ...sel, budget }), { key: id, value: budget }),
    onContributed: (id, spent) =>
      run(() => setContributed({ id, ...sel, amount: spent }), { key: `spent:${id}`, value: spent }),
    onAnnualLimit: (id, annualLimit) =>
      run(() => setAnnualLimit({ id, annualLimit }), { key: `limit:${id}`, value: annualLimit }),
    onRollover: (id, rollsOver) => run(() => setRollover({ id, rollsOver })),
    onToggle: (id) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] })),
  }

  // The household caps at two, so "the other person" is whoever isn't on screen.
  const viewed = members.find((m) => m.id === ownerId)
  const other = members.find((m) => m.id !== ownerId)

  const personOptions = members.map((m) => ({
    value: m.id,
    label: memberLabel(m) + (m.id === me.id ? ' (you)' : ''),
    icon: <MemberAvatar member={m} size={18} />,
  }))

  return (
    <Stack gap={3} sx={{ maxWidth: 1180, mx: 'auto' }}>
      <Row justify="between" gap={1.5} wrap>
        <Typography variant="h5" sx={{ fontSize: 21 }}>
          Budget
        </Typography>
        <Row gap={1.25} wrap>
          {members.length > 1 && <Segmented value={ownerId} onChange={setOwnerId} options={personOptions} />}
          <MonthStepper value={sel} onChange={setSel} min={budgetStart} />
          {other && (
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              title="More"
              sx={{
                width: 38,
                height: 38,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '9px',
              }}
            >
              <MoreHorizIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <Menu anchorEl={menuAnchor} open={menuAnchor != null} onClose={() => setMenuAnchor(null)}>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                setConfirmCopy(true)
              }}
              sx={{ fontSize: 13.5 }}
            >
              Copy from {other ? memberLabel(other) : ''}
            </MenuItem>
          </Menu>
        </Row>
      </Row>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {fetching && !month ? (
        <Row justify="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Row>
      ) : (
        <>
          <SummaryStrip totals={totals} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 344px' },
              gap: 3,
              alignItems: 'start',
            }}
          >
            <BudgetLedger roots={roots} totals={totals} collapsed={collapsed} handlers={handlers} />
            <IncomePanel
              income={income}
              total={totals.income}
              onAdd={() => run(() => addIncome({ ownerId, ...NEW_INCOME, amount: 0 }))}
              onRename={(id, label) => run(() => renameIncome({ id, label }))}
              onSetAmount={(id, amount) => run(() => setIncomeAmount({ id, amount }), { key: id, value: amount })}
              onRemove={(id) => run(() => removeIncome({ id }))}
            />
          </Box>
        </>
      )}

      <DeleteNodeDialog
        node={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const id = pendingDelete?.id
          setPendingDelete(null)
          if (id) run(() => deleteNode({ id }))
        }}
      />

      {other && (
        <AppDialog
          open={confirmCopy}
          onClose={() => setConfirmCopy(false)}
          title={`Copy ${memberLabel(other)}'s budget`}
          subtitle={monthLabel(sel.year, sel.month)}
          width={400}
        >
          <Box sx={{ px: '22px', pb: '4px' }}>
            <Typography variant="body" sx={{ color: 'grey.500', lineHeight: 1.5 }}>
              Their categories and this month&apos;s amounts replace{' '}
              {ownerId === me.id ? 'yours' : `${memberLabel(viewed ?? me)}'s`}. Categories that only exist
              here are deleted, and any transactions filed under them become unfiled. This cannot be undone.
            </Typography>
          </Box>
          <Row justify="end" gap="10px" sx={{ p: '16px 22px 20px' }}>
            <Button variant="subtle" size="small" onClick={() => setConfirmCopy(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setConfirmCopy(false)
                // Every node id in the tree is about to change.
                setCollapsed({})
                run(() => copyBudgetFrom({ fromOwnerId: other.id, toOwnerId: ownerId, ...sel }))
              }}
              sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
            >
              Copy budget
            </Button>
          </Row>
        </AppDialog>
      )}
    </Stack>
  )
}
