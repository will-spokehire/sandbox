"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Car, Archive, ArchiveRestore, MessageCircle, MoreHorizontal, Eye, User, Mail, Phone, Pencil } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { UserMenu } from "~/components/auth/UserMenu";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";
import { 
  getWhatsAppMessageUrl, 
  generateDealMessage,
  getWhatsAppChatUrl
} from "~/lib/whatsapp";
import { formatOwnerName } from "~/lib/vehicles";
import { useClipboard } from "~/hooks/useClipboard";
import { CreateEditDealDialog } from "~/components/deals";

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
  const { copyToClipboard } = useClipboard();
  const [showEditDialog, setShowEditDialog] = useState(false);

  // Fetch deal details
  const {
    data: deal,
    isLoading: isDealLoading,
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
      void utils.deal.getById.invalidate({ id: resolvedParams.id });
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to archive deal");
    },
  });

  // Unarchive mutation
  const unarchiveMutation = api.deal.unarchive.useMutation({
    onSuccess: () => {
      toast.success("Deal unarchived successfully");
      void utils.deal.getById.invalidate({ id: resolvedParams.id });
      void utils.deal.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to unarchive deal");
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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      ARCHIVED: { variant: "secondary", label: "Archived" },
    };

    const config = variants[status] ?? { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatPrice = (price: unknown): string => {
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle>{deal.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(deal.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {deal.status === "ACTIVE" && (
                          <DropdownMenuItem
                            onClick={() => setShowEditDialog(true)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Deal
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {deal.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            onClick={() => archiveMutation.mutate({ id: deal.id })}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => unarchiveMutation.mutate({ id: deal.id })}
                            disabled={unarchiveMutation.isPending}
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Unarchive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Production Details */}
                {(deal.date ?? deal.time ?? deal.location ?? deal.brief ?? deal.fee) && (
                  <div className="rounded-lg border p-4 space-y-3">
                    <h3 className="font-semibold text-sm">Production Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {deal.date && (
                        <div>
                          <p className="text-muted-foreground">📅 Date(s)</p>
                          <p className="font-medium">{deal.date}</p>
                        </div>
                      )}
                      {deal.time && (
                        <div>
                          <p className="text-muted-foreground">🕐 Time(s)</p>
                          <p className="font-medium">{deal.time}</p>
                        </div>
                      )}
                      {deal.location && (
                        <div>
                          <p className="text-muted-foreground">📍 Location(s)</p>
                          <p className="font-medium">{deal.location}</p>
                        </div>
                      )}
                      {deal.fee && (
                        <div>
                          <p className="text-muted-foreground">💰 Fee Guide</p>
                          <p className="font-medium">{deal.fee}</p>
                        </div>
                      )}
                      {deal.brief && (
                        <div className="md:col-span-2">
                          <p className="text-muted-foreground">🎬 Brief</p>
                          <p className="font-medium whitespace-pre-wrap">{deal.brief}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                      {deal.createdBy.firstName ?? deal.createdBy.lastName
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
                  {deal.vehicles.map((dv) => {
                    const ownerName = formatOwnerName(
                      dv.vehicle.owner.firstName,
                      dv.vehicle.owner.lastName,
                      dv.vehicle.owner.email
                    );

                    return (
                      <div
                        key={dv.id}
                        className="group relative border rounded-lg hover:shadow-md transition-shadow overflow-hidden bg-card"
                      >
                        {/* Mobile Layout: Vertical Card */}
                        <div className="md:hidden">
                          {/* Image */}
                          {dv.vehicle.media[0]?.publishedUrl && (
                            <div className="relative aspect-[3/2] w-full bg-muted">
                              <Image
                                src={dv.vehicle.media[0].publishedUrl}
                                alt={dv.vehicle.name}
                                fill
                                className="object-cover cursor-pointer"
                                onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                              />
                              
                              {/* Actions Overlay - Mobile */}
                              <div className="absolute top-3 right-3 z-10">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="secondary"
                                      size="icon"
                                      className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Contact Owner</DropdownMenuLabel>
                                    
                                    {/* Copy Email */}
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void copyToClipboard(dv.vehicle.owner.email, 'Email');
                                      }}
                                    >
                                      <Mail className="mr-2 h-4 w-4" />
                                      Copy Email
                                    </DropdownMenuItem>
                                    
                                    {/* Copy Phone */}
                                    {dv.vehicle.owner?.phone && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void copyToClipboard(dv.vehicle.owner.phone!, 'Phone number');
                                        }}
                                      >
                                        <Phone className="mr-2 h-4 w-4" />
                                        Copy Phone
                                      </DropdownMenuItem>
                                    )}
                                    
                                    {/* WhatsApp Actions */}
                                    {dv.vehicle.owner?.phone && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(getWhatsAppChatUrl(dv.vehicle.owner.phone!), '_blank');
                                          }}
                                        >
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          WhatsApp Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const message = generateDealMessage({
                                              vehicleName: dv.vehicle.name,
                                              ownerName,
                                              date: deal.date,
                                              time: deal.time,
                                              location: deal.location,
                                              brief: deal.brief,
                                              fee: deal.fee,
                                            });
                                            window.open(getWhatsAppMessageUrl(dv.vehicle.owner.phone!, message), '_blank');
                                          }}
                                        >
                                          <MessageCircle className="mr-2 h-4 w-4" />
                                          Send Deal via WhatsApp
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              {/* Registration Badge - Mobile */}
                              {dv.vehicle.registration && (
                                <div className="absolute bottom-3 left-3 z-10">
                                  <Badge variant="secondary" className="font-mono shadow-lg backdrop-blur-sm">
                                    {dv.vehicle.registration}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Content - Mobile */}
                          <div className="p-4 space-y-3">
                            {/* Title & Price */}
                            <div 
                              className="cursor-pointer"
                              onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-lg leading-tight flex-1">
                                  {dv.vehicle.name}
                                </h3>
                                <span className="font-bold text-lg text-primary whitespace-nowrap">
                                  {formatPrice(dv.vehicle.price)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {dv.vehicle.make.name} {dv.vehicle.model.name} • {dv.vehicle.year}
                              </p>
                            </div>

                            {/* Owner Info */}
                            <div className="flex items-center gap-2 text-sm pt-2 border-t">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Owner:</span>
                              <span className="font-medium">{ownerName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout: Horizontal */}
                        <div className="hidden md:flex items-center gap-4 p-4">
                          {/* Image */}
                          {dv.vehicle.media[0]?.publishedUrl && (
                            <div 
                              className="relative aspect-[4/3] w-32 rounded-md overflow-hidden border flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                            >
                              <Image
                                src={dv.vehicle.media[0].publishedUrl}
                                alt={dv.vehicle.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}

                          {/* Vehicle Info */}
                          <div 
                            className="flex-1 min-w-0 cursor-pointer space-y-2"
                            onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                          >
                            <div>
                              <h3 className="font-semibold text-lg leading-tight mb-1">
                                {dv.vehicle.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {dv.vehicle.make.name} {dv.vehicle.model.name} • {dv.vehicle.year}
                              </p>
                            </div>
                            
                            {/* Owner Info - Desktop */}
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Owner:</span>
                              <span className="font-medium">{ownerName}</span>
                            </div>
                          </div>

                          {/* Price */}
                          <div className="flex-shrink-0">
                            <p className="text-xl font-bold text-primary">
                              {formatPrice(dv.vehicle.price)}
                            </p>
                          </div>

                          {/* Registration */}
                          {dv.vehicle.registration && (
                            <Badge variant="secondary" className="font-mono flex-shrink-0">
                              {dv.vehicle.registration}
                            </Badge>
                          )}

                          {/* Actions Dropdown - Desktop */}
                          <div className="flex-shrink-0">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Contact Owner</DropdownMenuLabel>
                                
                                {/* Copy Email */}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void copyToClipboard(dv.vehicle.owner.email, 'Email');
                                  }}
                                >
                                  <Mail className="mr-2 h-4 w-4" />
                                  Copy Email
                                </DropdownMenuItem>
                                
                                {/* Copy Phone */}
                                {dv.vehicle.owner?.phone && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void copyToClipboard(dv.vehicle.owner.phone!, 'Phone number');
                                    }}
                                  >
                                    <Phone className="mr-2 h-4 w-4" />
                                    Copy Phone
                                  </DropdownMenuItem>
                                )}
                                
                                {/* WhatsApp Actions */}
                                {dv.vehicle.owner?.phone && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(getWhatsAppChatUrl(dv.vehicle.owner.phone!), '_blank');
                                      }}
                                    >
                                      <MessageCircle className="mr-2 h-4 w-4" />
                                      WhatsApp Chat
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const message = generateDealMessage({
                                          vehicleName: dv.vehicle.name,
                                          ownerName,
                                          date: deal.date,
                                          time: deal.time,
                                          location: deal.location,
                                          brief: deal.brief,
                                          fee: deal.fee,
                                        });
                                        window.open(getWhatsAppMessageUrl(dv.vehicle.owner.phone!, message), '_blank');
                                      }}
                                    >
                                      <MessageCircle className="mr-2 h-4 w-4" />
                                      Send Deal via WhatsApp
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Edit Deal Dialog */}
      {deal && (
        <CreateEditDealDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          dealId={deal.id}
        />
      )}
    </div>
  );
}

