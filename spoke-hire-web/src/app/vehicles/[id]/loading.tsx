import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

/**
 * Loading skeleton for vehicle detail page
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Back Navigation Skeleton */}
      <div className="border-b bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-4">
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Title Skeleton */}
        <header className="mb-8">
          <Skeleton className="h-10 w-96 mb-2" />
          <Skeleton className="h-6 w-48" />
        </header>

        {/* Two-Column Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Media Gallery Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <Card className="overflow-hidden">
              <Skeleton className="aspect-[3/2] w-full" />
            </Card>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          </div>

          {/* Right Column - Details Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

