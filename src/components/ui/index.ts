/**
 * Shared UI primitives. Ported from Anchor with the first feature brief, as
 * AGENTS.md called for — only the pieces the budget ledger actually uses.
 *
 * Note `Stack` here is the flex-column primitive, not MUI's. Import from one or
 * the other per file, never both.
 */
export { Flex, Row, Stack } from './layout/Flex'
export type { FlexProps } from './layout/Flex'
export { SurfaceCard } from './layout/SurfaceCard'
export { VDivider } from './layout/VDivider'

export { CatGlyph } from './data-display/CatGlyph'
export { Dot } from './data-display/Dot'
export { Eyebrow } from './data-display/Eyebrow'
export { ListRow } from './data-display/ListRow'
export { PanelHeader } from './data-display/PanelHeader'
export { ProgressBar } from './data-display/ProgressBar'
export { Stat } from './data-display/Stat'

export { EditableLabel } from './inputs/EditableLabel'
export { EditableMoney } from './inputs/EditableMoney'
export { Segmented } from './inputs/Segmented'
export type { SegmentedOption } from './inputs/Segmented'

export { AppDialog } from './feedback/AppDialog'
