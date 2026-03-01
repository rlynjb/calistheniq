/**
 * @file Application constants — single source of truth for app identity,
 * metadata, level names, and category colors.
 *
 * @description
 * Import constants from here rather than hardcoding values. Level names
 * and category colors were previously duplicated across 4+ files before
 * being centralized here.
 */

/** Application display name used in the header wordmark. */
export const APP_NAME = 'Contrl'

/** Short tagline for meta descriptions and social sharing. */
export const APP_DESCRIPTION = 'AI-powered calisthenics coach focused on helping beginners build strength safely'

/**
 * Next.js Metadata API object for `<head>` tags.
 * Passed to `export const metadata` in the root layout.
 */
export const APP_METADATA = {
  title: 'Contrl - AI-Powered Calisthenics Coach',
  description: 'AI-powered calisthenics coach focused on helping beginners build strength safely through proper form, controlled progressions, and body awareness.',
  keywords: ['calisthenics', 'fitness', 'AI coach', 'bodyweight', 'strength training'],
  authors: [{ name: 'Contrl Team' }],
}

/**
 * Next.js Viewport API object for the `<meta name="viewport">` tag.
 * Passed to `export const viewport` in the root layout.
 */
export const APP_VIEWPORT = {
  width: 'device-width',
  initialScale: 1,
}

/**
 * Human-readable names for each skill level.
 * Used in category headers (HomeView), tree node details (NodeDetail),
 * and the level-up modal (GatePassedModal).
 */
export const LEVEL_NAMES: Record<number, string> = {
  /** Entry-level exercises for those new to calisthenics. */
  1: 'Beginner',
  /** Foundational movements with some progression. */
  2: 'Novice',
  /** Standard calisthenics movements at full range of motion. */
  3: 'Intermediate',
  /** Challenging progressions requiring significant strength. */
  4: 'Advanced',
  /** Elite-level skills and movements. */
  5: 'Expert',
}

/**
 * Category color palette for programmatic styling.
 * Uses PascalCase keys ("Push") matching the legacy API convention.
 * Used by components that need dynamic inline styles rather than BEM classes.
 *
 * @remarks
 * Most category coloring is handled via BEM modifiers in CSS (`--push`, `--pull`, `--squat`).
 * This object is primarily for cases where inline `style` is required.
 */
export const CATEGORY_COLORS: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  /** Orange — Push exercises (chest, shoulders, triceps). */
  Push:  { color: "#F97316", bg: "#F9731610", border: "#F9731628", glow: "0 0 24px #F9731635" },
  /** Cyan — Pull exercises (back, biceps). */
  Pull:  { color: "#06B6D4", bg: "#06B6D410", border: "#06B6D428", glow: "0 0 24px #06B6D435" },
  /** Fuchsia — Squat exercises (legs, glutes). */
  Squat: { color: "#D946EF", bg: "#D946EF10", border: "#D946EF28", glow: "0 0 24px #D946EF35" },
}
