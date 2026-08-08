'use client'

import { createTheme } from '@mui/material/styles'

/**
 * Deliberately minimal — just enough for the auth and pairing screens to look
 * intentional. The full design system (brand scales, typography variants, the
 * `components/ui` primitives) lands with the first feature brief.
 */
export const theme = createTheme({
  palette: {
    primary: { main: '#119290' },
    background: { default: '#FAFAFA' },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
  },
})
