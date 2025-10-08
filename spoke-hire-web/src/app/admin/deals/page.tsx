"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Mail, Archive, ArchiveRestore, Car, User, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeader } from "~/app/_components/ui";
import { api } from "~/trpc/react";
import { CreateDealDialog } from "./_components/CreateDealDialog";

/**
 * Deals List Content Component
 * Separated to allow Suspense wrapping
 */
function DealsListContent() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();

  // Dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Get archived status from URL (default to false - show active)
  const showArchived = searchParams.get("archived") === "true";

  // Fetch deals with pagination
  const {
    data,
    isLoading: isDealsLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.deal.list.useInfiniteQuery(
    {
      limit: 20,
      status: showArchived ? "ARCHIVED" : "ACTIVE",
    },
    {
      enabled: !isAuthLoading && !!user,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const deals = data?.pages.flatMap((page) => page.deals) ?? [];

  // Archive mutation
  const archiveMutation = api.deal.archive.useMutation({
    onSuccess: () => {
      toast.success("Deal archived successfully");
      utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive deal");
    },
  });

  // Unarchive mutation
  const unarchiveMutation = api.deal.unarchive.useMutation({
    onSuccess: () => {
      toast.success("Deal unarchived successfully");
      utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unarchive deal");
    },
  });

  const handleView = (dealId: string) => {
    router.push(`/admin/deals/${dealId}`);
  };

  const handleArchive = (dealId: string) => {
    archiveMutation.mutate({ id: dealId });
  };

  const handleUnarchive = (dealId: string) => {
    unarchiveMutation.mutate({ id: dealId });
  };

  const toggleArchived = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (showArchived) {
      params.delete("archived");
    } else {
      params.set("archived", "true");
    }
    router.push(`/admin/deals?${params.toString()}`);
  };

  if (isAuthLoading || !user) {
    return null; // Layout handles loading state
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      ARCHIVED: { variant: "secondary", label: "Archived" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return (
      <Badge variant={config.variant as any}>{config.label}</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="Manage job offers sent to users"
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant={showArchived ? "outline" : "default"}
          onClick={toggleArchived}
          className="gap-2"
        >
          {showArchived ? (
            <>
              <ArchiveRestore className="h-4 w-4" />
              Show Active
            </>
          ) : (
            <>
              <Archive className="h-4 w-4" />
              Show Archived
            </>
          )}
        </Button>

        {/* Create Deal Button - Only show when viewing active deals */}
        {!showArchived && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Deal
          </Button>
        )}
      </div>

      {/* Create Deal Dialog */}
      <CreateDealDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Results Count */}
      {!isDealsLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {deals.length === 0 ? (
              showArchived ? "No archived deals" : "No active deals found"
            ) : (
              <>
                Found <span className="font-semibold text-slate-900 dark:text-slate-50">{deals.length}</span> {showArchived ? "archived" : "active"} deal{deals.length !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
      )}

      {/* Deals List */}
      {isDealsLoading ? (
        <>
          {/* Mobile: Card Skeletons */}
          <div className="md:hidden space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <div className="flex gap-2 mb-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <Skeleton className="h-4 w-32" />
                    </CardContent>
                  </Card>
                ))}
          </div>
          
          {/* Desktop: Table Skeleton */}
          <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vehicles</TableHead>
                      <TableHead>Recipients</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Created By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
          </div>
        </>
      ) : deals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border">
          <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No deals yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first deal by selecting vehicles and clicking "Send Deal"
          </p>
          <Button onClick={() => router.push("/admin/vehicles")}>
            Go to Vehicles
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: Card View */}
          <div className="md:hidden space-y-4">
                {deals.map((deal) => {
                  const creatorName =
                    deal.createdBy.firstName || deal.createdBy.lastName
                      ? `${deal.createdBy.firstName} ${deal.createdBy.lastName}`.trim()
                      : deal.createdBy.email;

                  return (
                    <Card key={deal.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <button
                          onClick={() => handleView(deal.id)}
                          className="w-full text-left p-4 hover:bg-muted/50 transition-colors"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base mb-1 truncate">
                                {deal.name}
                              </h3>
                              {(deal.date || deal.location) && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {deal.date && deal.location ? `${deal.date} • ${deal.location}` : deal.date || deal.location}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(deal.status)}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-4 mb-3 text-sm">
                            <div className="flex items-center gap-1.5">
                              <Car className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{deal._count.vehicles}</span>
                              <span className="text-muted-foreground">vehicle{deal._count.vehicles !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{deal._count.recipients}</span>
                              <span className="text-muted-foreground">owner{deal._count.recipients !== 1 ? "s" : ""}</span>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>By {creatorName}</span>
                            <span>{format(new Date(deal.createdAt), "MMM d, yyyy")}</span>
                          </div>
                        </button>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          {/* Desktop: Table View */}
          <div className="hidden md:block rounded-md border bg-white dark:bg-slate-800">
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vehicles</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => {
                    const creatorName =
                      deal.createdBy.firstName || deal.createdBy.lastName
                        ? `${deal.createdBy.firstName} ${deal.createdBy.lastName}`.trim()
                        : deal.createdBy.email;

                    return (
                      <TableRow key={deal.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleView(deal.id)}>
                        <TableCell>
                          <div className="font-medium text-foreground">
                            {deal.name}
                          </div>
                          {(deal.date || deal.location) && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {deal.date && deal.location ? `${deal.date} • ${deal.location}` : deal.date || deal.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(deal.status)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {deal._count.vehicles}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {deal._count.recipients}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(deal.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {creatorName}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
            </Table>
          </div>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
                size="lg"
              >
                {isFetchingNextPage ? "Loading..." : "Load More Deals"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Deals List Page
 * 
 * Shows all deals created in the system
 */
export default function DealsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    }>
      <DealsListContent />
    </Suspense>
  );
}

