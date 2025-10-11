import { Skeleton } from "~/components/ui/skeleton";

interface PageLoadingProps {
  className?: string;
}

/**
 * Page Loading Component
 * 
 * Provides a consistent loading state for full pages.
 * Shows a large skeleton that matches typical page content.
 * 
 * @example
 * ```tsx
 * <Suspense fallback={<PageLoading />}>
 *   <PageContent />
 * </Suspense>
 * ```
 */
export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Content Area Skeleton */}
      <Skeleton className="h-[600px] w-full" />
    </div>
  );
}
