'use client'

import { useState } from 'react'
import { useQuery } from '@urql/next'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import { CatGlyph, EditableMoney, Eyebrow, ListRow, ProgressBar, Row, SurfaceCard, PanelHeader } from '@/components/ui'
import type { MonthSel } from '@/components/MonthStepper'
import { currentMonth } from '@/components/MonthStepper'
import { goalProgress, monthLeftover, monthOrdinal, roundCents, splitEvenly, sumMoney, type BudgetNodeData, type GoalProgress } from '@/lib/budget'
import { fmtDollars, monthLabel, shortMonthLabel, clamp01 } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'
import { GoalsUnfiledDocument } from './budget.queries'

/**
 * Every accumulating fund in one card — goals with a bar and a projected
 * finish on top, everything else that just banks money below a divider — plus
 * a footer that sweeps the month's unspent leftover into them.
 *
 * Scoped to `goalTarget` only, not `annualLimit`: the two are deliberately
 * separate mechanisms (see AGENTS.md/plan) — a savings node with only an
 * annual limit and no goal shows here as an ordinary "no target" balance, and
 * keeps its year-to-date bar where it already lives, in the ledger row.
 *
 * Setting the target is inline (click-to-edit, like `AnnualLimitBar`) rather
 * than a dedicated dialog — the artboard's "designate" sheet (5c) is a bigger
 * surface (rollover/goal toggles, linked account) out of scope here.
 */
export function GoalsPanel({
  nodes,
  sel,
  monthSwept,
  onSetGoal,
  onSweep,
}: {
  nodes: BudgetNodeData[]
  sel: MonthSel
  monthSwept: number
  onSetGoal: (id: string, target: number | null) => void
  onSweep: (allocations: { nodeId: string; amount: number }[]) => void
}) {
  const [{ data: unfiledData }] = useQuery({ query: GoalsUnfiledDocument, variables: sel })
  const unfiledCount = (unfiledData?.transactions ?? []).filter((t) => t.splits.length === 0).length

  const hasChildren = new Set(nodes.map((n) => n.parentId).filter((id): id is string => id != null))
  const accruing = nodes.filter((n) => !hasChildren.has(n.id) && (n.isSavings || n.rollsOver))
  const goals = accruing.filter((n) => n.goalTarget != null)
  const untargeted = accruing.filter((n) => n.goalTarget == null)

  const totalBanked = sumMoney(accruing, (n) => n.banked)
  const totalMonthly = sumMoney(accruing, (n) => n.budget)
  const leftover = monthLeftover(nodes, monthSwept)
  const isPast = monthOrdinal(sel) < monthOrdinal(currentMonth())

  const [allocating, setAllocating] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, number>>({})
  const setDraft = (id: string, v: number) => setDrafts((prev) => ({ ...prev, [id]: v }))

  const entered = sumMoney(accruing, (n) => drafts[n.id] ?? 0)
  const remaining = roundCents(leftover - entered)

  function cancel() {
    setAllocating(false)
    setDrafts({})
  }
  function confirm() {
    const allocations = accruing
      .map((n) => ({ nodeId: n.id, amount: drafts[n.id] ?? 0 }))
      .filter((a) => a.amount > 0)
    cancel()
    onSweep(allocations)
  }
  function splitAllEvenly() {
    setDrafts(Object.fromEntries(splitEvenly(leftover, accruing.map((n) => n.id))))
  }

  return (
    <SurfaceCard>
      {allocating ? (
        <Box sx={{ bgcolor: brand.teal[50], px: 2.25, py: 2, borderBottom: '1px solid', borderColor: brand.teal[100] }}>
          <Row justify="between">
            <Typography variant="panelTitle" sx={{ color: brand.teal[800] }}>
              Allocating
            </Typography>
            <Typography variant="label" sx={{ color: 'primary.main' }}>
              tap a goal to split
            </Typography>
          </Row>
          <Row align="baseline" gap={1} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'primary.main', ...tabularNums }}>
              {fmtDollars(Math.max(0, remaining))}
            </Typography>
            <Typography variant="label" sx={{ color: 'primary.main' }}>
              of {fmtDollars(leftover)} left
            </Typography>
          </Row>
          <ProgressBar
            value={leftover > 0 ? entered / leftover : 0}
            color="primary.main"
            track={brand.teal[100]}
            sx={{ mt: 1.5 }}
          />
        </Box>
      ) : (
        <PanelHeader
          icon="flag"
          tone="accent"
          title="Goals"
          subtitle={`${fmtDollars(totalBanked)} banked · ${fmtDollars(totalMonthly)} / mo`}
        />
      )}

      {goals.map((node, i) => (
        <GoalRow
          key={node.id}
          node={node}
          sel={sel}
          last={i === goals.length - 1 && untargeted.length === 0}
          allocating={allocating}
          draft={drafts[node.id] ?? 0}
          onDraft={(v) => setDraft(node.id, v)}
          onSetGoal={(v) => onSetGoal(node.id, v)}
        />
      ))}

      {untargeted.length > 0 && (
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', px: 2.5, py: 1 }}>
          <Eyebrow>No target</Eyebrow>
        </Box>
      )}
      {untargeted.map((node, i) => (
        <UntargetedRow
          key={node.id}
          node={node}
          last={i === untargeted.length - 1}
          allocating={allocating}
          draft={drafts[node.id] ?? 0}
          onDraft={(v) => setDraft(node.id, v)}
          onSetGoal={(v) => onSetGoal(node.id, v)}
        />
      ))}

      {accruing.length === 0 && (
        <Box sx={{ px: 2.25, py: 3.5, textAlign: 'center' }}>
          <Typography variant="body" color="text.disabled">
            No savings or rollover funds yet.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          borderRadius: '0 0 14px 14px',
          px: 2.5,
          py: 1.75,
        }}
      >
        {allocating ? (
          <Row justify="between" gap={1}>
            <Button variant="text" size="small" onClick={splitAllEvenly} disabled={accruing.length === 0}>
              Split evenly
            </Button>
            <Row gap={1}>
              <Button variant="subtle" size="small" onClick={cancel}>
                Cancel
              </Button>
              <Button variant="contained" size="small" disabled={entered <= 0 || remaining < -0.001} onClick={confirm}>
                Confirm {fmtDollars(entered)}
              </Button>
            </Row>
          </Row>
        ) : (
          <Row align="baseline" justify="between" gap={1.5}>
            <Box>
              <Typography variant="label" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                {isPast ? `Unspent in ${monthLabel(sel.year, sel.month)}` : 'Unspent so far'}
              </Typography>
              <Typography variant="note" color="text.disabled" sx={{ mt: '2px', display: 'block' }}>
                budgeted − spent
              </Typography>
              {unfiledCount > 0 && (
                <Typography variant="note" sx={{ color: brand.amber[700], mt: '2px', display: 'block' }}>
                  {unfiledCount} transaction{unfiledCount === 1 ? '' : 's'} unfiled — this may overstate what&apos;s left
                </Typography>
              )}
            </Box>
            <Row gap={1.25}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'primary.main', ...tabularNums }}>
                {fmtDollars(leftover)}
              </Typography>
              <Button variant="contained" size="small" disabled={leftover <= 0} onClick={() => setAllocating(true)}>
                Allocate
              </Button>
            </Row>
          </Row>
        )}
      </Box>
    </SurfaceCard>
  )
}

function dateLabel(gp: GoalProgress): string {
  return gp.projectedDate ? shortMonthLabel(gp.projectedDate.year, gp.projectedDate.month) : 'met'
}

function GoalRow({
  node,
  sel,
  last,
  allocating,
  draft,
  onDraft,
  onSetGoal,
}: {
  node: BudgetNodeData
  sel: MonthSel
  last: boolean
  allocating: boolean
  draft: number
  onDraft: (v: number) => void
  /** null clears the target, dropping this row back to "no target". */
  onSetGoal: (target: number | null) => void
}) {
  const target = node.goalTarget ?? 0
  const progress = goalProgress({ banked: node.banked, goalTarget: target, monthly: node.budget, sel })
  const pending = allocating && draft > 0 ? goalProgress({ banked: node.banked + draft, goalTarget: target, monthly: node.budget, sel }) : null
  const ratio = clamp01(progress.ratio)
  const displayRatio = clamp01((pending ?? progress).ratio)
  const barColor = displayRatio >= 1 ? brand.red[500] : displayRatio >= 0.85 ? brand.gold[500] : brand.teal[600]

  return (
    <ListRow last={last} direction="column" divider={!allocating || !last} sx={{ px: 2.25, py: 1.75 }}>
      <Row gap={1.125} sx={{ mb: 1.25 }}>
        <CatGlyph icon={node.icon} size={26} tone="neutral" />
        <Typography variant="body" sx={{ flex: 1 }}>
          {node.label}
        </Typography>
        {allocating ? (
          <EditableMoney value={draft} onChange={onDraft} size={13} weight={600} />
        ) : (
          <Row gap="2px">
            <Typography variant="note" sx={{ ...tabularNums }}>
              {fmtDollars(node.banked)} of
            </Typography>
            <EditableMoney value={target} onChange={(v) => onSetGoal(v || null)} size={11} weight={600} />
          </Row>
        )}
      </Row>
      <Box sx={{ display: 'flex', height: 7, borderRadius: 999, overflow: 'hidden', bgcolor: 'grey.100' }}>
        <Box sx={{ width: `${ratio * 100}%`, bgcolor: barColor }} />
        {pending && <Box sx={{ width: `${clamp01(displayRatio - ratio) * 100}%`, bgcolor: brand.teal[200] }} />}
      </Box>
      <Row justify="between" sx={{ mt: 0.875 }}>
        <Typography
          variant="note"
          sx={{ fontWeight: 600, color: pending ? 'primary.main' : 'text.secondary', ...tabularNums }}
        >
          {pending ? `${Math.round(displayRatio * 100)}% after this` : `${Math.round(ratio * 100)}%`}
        </Typography>
        <Typography variant="note" color="text.secondary" sx={{ ...tabularNums }}>
          {fmtDollars(node.budget)} / mo
          {pending ? ` · ${dateLabel(progress)} → ${dateLabel(pending)}` : progress.projectedDate ? ` · ${dateLabel(progress)}` : ''}
        </Typography>
      </Row>
    </ListRow>
  )
}

function UntargetedRow({
  node,
  last,
  allocating,
  draft,
  onDraft,
  onSetGoal,
}: {
  node: BudgetNodeData
  last: boolean
  allocating: boolean
  draft: number
  onDraft: (v: number) => void
  onSetGoal: (target: number | null) => void
}) {
  return (
    <ListRow last={last} gap={1.125} sx={{ px: 2.25, py: 1.625 }}>
      <CatGlyph icon={node.icon} size={26} tone="neutral" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body">{node.label}</Typography>
        <Typography variant="note" color="text.disabled" sx={{ mt: '2px', ...tabularNums }}>
          {fmtDollars(node.budget)} / mo
        </Typography>
      </Box>
      {allocating ? (
        <EditableMoney value={draft} onChange={onDraft} size={13} weight={600} />
      ) : (
        <>
          <Typography variant="bodyStrong" sx={{ ...tabularNums }}>
            {fmtDollars(node.banked)}
          </Typography>
          <IconButton
            size="small"
            title="Set a goal"
            onClick={() => onSetGoal(Math.max(100, Math.round(node.banked / 100) * 100 + 100))}
            sx={{ width: 24, height: 24, borderRadius: '6px', color: 'text.disabled', '&:hover': { color: 'primary.main', bgcolor: 'grey.100' } }}
          >
            <FlagOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </>
      )}
    </ListRow>
  )
}
