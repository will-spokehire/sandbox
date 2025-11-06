import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";

interface StandardContentContainerProps {
  children: ReactNode;
  spacing?: "compact" | "default" | "spacious";
  maxWidth?: "default" | "narrow" | "wide" | "full";
}

/**
 * Standard Content Container
 * 
 * Container for main content with consistent spacing and max-widths.
 * 
 * Spacing options:
 * - compact: py-6 md:py-8
 * - default: py-8 md:py-12
 * - spacious: py-12 md:py-16
 * 
 * Max-width options:
 * - default: container (responsive with max-width)
 * - narrow: max-w-3xl (forms, content pages)
 * - wide: max-w-7xl (large grids)
 * - full: no max-width constraint
 * 
 * Usage:
 * ```tsx
 * <StandardContentContainer spacing="default" maxWidth="narrow">
 *   <YourContent />
 * </StandardContentContainer>
 * ```
 */
export function StandardContentContainer({
  children,
  spacing = "default",
  maxWidth = "default",
}: StandardContentContainerProps) {
  const spacingClass = {
    compact: LAYOUT_CONSTANTS.pageSpacingCompact,
    default: LAYOUT_CONSTANTS.pageSpacing,
    spacious: "py-12 md:py-16",
  }[spacing];

  const containerClass = {
    default: LAYOUT_CONSTANTS.container,
    narrow: LAYOUT_CONSTANTS.containerNarrow,
    wide: LAYOUT_CONSTANTS.containerWide,
    full: "px-4",
  }[maxWidth];

  return (
    <div className={cn(containerClass, spacingClass)}>
      {children}
    </div>
  );
}

