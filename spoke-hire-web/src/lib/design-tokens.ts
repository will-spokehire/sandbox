/**
 * Design Tokens
 * 
 * Centralized design constants for consistent layouts, spacing, and styling
 * across all user-facing pages.
 */

export const LAYOUT_CONSTANTS = {
  // Container classes
  container: "container mx-auto px-4",
  containerNarrow: "container mx-auto px-4 max-w-3xl",
  containerWide: "container mx-auto px-4 max-w-7xl",
  
  // Spacing
  pageSpacing: "py-8 md:py-12",
  pageSpacingCompact: "py-6 md:py-8",
  sectionSpacing: "space-y-6",
  
  // Backgrounds
  bgDefault: "bg-background",
  bgMuted: "bg-slate-50 dark:bg-slate-900",
  
  // Page wrapper
  pageWrapper: "min-h-screen flex flex-col",
  mainContent: "flex-1",
  
  // Two-column layouts (for detail pages)
  detailGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8",
  detailGridLeft: "lg:col-span-2 space-y-6",
  detailGridRight: "lg:col-span-1 space-y-6",
} as const;

/**
 * Typography Standards
 * 
 * Consistent heading and text sizes across the application
 */
export const TYPOGRAPHY = {
  // Headings
  pageTitle: "text-3xl md:text-4xl font-bold tracking-tight",
  heroTitle: "text-4xl md:text-5xl font-bold tracking-tight",
  sectionTitle: "text-2xl md:text-3xl font-bold",
  subsectionTitle: "text-xl md:text-2xl font-semibold",
  
  // Body text
  pageDescription: "text-muted-foreground text-base md:text-lg",
  bodyText: "text-base",
  smallText: "text-sm",
} as const;

