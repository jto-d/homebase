'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { MonthStepper, currentMonth } from '@/components/MonthStepper'
import { memberLabel } from '@/lib/members'
import { fmtDay, fmtMoney } from '@/lib/format'
import { useHousehold } from '../household-context'
import {
  CreateTransactionDocument,
  DeleteTransactionDocument,
  SetTransactionSplitsDocument,
  TransactionsMonthDocument,
} from './transactions.queries'

const JOINT = '__joint__'
const UNFILED = '__unfiled__'

type SplitDraft = { budgetId: string; amount: string }

/** Cents, so the remainder readout can't sit at $0.00 while refusing to save. */
function cents(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.round(n * 100) : NaN
}

export default function TransactionsPage() {
  const { me, members } = useHousehold()
  const [sel, setSel] = useState(currentMonth)
  const [error, setError] = useState<string | null>(null)

  const [{ data, fetching }, refetch] = useQuery({
    query: TransactionsMonthDocument,
    variables: sel,
  })
  const [, createTransaction] = useMutation(CreateTransactionDocument)
  const [, setSplits] = useMutation(SetTransactionSplitsDocument)
  const [, deleteTransaction] = useMutation(DeleteTransactionDocument)

  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState<string>(me.id)
  const [budgetId, setBudgetId] = useState<string>(UNFILED)

  /** The transaction whose split editor is open, and its working copy. */
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<SplitDraft[]>([])

  // Leaves across both members: a shared cost is one transaction split between
  // two people's budgets, and only a leaf can be filed into.
  const budgets = data?.budgetLeaves ?? []
  const transactions = data?.transactions ?? []
  const budgetName = (id: string) => budgets.find((b) => b.id === id)?.path ?? 'Unknown budget'
  const reload = () => refetch({ requestPolicy: 'network-only' })

  function report(result: { error?: { graphQLErrors: readonly { message: string }[]; message: string } }) {
    if (!result.error) {
      setError(null)
      return true
    }
    setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
    return false
  }

  async function handleCreate() {
    const value = Number(amount)
    if (!merchant.trim() || !Number.isFinite(value)) {
      setError('Enter a merchant and an amount')
      return
    }
    const result = await createTransaction({
      merchant,
      date,
      amount: value,
      ownerId: payer === JOINT ? null : payer,
      budgetId: budgetId === UNFILED ? null : budgetId,
    })
    if (report(result)) {
      setMerchant('')
      setAmount('')
      reload()
    }
  }

  function openEditor(txn: (typeof transactions)[number]) {
    setEditing(txn.id)
    setDraft(
      txn.splits.length > 0
        ? txn.splits.map((s) => ({ budgetId: s.budgetId, amount: String(s.amount) }))
        : // Seed a first row with the whole amount, so the common "split this in
          // two" move is one edit rather than two.
          [{ budgetId: budgets[0]?.id ?? '', amount: String(txn.amount) }]
    )
  }

  /** Replace-all, matching the mutation. An empty list is how a transaction is unfiled. */
  async function handleSaveSplits(txnId: string, splits: { budgetId: string; amount: number }[]) {
    if (report(await setSplits({ transactionId: txnId, splits }))) {
      setEditing(null)
      reload()
    }
  }

  function draftSplits() {
    return draft
      .filter((row) => row.budgetId)
      .map((row) => ({ budgetId: row.budgetId, amount: Number(row.amount) }))
  }

  async function handleDelete(id: string) {
    if (report(await deleteTransaction({ id }))) reload()
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Transactions
      </Typography>

      <MonthStepper value={sel} onChange={setSel} />

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Add a transaction
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Merchant"
              size="small"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Date"
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Amount"
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              sx={{ width: 110 }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Paid by"
              size="small"
              select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              sx={{ flex: 1 }}
            >
              {members.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {memberLabel(m)}
                </MenuItem>
              ))}
              <MenuItem value={JOINT}>Joint account</MenuItem>
            </TextField>
            <TextField
              label="Budget"
              size="small"
              select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              sx={{ flex: 1 }}
              helperText="Leave unfiled to split it below"
            >
              <MenuItem value={UNFILED}>Unfiled</MenuItem>
              {budgets.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.path}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Button variant="contained" onClick={handleCreate} sx={{ alignSelf: 'flex-start' }}>
            Add transaction
          </Button>
        </Stack>
      </Card>

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2} divider={<Divider flexItem />}>
            {transactions.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Nothing this month.
              </Typography>
            )}

            {transactions.map((txn) => {
              const isEditing = editing === txn.id
              const remainder = isEditing
                ? cents(String(txn.amount)) -
                  draft.reduce((sum, row) => sum + (cents(row.amount) || 0), 0)
                : 0

              return (
                <Stack key={txn.id} spacing={1}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {txn.merchant}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {fmtDay(txn.date)}
                        {' · '}
                        {txn.ownerId
                          ? memberLabel(members.find((m) => m.id === txn.ownerId) ?? me)
                          : 'Joint'}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {fmtMoney(txn.amount)}
                    </Typography>
                    <Button size="small" onClick={() => (isEditing ? setEditing(null) : openEditor(txn))}>
                      {isEditing ? 'Cancel' : txn.splits.length > 0 ? 'Edit split' : 'File'}
                    </Button>
                    <IconButton
                      size="small"
                      aria-label={`Delete ${txn.merchant}`}
                      onClick={() => handleDelete(txn.id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>

                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {txn.splits.length === 0 ? (
                      <Chip size="small" label="Unfiled" color="warning" variant="outlined" />
                    ) : (
                      txn.splits.map((s) => (
                        <Chip
                          key={s.id}
                          size="small"
                          variant="outlined"
                          label={`${budgetName(s.budgetId)} ${fmtMoney(s.amount)}`}
                        />
                      ))
                    )}
                  </Stack>

                  {isEditing && (
                    <Stack spacing={1} sx={{ pl: 1, borderLeft: '2px solid', borderColor: 'divider' }}>
                      {draft.map((row, i) => (
                        <Stack key={i} direction="row" spacing={1}>
                          <TextField
                            size="small"
                            select
                            label="Budget"
                            value={row.budgetId}
                            onChange={(e) =>
                              setDraft(draft.map((r, j) => (i === j ? { ...r, budgetId: e.target.value } : r)))
                            }
                            sx={{ flex: 1 }}
                          >
                            {budgets.map((b) => (
                              <MenuItem key={b.id} value={b.id}>
                                {b.path}
                              </MenuItem>
                            ))}
                          </TextField>
                          <TextField
                            size="small"
                            label="Amount"
                            value={row.amount}
                            onChange={(e) =>
                              setDraft(draft.map((r, j) => (i === j ? { ...r, amount: e.target.value } : r)))
                            }
                            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
                            sx={{ width: 110 }}
                          />
                          <IconButton
                            size="small"
                            aria-label="Remove split"
                            onClick={() => setDraft(draft.filter((_, j) => i !== j))}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ))}

                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Button
                          size="small"
                          onClick={() =>
                            setDraft([
                              ...draft,
                              // Prefill the gap: the second half of a 50/50 is
                              // usually exactly what's left.
                              { budgetId: '', amount: remainder > 0 ? String(remainder / 100) : '' },
                            ])
                          }
                        >
                          Add split
                        </Button>
                        <Typography
                          variant="caption"
                          sx={{ flex: 1, color: remainder === 0 ? 'text.secondary' : 'error.main' }}
                        >
                          {remainder === 0
                            ? 'Adds up'
                            : `${fmtMoney(Math.abs(remainder) / 100)} ${remainder > 0 ? 'left to file' : 'over'}`}
                        </Typography>
                        <Button size="small" onClick={() => handleSaveSplits(txn.id, [])}>
                          Unfile
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={remainder !== 0 || draft.some((r) => !r.budgetId)}
                          onClick={() => handleSaveSplits(txn.id, draftSplits())}
                        >
                          Save
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              )
            })}
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
