/**
 * Admin Makes Page
 * 
 * Manage vehicle makes with list, edit, and merge functionality.
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GitMerge, Search, Plus } from "lucide-react";
import { useRequireAdmin } from "~/providers/auth-provider";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PageHeader } from "~/app/_components/ui";
import { PageLoading } from "~/components/loading";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import { MakeListTable, MakeEditDialog, MakeMergeDialog } from "./_components";
import type { MakeWithCount } from "~/server/types";
import { Pagination } from "~/app/_components/ui";

export default function MakesPage() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingMake, setEditingMake] = useState<MakeWithCount | null>(null);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);

  // Utils for cache invalidation
  const utils = api.useUtils();

  // URL state
  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const isPublishedFilter = searchParams.get("isPublished");
  const sortBy = (searchParams.get("sortBy") ?? "name") as "name" | "createdAt" | "updatedAt" | "vehicleCount";
  const sortOrder = (searchParams.get("sortOrder") ?? "asc") as "asc" | "desc";

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Pagination
  const itemsPerPage = 30;
  const skip = (page - 1) * itemsPerPage;

  // Fetch makes
  const { data, isLoading, isFetching } = api.make.list.useQuery(
    {
      limit: itemsPerPage,
      skip,
      search: debouncedSearch || undefined,
      isPublished: isPublishedFilter === "true" ? true : isPublishedFilter === "false" ? false : undefined,
      sortBy,
      sortOrder,
      includeTotalCount: true,
    },
    {
      enabled: !isAuthLoading && !!user,
      staleTime: 30000,
    }
  );

  const makes = useMemo(() => data?.makes ?? [], [data?.makes]);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Update URL
  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`/admin/makes?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Handlers
  const handleSearch = (value: string) => {
    updateUrl({ search: value, page: "1" });
  };

  const handleFilterChange = (key: string, value: string) => {
    updateUrl({ [key]: value, page: "1" });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === makes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(makes.map((m) => m.id)));
    }
  };

  const handleEdit = (make: MakeWithCount) => {
    setEditingMake(make);
  };

  const handleDelete = async (make: MakeWithCount) => {
    if (make._count.vehicles > 0) {
      toast.error(`Cannot delete ${make.name}: ${make._count.vehicles} vehicle(s) are using this make`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${make.name}"? This action cannot be undone.`)) {
      return;
    }

    deleteMakeMutation.mutate({ id: make.id });
  };

  const handleMerge = () => {
    if (selectedIds.size < 2) {
      return;
    }
    setIsMergeDialogOpen(true);
  };

  const handleSuccess = () => {
    setSelectedIds(new Set());
    setEditingMake(null);
  };

  // Delete mutation
  const deleteMakeMutation = api.make.delete.useMutation({
    onSuccess: () => {
      toast.success("Make deleted successfully");
      void utils.make.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete make: ${error.message}`);
    },
  });

  const selectedMakes = useMemo(
    () => makes.filter((m) => selectedIds.has(m.id)),
    [makes, selectedIds]
  );

  if (isAuthLoading || !user) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Makes"
        description="Manage vehicle makes and consolidate duplicates"
        action={
          <Button onClick={() => setEditingMake({} as MakeWithCount)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Make
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search makes..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={isPublishedFilter ?? "all"}
            onValueChange={(value) =>
              handleFilterChange("isPublished", value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Published" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Published</SelectItem>
              <SelectItem value="false">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <>
              <Badge variant="secondary">
                {selectedIds.size} selected
              </Badge>
              {selectedIds.size >= 2 && (
                <Button onClick={handleMerge} size="sm" variant="default">
                  <GitMerge className="mr-2 h-4 w-4" />
                  Merge Makes
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isFetching ? (
            "Loading..."
          ) : (
            <>
              Showing {makes.length} of {totalCount} make(s)
            </>
          )}
        </p>
      </div>

      {/* Table */}
      <MakeListTable
        makes={makes}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(newPage) => updateUrl({ page: String(newPage) })}
          isLoading={isFetching}
        />
      )}

      {/* Edit Dialog */}
      <MakeEditDialog
        make={editingMake}
        open={!!editingMake}
        onOpenChange={(open) => !open && setEditingMake(null)}
        onSuccess={handleSuccess}
      />

      {/* Merge Dialog */}
      <MakeMergeDialog
        makes={selectedMakes}
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

