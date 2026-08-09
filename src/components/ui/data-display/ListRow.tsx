import { Flex } from '../layout/Flex'
import type { FlexProps } from '../layout/Flex'

interface ListRowProps extends FlexProps {
  /** Drop the bottom border (use on the final row of a list). */
  last?: boolean
  /** Set false to never draw a bottom border. Defaults true. */
  divider?: boolean
  /** Add a subtle hover background. */
  hover?: boolean
}

/** A padded list item with a managed bottom divider. Defaults to a vertically-centered row. */
export function ListRow({
  last = false,
  divider = true,
  hover = false,
  direction = 'row',
  align = direction === 'column' ? 'stretch' : 'center',
  sx,
  ...rest
}: ListRowProps) {
  return (
    <Flex
      direction={direction}
      align={align}
      sx={[
        {
          px: 2.5,
          py: 1.5,
          borderBottom: divider && !last ? '1px solid' : 'none',
          borderColor: 'divider',
          ...(hover
            ? { cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' }, transition: 'background 0.15s ease' }
            : null),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  )
}
