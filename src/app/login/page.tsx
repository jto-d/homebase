'use client'

import { signIn } from 'next-auth/react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ p: 5, width: '100%', maxWidth: 380 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Homebase
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Shared personal finance for two.
          </Typography>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => signIn('google', { callbackUrl: '/' })}
            sx={{ mt: 1 }}
          >
            Continue with Google
          </Button>
        </Stack>
      </Card>
    </Box>
  )
}
