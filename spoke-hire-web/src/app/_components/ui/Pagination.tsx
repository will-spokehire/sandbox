"use client"

import { cn } from "~/lib/utils"

interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Disable interactions during loading */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Pagination component with brand styling
 *
 * Features:
 * - Previous/Next buttons with text labels
 * - Page numbers with ellipsis for long lists
 * - Border styling matching Figma design (1px black, 53px height)
 * - Mobile-friendly with page indicator
 * - Keyboard accessible
 *
 * @example
 * <Pagination
 *   currentPage={2}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 * />
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null

  // Generate page numbers to display
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | "ellipsis")[] = []
    const halfVisible = Math.floor(maxVisiblePages / 2)

    // Always show first page
    pages.push(1)

    // Calculate start and end of visible range
    let start = Math.max(2, currentPage - halfVisible)
    let end = Math.min(totalPages - 1, currentPage + halfVisible)

    // Adjust if we're near the start
    if (currentPage <= halfVisible + 1) {
      end = Math.min(totalPages - 1, maxVisiblePages - 1)
    }

    // Adjust if we're near the end
    if (currentPage >= totalPages - halfVisible) {
      start = Math.max(2, totalPages - maxVisiblePages + 2)
    }

    // Add ellipsis before if needed
    if (start > 2) {
      pages.push("ellipsis")
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Add ellipsis after if needed
    if (end < totalPages - 1) {
      pages.push("ellipsis")
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  const buttonBaseClass = cn(
    "flex h-[53px] items-center justify-center border border-spoke-black",
    "font-degular text-[22px] leading-[1.3] tracking-[-0.01em]",
    "transition-colors duration-150",
    "disabled:opacity-40 disabled:cursor-not-allowed"
  )

  const pageButtonClass = cn(
    buttonBaseClass,
    "w-[50px] px-5",
    "hover:bg-spoke-black hover:text-spoke-white"
  )

  const activePageClass = cn(pageButtonClass, "bg-spoke-black text-spoke-white")

  const navButtonClass = cn(buttonBaseClass, "px-5")

  return (
    <nav
      className={cn("flex items-center justify-center gap-[9px] pt-6", className)}
      aria-label="Pagination"
    >
      {/* Previous Button */}
      <button
        type="button"
        className={cn(navButtonClass, "hidden sm:flex")}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        aria-label="Go to previous page"
      >
        Previous
      </button>

      {/* Previous Arrow - Mobile */}
      <button
        type="button"
        className={cn(navButtonClass, "sm:hidden w-[50px]")}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1 || isLoading}
        aria-label="Go to previous page"
      >
        <svg
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Page Numbers - Desktop */}
      <div className="hidden md:flex items-center gap-[9px]">
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="font-degular text-[24px] leading-[1.2] text-spoke-black px-1"
                aria-hidden="true"
              >
                ...
              </span>
            )
          }

          const isActive = page === currentPage

          return (
            <button
              key={page}
              type="button"
              className={isActive ? activePageClass : pageButtonClass}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          )
        })}
      </div>

      {/* Page Indicator - Mobile */}
      <div className="md:hidden px-3 py-1.5 font-degular text-lg text-spoke-black">
        {currentPage} / {totalPages}
      </div>

      {/* Next Button */}
      <button
        type="button"
        className={cn(navButtonClass, "hidden sm:flex")}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        aria-label="Go to next page"
      >
        Next
      </button>

      {/* Next Arrow - Mobile */}
      <button
        type="button"
        className={cn(navButtonClass, "sm:hidden w-[50px]")}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages || isLoading}
        aria-label="Go to next page"
      >
        <svg
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </nav>
  )
}
