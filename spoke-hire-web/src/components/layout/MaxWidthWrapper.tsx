import { LAYOUT_CONSTANTS } from "~/lib/design-tokens"

interface MaxWidthWrapperProps {
  children: React.ReactNode
}

/**
 * MaxWidthWrapper
 * 
 * Applies max-width constraint (1512px) to public-facing pages.
 * This is a server component - no client-side hooks.
 * 
 * Note: Admin pages use their own layout without this wrapper.
 */
export function MaxWidthWrapper({ children }: MaxWidthWrapperProps) {
  return (
    <div className={LAYOUT_CONSTANTS.maxWidthContainer}>
      {children}
    </div>
  )
}

