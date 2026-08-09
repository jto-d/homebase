'use client'

import { createTheme } from '@mui/material/styles'

/**
 * Deliberately minimal — enough for the auth and pairing screens. The full design
 * system (brand scales, typography variants, `components/ui`) lands with the first
 * feature brief.
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
