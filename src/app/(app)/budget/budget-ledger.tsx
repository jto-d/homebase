'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { Row, SurfaceCard } from '@/components/ui'
import type { BudgetTotals, BudgetTreeNode } from '@/lib/budget'
import { fmtDollars, fmtSigned } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'
import { COL_W, ColHeader } from './col-header'
import { GroupHeader } from './group-header'
import { LedgerRow } from './ledger-row'
import type { PendingDelete } from './delete-node-dialog'

export interface LedgerHandlers {
  onAddChild: (parentId: string) => void
  onAddGroup: () => void
  onRename: (id: string, label: string) => void
  onDelete: (node: PendingDelete) => void
  onBudget: (id: string, value: number) => void
  onContributed: (id: string, value: number) => void
  onAnnualLimit: (id: string, value: number) => void
  onToggle: (id: string) => void
}

/**
 * The ledger card: groups, their categories, and any line items beneath those.
 *
 * There is no separate savings section or subscriptions section — a savings
 * subtree renders through the same path as everything else, its rows just
 * carry a typed transfer instead of derived spend.
 */
export function BudgetLedger({
  roots,
  totals,
  collapsed,
  handlers,
}: {
  roots: BudgetTreeNode[]
  totals: BudgetTotals
  collapsed: Record<string, boolean>
  handlers: LedgerHandlers
}) {
  const { onAddChild, onAddGroup, onRename, onDelete, onBudget, onContributed, onAnnualLimit, onToggle } = handlers

  return (
    <SurfaceCard>
      <ColHeader />

      {roots.map((group) => (
        <Box key={group.id}>
          <GroupHeader
            label={group.label}
            icon={group.icon}
            childCount={group.children.length}
            spent={group.spent}
            budget={group.budget}
            collapsed={!!collapsed[group.id]}
            onToggle={() => onToggle(group.id)}
            onAdd={() => onAddChild(group.id)}
            onRename={(label) => onRename(group.id, label)}
            onRemove={() => onDelete({ id: group.id, label: group.label, childCount: countBelow(group) })}
          />

          <Collapse in={!collapsed[group.id]}>
            {group.children.map((category, i) => {
              const hasLines = category.children.length > 0
              const isLast = i === group.children.length - 1
              const catCollapsed = !!collapsed[category.id]

              return (
                <Box key={category.id}>
                  <LedgerRow
                    label={category.label}
                    icon={category.icon}
                    budget={category.budget}
                    spent={category.spent}
                    ytd={category.ytd}
                    annualLimit={category.annualLimit}
                    // A category with line items no longer owns its number.
                    onBudget={hasLines ? undefined : (v) => onBudget(category.id, v)}
                    onSpent={
                      category.isSavings && !hasLines ? (v) => onContributed(category.id, v) : undefined
                    }
                    onAnnualLimit={(v) => onAnnualLimit(category.id, v)}
                    onRename={(label) => onRename(category.id, label)}
                    onRemove={() =>
                      onDelete({ id: category.id, label: category.label, childCount: category.children.length })
                    }
                    onAdd={() => onAddChild(category.id)}
                    expandable={hasLines}
                    collapsed={catCollapsed}
                    onToggleExpand={hasLines ? () => onToggle(category.id) : undefined}
                    last={isLast && (!hasLines || catCollapsed)}
                  />

                  {hasLines && (
                    <Collapse in={!catCollapsed}>
                      {category.children.map((line, j) => (
                        <LedgerRow
                          key={line.id}
                          label={line.label}
                          icon={line.icon}
                          budget={line.budget}
                          spent={line.spent}
                          ytd={line.ytd}
                          annualLimit={line.annualLimit}
                          onBudget={(v) => onBudget(line.id, v)}
                          onSpent={line.isSavings ? (v) => onContributed(line.id, v) : undefined}
                          onAnnualLimit={(v) => onAnnualLimit(line.id, v)}
                          onRename={(label) => onRename(line.id, label)}
                          onRemove={() => onDelete({ id: line.id, label: line.label, childCount: 0 })}
                          indent
                          last={isLast && j === category.children.length - 1}
                        />
                      ))}
                    </Collapse>
                  )}
                </Box>
              )
            })}

            {group.children.length === 0 && (
              <Box sx={{ p: 2.5, textAlign: 'center' }}>
                <Typography variant="body" color="text.disabled">
                  Nothing in here yet. Add a category.
                </Typography>
              </Box>
            )}
          </Collapse>
        </Box>
      ))}

      <Row sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={onAddGroup}
          sx={{
            textTransform: 'none',
            fontSize: 12,
            fontWeight: 500,
            color: 'text.disabled',
            px: 1,
            py: 0.5,
            borderRadius: '7px',
            '&:hover': { color: 'text.secondary', bgcolor: 'grey.100' },
          }}
        >
          Add group
        </Button>
      </Row>

      <Row gap={1} sx={{ px: 2.5, py: 1.875, borderTop: '1px solid', borderColor: 'grey.300', bgcolor: 'grey.50' }}>
        <Typography
          sx={{
            flex: 1,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.01em',
            textTransform: 'uppercase',
            color: 'text.secondary',
          }}
        >
          Total budgeted
        </Typography>
        {[totals.budgeted, totals.spent, totals.budgeted - totals.spent].map((v, i) => (
          <Box key={i} sx={{ width: COL_W, textAlign: 'right', ...(i === 2 ? { pr: '8px' } : {}) }}>
            <Typography
              sx={{
                ...tabularNums,
                fontSize: 15,
                fontWeight: 700,
                color: i === 2 && v < 0 ? brand.red[600] : 'text.primary',
              }}
            >
              {i === 2 ? fmtSigned(v) : fmtDollars(v)}
            </Typography>
          </Box>
        ))}
        <Box sx={{ width: 28 }} />
      </Row>
    </SurfaceCard>
  )
}

/** Everything a delete would take: children plus grandchildren. */
function countBelow(node: BudgetTreeNode): number {
  return node.children.reduce((n, child) => n + 1 + child.children.length, 0)
}
