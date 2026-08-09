import Box from '@mui/material/Box'
import { Eyebrow, Row } from '@/components/ui'

/** Shared by the header, every row and the totals footer, so the columns line up. */
export const COL_W = 102

export function ColHeader() {
  const col = (label: string) => (
    <Box sx={{ width: COL_W, textAlign: 'right' }}>
      <Eyebrow sx={{ fontSize: '10px' }}>{label}</Eyebrow>
    </Box>
  )

  return (
    <Row gap={1} sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ flex: 1 }}>
        <Eyebrow sx={{ fontSize: '10px' }}>Category</Eyebrow>
      </Box>
      {col('Budget')}
      {col('Spent')}
      {col('Left')}
      <Box sx={{ width: 28 }} />
    </Row>
  )
}
