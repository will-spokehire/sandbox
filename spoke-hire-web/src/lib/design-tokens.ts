/**
 * Design Tokens
 *
 * Centralized design constants for consistent layouts, spacing, and styling
 * across all user-facing pages. Based on the Figma Design System for SpokeHire.
 */

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const LAYOUT_CONSTANTS = {
  // Container classes
  container: "container mx-auto px-4",
  containerNarrow: "container mx-auto px-4 max-w-3xl",
  containerWide: "container mx-auto px-4 max-w-7xl",

  // Max-width constraint (based on Figma design)
  maxWidth: "max-w-[1512px]",
  maxWidthContainer: "max-w-[1512px] mx-auto px-4 md:px-[30px]",

  // Common content wrapper padding (matches header and carousels)
  contentPadding: "px-4 md:px-[30px]",

  // Spacing
  pageSpacing: "py-8 md:py-12",
  pageSpacingCompact: "py-6 md:py-8",
  sectionSpacing: "space-y-6",

  // Backgrounds
  bgDefault: "bg-background",
  bgMuted: "bg-slate-50 dark:bg-slate-900",
  bgSpoke: "bg-spoke-grey", // #F4F4F5

  // Page wrapper
  pageWrapper: "min-h-screen flex flex-col",
  mainContent: "flex-1",

  // Two-column layouts (for detail pages)
  detailGrid: "grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8",
  detailGridLeft: "lg:col-span-2 space-y-6",
  detailGridRight: "lg:col-span-1 space-y-6",
} as const;

// ============================================
// TYPOGRAPHY STANDARDS
// Based on Figma Design System
// ============================================

export const TYPOGRAPHY = {
  // Headings - using CSS utility classes from globals.css
  h1: "heading-1", // 96px desktop / 48px mobile
  h2: "heading-2", // 64px desktop / 42px mobile
  h3: "heading-3", // 36px desktop / 32px mobile (display variant)
  h4: "heading-4", // 32px desktop / 24px mobile
  h5: "heading-5", // 24px desktop / 18px mobile
  h6: "heading-6", // 18px desktop / 16px mobile

  // Body text
  bodyLarge: "body-large", // 22px desktop / 18px mobile
  bodyMedium: "body-medium", // 18px desktop / 16px mobile
  bodySmall: "body-small", // 14px
  bodyXs: "body-xs", // 12px

  // Light weight variants
  bodyLargeLight: "body-large-light",

  // UI text
  buttonText: "button-text", // Helvetica Neue, 18px, uppercase
  labelText: "label-text", // 16px
  linkText: "link-text", // 14px, medium weight

  // Legacy aliases for backwards compatibility
  pageTitle: "heading-2",
  heroTitle: "heading-1",
  sectionTitle: "heading-3",
  subsectionTitle: "heading-4",
  pageDescription: "body-large text-muted-foreground",
  bodyText: "body-medium",
  smallText: "body-small",
} as const;

// ============================================
// SPACING SCALE
// 4px base unit
// ============================================

export const SPACING = {
  xs: "var(--space-xs)", // 4px
  sm: "var(--space-sm)", // 8px
  md: "var(--space-md)", // 12px
  base: "var(--space-base)", // 16px
  lg: "var(--space-lg)", // 24px
  xl: "var(--space-xl)", // 32px
  "2xl": "var(--space-2xl)", // 48px
  "3xl": "var(--space-3xl)", // 64px
  "4xl": "var(--space-4xl)", // 96px
} as const;

// Tailwind class equivalents
export const SPACING_CLASSES = {
  xs: "gap-1", // 4px
  sm: "gap-2", // 8px
  md: "gap-3", // 12px
  base: "gap-4", // 16px
  lg: "gap-6", // 24px
  xl: "gap-8", // 32px
  "2xl": "gap-12", // 48px
  "3xl": "gap-16", // 64px
  "4xl": "gap-24", // 96px
} as const;

// ============================================
// COLOR TOKENS
// ============================================

export const COLORS = {
  // Brand colors
  spokeBlack: "var(--spoke-black)", // #000000
  spokeWhite: "var(--spoke-white)", // #FFFFFF
  spokeGrey: "var(--spoke-grey)", // #F4F4F5
  spokeGreyLight: "var(--spoke-grey-light)", // #EFEFEF

  // Semantic colors (from shadcn)
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  destructive: "var(--destructive)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
} as const;

// Tailwind class equivalents
export const COLOR_CLASSES = {
  spokeBlack: "bg-spoke-black text-spoke-white",
  spokeWhite: "bg-spoke-white text-spoke-black",
  spokeGrey: "bg-spoke-grey",
  spokeGreyLight: "bg-spoke-grey-light",
} as const;

// ============================================
// BUTTON STYLES
// Based on Figma design
// ============================================

export const BUTTON_STYLES = {
  // Base button styles
  base: "btn-base",

  // Variants
  primary: "btn-base btn-primary",
  secondary: "btn-base btn-secondary",

  // Sizes using Tailwind
  sizeSm: "px-4 py-2 text-sm",
  sizeMd: "px-6 py-3", // Default from Figma
  sizeLg: "px-8 py-4 text-lg",

  // Full Tailwind variants (alternative to CSS classes)
  primaryTw:
    "inline-flex items-center justify-center bg-spoke-black text-spoke-white border border-spoke-black px-6 py-3 font-helvetica text-lg font-normal uppercase leading-relaxed transition-all hover:opacity-90",
  secondaryTw:
    "inline-flex items-center justify-center bg-transparent text-spoke-black border border-spoke-black px-6 py-3 font-helvetica text-lg font-normal uppercase leading-relaxed transition-all hover:bg-spoke-black hover:text-spoke-white",
} as const;

// ============================================
// INPUT STYLES
// Based on Figma design
// ============================================

export const INPUT_STYLES = {
  // Base input
  base: "input-base",

  // Dropdown
  dropdown: "dropdown-base",

  // Filter button
  filterButton: "filter-btn",
  filterButtonActive: "filter-btn filter-btn-active",

  // Full Tailwind variants
  baseTw:
    "w-full h-11 px-4 py-2 bg-spoke-white border border-spoke-black font-degular text-lg font-medium leading-relaxed focus:outline-none focus:ring-2 focus:ring-spoke-black disabled:opacity-40 disabled:cursor-not-allowed",
  dropdownTw:
    "w-full h-10 px-4 py-2 bg-spoke-white border border-spoke-black font-degular text-base font-normal leading-tight tracking-tight",
} as const;

// ============================================
// CARD STYLES
// Based on Figma design
// ============================================

export const CARD_STYLES = {
  // Base card
  base: "card-base",

  // Vehicle card
  vehicleCard: "card-base",
  vehicleCardImage: "w-full h-60 object-cover overflow-hidden rounded-sm",
  vehicleCardImageMobile: "w-full h-[260px] object-cover overflow-hidden",
  vehicleCardTitle: "vehicle-card-title",
  vehicleCardLocation: "vehicle-card-location",

  // Project card
  projectCard: "card-base",
  projectCardImage: "w-full h-[509px] object-cover",
  projectCardTitle:
    "font-degular text-2xl font-medium leading-relaxed tracking-tight",

  // Testimonial card
  testimonialCard: "flex flex-col gap-4",
  testimonialQuote: "testimonial-quote",
  testimonialAuthor: "testimonial-author",
  testimonialSubtext: "body-small tracking-tight",

  // Info card (RTB - Reasons to Believe)
  infoCard: "flex flex-col gap-2",
  infoCardTitle: "info-card-title",
  infoCardDescription: "info-card-description",
} as const;

// ============================================
// ACCORDION STYLES
// Based on Figma design
// ============================================

export const ACCORDION_STYLES = {
  title: "accordion-title",
  detailLabel: "accordion-detail-label",
  detailValue: "accordion-detail-value",
  wrapper: "flex flex-col gap-3.5",
  detailRow: "flex gap-2.5 items-start",
} as const;

// ============================================
// PROGRESS BAR STYLES
// Based on Figma design
// ============================================

export const PROGRESS_STYLES = {
  step: "progress-step",
  stepActive: "progress-step progress-step-active",
  divider: "flex-1 h-px bg-spoke-black",
  dividerInactive: "flex-1 h-px bg-spoke-grey-light",
  container: "flex items-center gap-0",
} as const;

// ============================================
// SHADOW TOKENS
// ============================================

export const SHADOWS = {
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

export const SHADOW_CLASSES = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
} as const;

// ============================================
// SECTION STYLES
// Common section layouts from Figma
// ============================================

export const SECTION_STYLES = {
  // Full-width section with padding
  section: "w-full py-16 md:py-24",
  sectionCompact: "w-full py-8 md:py-16",

  // Section with grey background
  sectionGrey: "w-full py-16 md:py-24 bg-spoke-grey",

  // Section title layout
  titleLayout: "flex flex-col gap-6 md:gap-8",
  titleLayoutDesktop: "flex flex-col gap-6 w-full max-w-3xl",

  // Grid layouts
  gridTwo: "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",
  gridThree: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8",
  gridFour:
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8",
} as const;

// ============================================
// NAVBAR STYLES
// ============================================

export const NAVBAR_STYLES = {
  container:
    "w-full h-[72px] flex items-center justify-between px-4 md:px-16",
  logo: "h-6 md:h-8",
  navLinks: "hidden md:flex items-center gap-8",
  navLink: "link-text hover:opacity-70 transition-opacity",
  mobileMenuButton: "md:hidden",
} as const;

// ============================================
// FOOTER STYLES
// Based on Figma design (node-id: 505-11735)
// ============================================

// Footer-specific spacing constants matching Figma design
export const FOOTER_SPACING = {
  logoGap: "gap-[80px]", // Gap between logo and content
  columnGap: "gap-16", // 64px gap between columns (matches SPACING_CLASSES["3xl"])
  linkGap: "gap-[10px]", // Gap between link items
  contactGap: "gap-6", // 24px gap in contact section (matches SPACING_CLASSES.lg)
  padding: "pt-[60px] pb-[30px] px-[30px]", // Top 60px, bottom 30px, horizontal 30px
} as const;

// Footer-specific typography constants matching Figma design
export const FOOTER_TYPOGRAPHY = {
  // Footer heading: Degular Regular, 16px, tracking -0.16px, line-height 1.4
  heading: "footer-heading",
  // Footer body: Degular Light, 16px, line-height 1.4
  body: "footer-body",
  // Footer link: Degular Medium, 14px, line-height 1.5, underline
  link: "footer-link",
} as const;

export const FOOTER_STYLES = {
  // Updated to match Figma: white background, black text
  container: "w-full bg-white text-black",
  padding: FOOTER_SPACING.padding,
  logoGap: FOOTER_SPACING.logoGap,
  columnGap: FOOTER_SPACING.columnGap,
  linkGap: FOOTER_SPACING.linkGap,
  contactGap: FOOTER_SPACING.contactGap,
  // Typography
  heading: FOOTER_TYPOGRAPHY.heading,
  body: FOOTER_TYPOGRAPHY.body,
  link: FOOTER_TYPOGRAPHY.link,
  // Layout
  contentGrid: "flex gap-16 items-start",
  column: "flex flex-col",
  linkColumn: "flex flex-col gap-[10px]",
  contactColumn: "flex flex-col gap-6",
  // Bottom bar
  bottomBar: "flex items-start justify-between w-full",
  copyright: FOOTER_TYPOGRAPHY.heading,
  bottomLinks: `${FOOTER_TYPOGRAPHY.link} gap-6`,
} as const;

// ============================================
// PAGINATION STYLES
// ============================================

export const PAGINATION_STYLES = {
  container: "flex items-center gap-2",
  button:
    "h-[53px] px-5 flex items-center justify-center border border-spoke-black font-degular text-[22px] font-normal leading-normal tracking-tight",
  buttonActive: "bg-spoke-black text-spoke-white",
  pageNumber: "w-[50px]",
  ellipsis: "font-degular text-2xl leading-tight",
} as const;

// ============================================
// MOBILE SCROLL DOTS
// ============================================

export const SCROLL_DOTS_STYLES = {
  container: "flex items-center gap-1",
  dot: "rounded-full bg-spoke-black",
  dotSizes: {
    xs: "w-1 h-1", // 4px
    sm: "w-1.5 h-1.5", // 6px
    md: "w-2 h-2", // 8px
    lg: "w-2.5 h-2.5", // 10px
  },
} as const;

// ============================================
// AVATAR STYLES
// ============================================

export const AVATAR_STYLES = {
  container: "w-10 h-10 rounded-full overflow-hidden",
  image: "w-full h-full object-cover",
  initials:
    "w-full h-full flex items-center justify-center font-degular text-sm font-medium tracking-wide",
} as const;

// ============================================
// STATISTICS BAR STYLES
// ============================================

export const STATISTICS_STYLES = {
  container: "flex items-center justify-center gap-2.5 flex-wrap",
  item: "flex items-center gap-2 px-2.5 py-1.5 rounded-full",
  text: "statistics-text",
  divider: "w-px h-4 bg-spoke-black rotate-90",
} as const;
