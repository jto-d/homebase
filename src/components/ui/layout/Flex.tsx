'use client'

import Box from '@mui/material/Box'
import type { BoxProps } from '@mui/material/Box'

type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch'

const ALIGN: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
}

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'column'
  align?: Align
  justify?: Justify
  gap?: number | string
  wrap?: boolean
  inline?: boolean
  /** Apply `minWidth: 0` so children can truncate inside a flex parent. */
  min0?: boolean
}

/** Thin flexbox wrapper. Maps shorthand props to flex CSS so call sites stop hand-rolling `display: flex`. */
export function Flex({
  direction = 'row',
  align,
  justify,
  gap,
  wrap,
  inline,
  min0,
  sx,
  ...rest
}: FlexProps) {
  return (
    <Box
      sx={[
        {
          display: inline ? 'inline-flex' : 'flex',
          flexDirection: direction,
          ...(align ? { alignItems: ALIGN[align] } : null),
          ...(justify ? { justifyContent: JUSTIFY[justify] } : null),
          ...(gap != null ? { gap } : null),
          ...(wrap ? { flexWrap: 'wrap' } : null),
          ...(min0 ? { minWidth: 0 } : null),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  )
}

/** Horizontal flex row, vertically centered by default. */
export function Row({ align = 'center', ...rest }: FlexProps) {
  return <Flex direction="row" align={align} {...rest} />
}

/**
 * Vertical flex column.
 *
 * Note the name collides with MUI's `Stack`. Pick one per file — the budget
 * ledger uses this one throughout; the older pages use MUI's.
 */
export function Stack(props: FlexProps) {
  return <Flex direction="column" {...props} />
}
