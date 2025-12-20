"use client"

import { usePathname } from "next/navigation"
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens"
import { cn } from "~/lib/utils"

interface MaxWidthWrapperProps {
  children: React.ReactNode
}

/**
 * MaxWidthWrapper
 * 
 * Conditionally applies max-width constraint (1512px) to public-facing pages only.
 * Admin pages (/admin/*) are excluded to allow full-width layouts.
 */
export function MaxWidthWrapper({ children }: MaxWidthWrapperProps) {
  const pathname = usePathname()
  const isAdminRoute = pathname?.startsWith("/admin")
  
  return (
    <div className={cn(!isAdminRoute && LAYOUT_CONSTANTS.maxWidthContainer)}>
      {children}
    </div>
  )
}

