import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

interface CardLoadingProps {
  count?: number;
  className?: string;
}

/**
 * Card Loading Component
 * 
 * Provides a consistent loading state for card-based layouts.
 * Shows skeleton cards that match typical card content.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <CardLoading count={6} />
 * ) : (
 *   <div className="grid grid-cols-3 gap-4">
 *     {data.map(item => <Card key={item.id} {...item} />)}
 *   </div>
 * )}
 * ```
 */
export function CardLoading({ count = 6, className }: CardLoadingProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
