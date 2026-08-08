'use client'

import Box from '@mui/material/Box'
import { memberColorHex, memberInitial, memberLabel } from '@/lib/members'

export interface Member {
  id: string
  name?: string | null
  email: string
  color: string
}

/**
 * The "whose is whose" primitive. Every later feature (card ownership tags,
 * budget attribution, split rows) renders member identity through this, so a
 * person looks the same everywhere in the app.
 */
export function MemberAvatar({ member, size = 32 }: { member: Member; size?: number }) {
  return (
    <Box
      component="span"
      title={memberLabel(member)}
      sx={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '999px',
        display: 'grid',
        placeItems: 'center',
        bgcolor: memberColorHex(member.color),
        color: '#fff',
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
      }}
    >
      {memberInitial(member)}
    </Box>
  )
}
