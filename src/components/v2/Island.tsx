'use client'

import styled from '@emotion/styled'
import { color, radius } from './tokens'

/** Bordered surface card — the shell for side panels, charts and banners. */
export const Island = styled.section({
  border: `1px solid ${color.border}`,
  borderRadius: radius.lg,
  backgroundColor: color.surface,
  padding: 16,
})
