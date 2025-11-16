import { Button } from "~/components/ui/button";

interface PaginationProps {
  currentPage: number;  // 1-indexed (page 1, 2, 3...)
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
      >
        Previous
      </Button>

      {/* Page Numbers - Desktop only */}
      <div className="hidden md:flex items-center gap-1">
        {/* First page */}
        {currentPage > 3 && (
          <>
            <Button
              variant={1 === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={isLoading}
              className="w-10"
            >
              1
            </Button>
            {currentPage > 4 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
          </>
        )}

        {/* Pages around current */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page >= currentPage - 2 && page <= currentPage + 2)
          .map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              className="w-10"
            >
              {page}
            </Button>
          ))}

        {/* Last page */}
        {currentPage < totalPages - 2 && (
          <>
            {currentPage < totalPages - 3 && (
              <span className="px-2 text-muted-foreground">...</span>
            )}
            <Button
              variant={totalPages === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={isLoading}
              className="w-10"
            >
              {totalPages}
            </Button>
          </>
        )}
      </div>

      {/* Page Indicator - Mobile only */}
      <div className="md:hidden px-3 py-1.5 text-sm font-medium text-muted-foreground">
        {currentPage} / {totalPages}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
      >
        Next
      </Button>
    </div>
  );
}
