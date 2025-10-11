import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

interface FormLoadingProps {
  fields?: number;
  className?: string;
}

/**
 * Form Loading Component
 * 
 * Provides a consistent loading state for forms.
 * Shows skeleton form fields that match typical form structure.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <FormLoading fields={5} />
 * ) : (
 *   <Form>
 *     <FormField />
 *     <FormField />
 *   </Form>
 * )}
 * ```
 */
export function FormLoading({ fields = 5, className }: FormLoadingProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        
        {/* Form Actions */}
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
