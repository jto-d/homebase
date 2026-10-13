'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import styled from '@emotion/styled'
import { XIcon } from '@phosphor-icons/react'
import { IconButton } from './IconButton'
import { color, shadow } from './tokens'

const Backdrop = styled(BaseDialog.Backdrop)({
  position: 'fixed',
  inset: 0,
  minHeight: '100dvh',
  backgroundColor: 'rgba(16, 24, 32, 0.42)',
  transition: 'opacity 150ms',
  '@supports (-webkit-touch-callout: none)': { position: 'absolute' },
  '&[data-starting-style], &[data-ending-style]': { opacity: 0 },
})

const StyledPopup = styled(BaseDialog.Popup)({
  boxSizing: 'border-box',
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  display: 'flex',
  flexDirection: 'column',
  width: 'var(--dialog-width, 440px)',
  maxWidth: 'calc(100vw - 32px)',
  maxHeight: 'calc(100vh - 48px)',
  outline: 0,
  backgroundColor: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: 12,
  boxShadow: shadow.lg,
  overflow: 'hidden',
  transition: 'opacity 100ms ease-out, transform 100ms ease-out',
  '&[data-starting-style], &[data-ending-style]': {
    opacity: 0,
    transform: 'translate(-50%, -50%) scale(0.98)',
  },
})

function Popup({
  children,
  width = 440,
  style,
  ...props
}: BaseDialog.Popup.Props & { width?: number }) {
  return (
    <BaseDialog.Portal>
      <Backdrop />
      <StyledPopup
        style={{ ['--dialog-width' as string]: `${width}px`, ...style }}
        {...props}
      >
        {children}
      </StyledPopup>
    </BaseDialog.Portal>
  )
}

const Title = styled(BaseDialog.Title)({
  margin: 0,
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: '-0.015em',
  color: color.text,
})

const Description = styled(BaseDialog.Description)({
  margin: '4px 0 0',
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.45,
  color: color.icon,
})

const CloseButton = styled(IconButton)({
  marginTop: -2,
  marginRight: -6,
})

function Close(props: Omit<React.ComponentProps<typeof IconButton>, 'children'>) {
  return (
    <BaseDialog.Close render={<CloseButton aria-label="Close" {...props} />}>
      <XIcon size={16} weight="bold" />
    </BaseDialog.Close>
  )
}

const Header = styled.div({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  padding: '20px 22px 14px',
  flex: 'none',
})

const Body = styled.div({
  padding: '0 22px 20px',
  overflow: 'auto',
  minHeight: 0,
})

const Footer = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '14px 22px 20px',
  flex: 'none',
  borderTop: `1px solid ${color.border}`,
})

export const Dialog = {
  Root: BaseDialog.Root,
  Trigger: BaseDialog.Trigger,
  Popup,
  Header,
  Title,
  Description,
  Close,
  Body,
  Footer,
}
