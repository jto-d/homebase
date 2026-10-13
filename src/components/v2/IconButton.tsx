'use client'

import { Button } from '@base-ui/react/button'
import styled from '@emotion/styled'
import { buttonReset, color, radius } from './tokens'

export const IconButton = styled(Button)({
  ...buttonReset,
  display: 'inline-grid',
  placeItems: 'center',
  flex: 'none',
  width: 26,
  height: 26,
  borderRadius: radius.md,
  color: color.icon,
  '&:hover': { backgroundColor: color.hover, color: color.iconHover },
})
