/**
 * @file Animated chevron indicator — rotates 180° when expanded.
 *
 * @description
 * Used in category row headers to indicate expand/collapse state.
 * Points down when collapsed, up when expanded (via CSS rotate-180).
 *
 * @see {@link HomeView} for usage in category row action area
 */
import { cn } from '@/lib/utils'

interface ChevronIconProps {
  /** Whether the parent container is expanded. Rotates the chevron 180° when true. */
  expanded: boolean
}

/**
 * Renders a 16x16 SVG chevron (down arrow) that animates rotation
 * based on expand/collapse state.
 *
 * @example
 * <ChevronIcon expanded={isOpen} />
 */
export function ChevronIcon({ expanded }: ChevronIconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'chevron-icon',
        expanded && 'chevron-icon--expanded'
      )}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
