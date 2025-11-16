/**
 * Admin Models Page
 * 
 * Manage vehicle models with list, edit, and merge functionality.
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
import { ModelListTable, ModelEditDialog, ModelMergeDialog } from "./_components";
import type { ModelWithDetails } from "~/server/types";
import { Pagination } from "~/app/_components/ui";

export default function ModelsPage() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingModel, setEditingModel] = useState<ModelWithDetails | null>(null);
  const [isMergeDialogOpen, setIsMergeDialogOpen] = useState(false);

  // Utils for cache invalidation
  const utils = api.useUtils();

  // URL state
  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const makeIdFilter = searchParams.get("makeId") ?? "";
  const isPublishedFilter = searchParams.get("isPublished");
  const sortBy = (searchParams.get("sortBy") ?? "name") as "name" | "makeName" | "createdAt" | "updatedAt" | "vehicleCount";
  const sortOrder = (searchParams.get("sortOrder") ?? "asc") as "asc" | "desc";

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Pagination
  const itemsPerPage = 30;
  const skip = (page - 1) * itemsPerPage;

  // Fetch makes for filter
  const { data: makesData, isLoading: isMakesLoading } = api.make.list.useQuery(
    {
      limit: 1000,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      enabled: !isAuthLoading && !!user,
      staleTime: 60000, // 1 minute
    }
  );

  const makes = useMemo(() => makesData?.makes ?? [], [makesData?.makes]);

  // Fetch models
  const { data, isLoading, isFetching } = api.model.list.useQuery(
    {
      limit: itemsPerPage,
      skip,
      search: debouncedSearch || undefined,
      makeId: makeIdFilter || undefined,
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

  const models = useMemo(() => data?.models ?? [], [data?.models]);
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
      router.push(`/admin/models?${params.toString()}`);
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
    if (selectedIds.size === models.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(models.map((m) => m.id)));
    }
  };

  const handleEdit = (model: ModelWithDetails) => {
    setEditingModel(model);
  };

  const handleDelete = async (model: ModelWithDetails) => {
    if (model._count.vehicles > 0) {
      toast.error(`Cannot delete ${model.name}: ${model._count.vehicles} vehicle(s) are using this model`);
      return;
    }

    if (!confirm(`Are you sure you want to delete "${model.name}"? This action cannot be undone.`)) {
      return;
    }

    deleteModelMutation.mutate({ id: model.id });
  };

  const handleMerge = () => {
    if (selectedIds.size < 2) {
      return;
    }
    setIsMergeDialogOpen(true);
  };

  const handleSuccess = () => {
    setSelectedIds(new Set());
    setEditingModel(null);
  };

  // Delete mutation
  const deleteModelMutation = api.model.delete.useMutation({
    onSuccess: () => {
      toast.success("Model deleted successfully");
      void utils.model.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to delete model: ${error.message}`);
    },
  });

  const selectedModels = useMemo(
    () => models.filter((m) => selectedIds.has(m.id)),
    [models, selectedIds]
  );

  // Check if selected models are from different makes
  const differentMakes = useMemo(() => {
    if (selectedModels.length === 0) return false;
    const firstMakeId = selectedModels[0]?.makeId;
    return selectedModels.some((model) => model.makeId !== firstMakeId);
  }, [selectedModels]);

  if (isAuthLoading || !user) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models"
        description="Manage vehicle models and consolidate duplicates"
        action={
          <Button onClick={() => setEditingModel({} as ModelWithDetails)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Model
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={makeIdFilter ?? "all"}
            onValueChange={(value) =>
              handleFilterChange("makeId", value === "all" ? "" : value)
            }
            disabled={isMakesLoading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={isMakesLoading ? "Loading makes..." : "All Makes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Makes</SelectItem>
              {isMakesLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : makes.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No makes found
                </SelectItem>
              ) : (
                makes.map((make) => (
                  <SelectItem key={make.id} value={make.id}>
                    {make.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

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
                <Button
                  onClick={handleMerge}
                  size="sm"
                  variant={differentMakes ? "destructive" : "default"}
                  disabled={differentMakes}
                >
                  <GitMerge className="mr-2 h-4 w-4" />
                  {differentMakes ? "Different Makes" : "Merge Models"}
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
              Showing {models.length} of {totalCount} model(s)
            </>
          )}
        </p>
      </div>

      {/* Table */}
      <ModelListTable
        models={models}
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
      <ModelEditDialog
        model={editingModel}
        open={!!editingModel}
        onOpenChange={(open) => !open && setEditingModel(null)}
        onSuccess={handleSuccess}
      />

      {/* Merge Dialog */}
      <ModelMergeDialog
        models={selectedModels}
        open={isMergeDialogOpen}
        onOpenChange={setIsMergeDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

