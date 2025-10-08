"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { UserMenu } from "~/components/auth/UserMenu";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

/**
 * Deal Detail Page
 * 
 * Shows full details of a deal including vehicles and recipients
 */
export default function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  const resolvedParams = use(params);
  const utils = api.useUtils();

  // Fetch deal details
  const {
    data: deal,
    isLoading: isDealLoading,
    error,
  } = api.deal.getById.useQuery(
    {
      id: resolvedParams.id,
    },
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Archive mutation
  const archiveMutation = api.deal.archive.useMutation({
    onSuccess: () => {
      toast.success("Deal archived successfully");
      utils.deal.getById.invalidate({ id: resolvedParams.id });
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
      utils.deal.getById.invalidate({ id: resolvedParams.id });
      utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unarchive deal");
    },
  });

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      ARCHIVED: { variant: "secondary", label: "Archived" },
    };

    const config = variants[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const formatPrice = (price: any): string => {
    if (!price) return "POA";
    
    const numPrice = typeof price === "string" ? parseFloat(price) : Number(price);
    
    if (isNaN(numPrice)) return "POA";
    
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/admin/deals")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                    {isDealLoading ? <Skeleton className="h-8 w-64" /> : deal?.name}
                  </h1>
                  <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                    {isDealLoading ? (
                      <Skeleton className="h-4 w-32 mt-1" />
                    ) : (
                      <span>Deal Details</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {deal && (
                <>
                  {deal.status === "ACTIVE" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: deal.id })}
                      disabled={archiveMutation.isPending}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      <span className="hidden sm:inline">Archive</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unarchiveMutation.mutate({ id: deal.id })}
                      disabled={unarchiveMutation.isPending}
                      className="gap-2"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      <span className="hidden sm:inline">Unarchive</span>
                    </Button>
                  )}
                </>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isDealLoading ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
            </Card>
          </div>
        ) : !deal ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Deal not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Deal Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{deal.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {deal.description || "No description provided"}
                    </CardDescription>
                  </div>
                  {getStatusBadge(deal.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">
                      {format(new Date(deal.createdAt), "PPP 'at' p")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created By</p>
                    <p className="font-medium">
                      {deal.createdBy.firstName || deal.createdBy.lastName
                        ? `${deal.createdBy.firstName} ${deal.createdBy.lastName}`.trim()
                        : deal.createdBy.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(deal.updatedAt), "PPP 'at' p")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicles Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  <CardTitle>Vehicles ({deal._count.vehicles})</CardTitle>
                </div>
                <CardDescription>
                  Vehicles included in this deal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deal.vehicles.map((dv) => (
                    <div
                      key={dv.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                    >
                      {/* Vehicle Image */}
                      {dv.vehicle.media[0]?.publishedUrl && (
                        <div className="relative aspect-[4/3] w-24 rounded-md overflow-hidden border flex-shrink-0">
                          <img
                            src={dv.vehicle.media[0].publishedUrl}
                            alt={dv.vehicle.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}

                      {/* Vehicle Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dv.vehicle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {dv.vehicle.make.name} {dv.vehicle.model.name} • {dv.vehicle.year}
                        </p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          {formatPrice(dv.vehicle.price)}
                        </p>
                      </div>

                      {/* Registration */}
                      {dv.vehicle.registration && (
                        <Badge variant="secondary" className="font-mono">
                          {dv.vehicle.registration}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

