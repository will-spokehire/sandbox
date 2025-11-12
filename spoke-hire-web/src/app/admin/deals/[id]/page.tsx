"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Car, Archive, ArchiveRestore, MessageCircle, MoreHorizontal, Eye, User, Mail, Phone, Pencil, Building2, DollarSign, StickyNote, CheckCircle2, Clock, XCircle, Send, Check, X, Trophy } from "lucide-react";
import { format } from "date-fns";
import { useRequireAdmin } from "~/providers/auth-provider";
import { UserMenu } from "~/components/auth/UserMenu";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
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
import { CreateEditDealDialog, UpdateOwnerFeeDialog } from "~/components/deals";
import { useDealMutations } from "~/hooks/useDealMutations";
import { getDealStatusConfig, getDealTypeLabel } from "~/lib/deals";
import { Badge } from "~/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { DealVehicleStatus } from "@prisma/client";
import { cn } from "~/lib/utils";

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
  const { copyToClipboard } = useClipboard();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showFeeDialog, setShowFeeDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{
    id: string;
    name: string;
    currentFee: number | null;
  } | null>(null);
  const utils = api.useUtils();

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

  // Use custom mutation hooks for centralized error handling
  const { archive, unarchive, updateVehicleStatus, updateVehicleFee } = useDealMutations();

  // Send email mutation
  const sendEmailMutation = api.deal.send.useMutation({
    onSuccess: async (result) => {
      toast.success(`Emails sent to ${result.sent} recipient${result.sent !== 1 ? 's' : ''}${result.failed > 0 ? ` (${result.failed} failed)` : ''}`);
      // Refetch deal to update recipient statuses
      await utils.deal.getById.invalidate({ id: resolvedParams.id });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send emails");
    },
  });

  // Get recipients who need emails sent (pending or failed, with active vehicles only)
  const getRecipientsToSend = () => {
    if (!deal?.recipients || !deal?.vehicles) return [];
    
    // Get IDs of vehicle owners with ACTIVE vehicles
    const activeVehicleOwnerIds = new Set(
      deal.vehicles
        .filter(dv => dv.status === "ACTIVE")
        .map(dv => dv.vehicle.owner.id)
    );
    
    // Filter recipients: (PENDING or FAILED) AND owner has ACTIVE vehicle
    return deal.recipients.filter(r => 
      (r.status === "PENDING" || r.status === "FAILED") &&
      activeVehicleOwnerIds.has(r.userId)
    );
  };

  // Handler to send emails to recipients with pending or failed status and active vehicles
  const handleSendPendingEmails = () => {
    const recipientsToSend = getRecipientsToSend();
    
    if (recipientsToSend.length === 0) {
      toast.info("No active vehicle owners to send emails to");
      return;
    }

    sendEmailMutation.mutate({
      dealId: deal!.id,
      recipientIds: recipientsToSend.map(r => r.userId),
    });
  };

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
    const config = getDealStatusConfig(status as "ACTIVE" | "ARCHIVED");
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

  // Helper function to get email status for a vehicle owner
  const getOwnerEmailStatus = (ownerId: string) => {
    if (!deal?.recipients) return null;
    return deal.recipients.find(r => r.userId === ownerId);
  };

  // Helper function to render email status badge
  const renderEmailStatusBadge = (ownerId: string) => {
    const recipient = getOwnerEmailStatus(ownerId);
    
    if (!recipient) return null;

    let icon;
    let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
    let label = "No Email";
    let tooltipText = "Email not sent";

    if (recipient.status === "SENT") {
      icon = <CheckCircle2 className="h-3 w-3 text-green-600" />;
      variant = "outline";
      label = "Email Sent";
      tooltipText = recipient.emailSentAt 
        ? `Sent on ${format(new Date(recipient.emailSentAt), "MMM d, yyyy 'at' h:mm a")}`
        : "Email sent";
    } else if (recipient.status === "FAILED") {
      icon = <XCircle className="h-3 w-3" />;
      variant = "destructive";
      label = "Failed";
      tooltipText = recipient.errorMessage || "Email failed to send";
    } else {
      icon = <Clock className="h-3 w-3" />;
      variant = "outline";
      label = "Not Sent";
      tooltipText = "Email not sent yet";
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={variant} className="flex items-center gap-1 cursor-help">
              {icon}
              <span className="text-xs">{label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Helper function to get vehicle status badge config
  const getVehicleStatusBadge = (status: DealVehicleStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          icon: <Check className="h-3 w-3" />,
          variant: "default" as const,
          label: "Active",
          className: "bg-green-600 hover:bg-green-700",
        };
      case "REMOVED":
        return {
          icon: <X className="h-3 w-3" />,
          variant: "secondary" as const,
          label: "Removed",
          className: "bg-gray-500 hover:bg-gray-600",
        };
      case "WINNER":
        return {
          icon: <Trophy className="h-3 w-3" />,
          variant: "default" as const,
          label: "Winner",
          className: "bg-blue-600 hover:bg-blue-700",
        };
      default:
        return {
          icon: <Check className="h-3 w-3" />,
          variant: "default" as const,
          label: "Active",
          className: "bg-green-600 hover:bg-green-700",
        };
    }
  };

  // Helper function to handle vehicle status update
  const handleStatusUpdate = async (vehicleId: string, status: DealVehicleStatus) => {
    try {
      await updateVehicleStatus(resolvedParams.id, vehicleId, status);
      await utils.deal.getById.invalidate({ id: resolvedParams.id });
    } catch (error) {
      // Error handled by mutation hook
      console.error("Failed to update vehicle status:", error);
    }
  };

  // Helper function to handle fee dialog open
  const handleOpenFeeDialog = (vehicleId: string, vehicleName: string, currentFee: number | null) => {
    setSelectedVehicle({ id: vehicleId, name: vehicleName, currentFee });
    setShowFeeDialog(true);
  };

  // Helper function to handle fee update
  const handleFeeUpdate = async (fee: number | null) => {
    if (!selectedVehicle) return;
    
    try {
      await updateVehicleFee(resolvedParams.id, selectedVehicle.id, fee);
      await utils.deal.getById.invalidate({ id: resolvedParams.id });
    } catch (error) {
      // Error handled by mutation hook
      console.error("Failed to update vehicle fee:", error);
    }
  };

  // Sort vehicles: Winner first, then Active, then Removed at bottom
  const sortedVehicles = deal?.vehicles.slice().sort((a, b) => {
    const statusOrder = { WINNER: 0, ACTIVE: 1, REMOVED: 2 };
    const aOrder = statusOrder[a.status] ?? 1;
    const bOrder = statusOrder[b.status] ?? 1;
    if (aOrder !== bOrder) return aOrder - bOrder;
    // Secondary sort by order field
    return a.order - b.order;
  }) ?? [];


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
                        {deal.status !== "ARCHIVED" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setShowEditDialog(true)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit Deal
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleSendPendingEmails}
                              disabled={sendEmailMutation.isPending || getRecipientsToSend().length === 0}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Email to Pending ({getRecipientsToSend().length})
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        {deal.status !== "ARCHIVED" ? (
                          <DropdownMenuItem
                            onClick={() => void archive(deal.id)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => void unarchive(deal.id)}
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
                      <div>
                        <p className="text-muted-foreground">📋 Type</p>
                        <p className="font-medium">{getDealTypeLabel(deal.dealType)}</p>
                      </div>
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

            {/* Client Information Card */}
            {deal.clientContact && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle>Client Information</CardTitle>
                  </div>
                  <CardDescription>
                    Details about the client/hirer for this job
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {deal.clientContact.company && (
                        <div>
                          <p className="text-muted-foreground">Company</p>
                          <p className="font-medium text-base">{deal.clientContact.company}</p>
                        </div>
                      )}
                      {(deal.clientContact.firstName ?? deal.clientContact.lastName) && (
                        <div>
                          <p className="text-muted-foreground">Contact Person</p>
                          <p className="font-medium text-base">
                            {[deal.clientContact.firstName, deal.clientContact.lastName].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium text-base">{deal.clientContact.email}</p>
                      </div>
                      {deal.clientContact.phone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium text-base">{deal.clientContact.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Summary Card */}
            {(deal.fullQuote ?? deal.spokeFee ?? deal.baselineFee) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <CardTitle>Financial Summary</CardTitle>
                  </div>
                  <CardDescription>
                    Quote and fee breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      {deal.fullQuote && (
                        <div>
                          <p className="text-muted-foreground mb-1">Full Quote</p>
                          <p className="text-2xl font-bold text-primary">
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: "GBP",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(deal.fullQuote))}
                          </p>
                        </div>
                      )}
                      {deal.spokeFee && (
                        <div>
                          <p className="text-muted-foreground mb-1">Spoke Fee</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: "GBP",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(deal.spokeFee))}
                          </p>
                        </div>
                      )}
                      {deal.baselineFee && (
                        <div>
                          <p className="text-muted-foreground mb-1">Baseline Fee</p>
                          <p className="text-2xl font-bold">
                            {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: "GBP",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(Number(deal.baselineFee))}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Margin Calculation */}
                    {deal.fullQuote && deal.spokeFee && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Margin</span>
                          <span className="font-semibold text-lg">
                            {((Number(deal.spokeFee) / Number(deal.fullQuote)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Notes Card */}
            {deal.notes && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    <CardTitle>Internal Notes</CardTitle>
                  </div>
                  <CardDescription>
                    Private notes for tracking updates and context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

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
                  {sortedVehicles.map((dv) => {
                    const ownerName = formatOwnerName(
                      dv.vehicle.owner.firstName,
                      dv.vehicle.owner.lastName,
                      dv.vehicle.owner.email
                    );

                    const statusBadge = getVehicleStatusBadge(dv.status);
                    const isRemoved = dv.status === "REMOVED";

                    return (
                      <div
                        key={dv.id}
                        className={cn(
                          "group relative border rounded-lg hover:shadow-md transition-shadow overflow-hidden bg-card",
                          isRemoved && "opacity-60 bg-muted"
                        )}
                      >
                        {/* Mobile Layout: Vertical Card */}
                        <div className="md:hidden">
                          {/* Image */}
                          {dv.vehicle.media[0]?.publishedUrl && (
                            <div className="relative aspect-[4/3] w-full bg-muted">
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
                                    <DropdownMenuLabel>Vehicle Status</DropdownMenuLabel>
                                    <DropdownMenuItem
                                      onClick={() => void handleStatusUpdate(dv.vehicle.id, "ACTIVE")}
                                      disabled={dv.status === "ACTIVE"}
                                    >
                                      <Check className="mr-2 h-4 w-4" />
                                      Mark as Active
                                      {dv.status === "ACTIVE" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => void handleStatusUpdate(dv.vehicle.id, "REMOVED")}
                                      disabled={dv.status === "REMOVED"}
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      Mark as Removed
                                      {dv.status === "REMOVED" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => void handleStatusUpdate(dv.vehicle.id, "WINNER")}
                                      disabled={dv.status === "WINNER"}
                                    >
                                      <Trophy className="mr-2 h-4 w-4" />
                                      Mark as Winner
                                      {dv.status === "WINNER" && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleOpenFeeDialog(
                                        dv.vehicle.id,
                                        dv.vehicle.name,
                                        dv.ownerRequestedFee ? Number(dv.ownerRequestedFee) : null
                                      )}
                                    >
                                      <DollarSign className="mr-2 h-4 w-4" />
                                      Set Owner Fee
                                      {dv.ownerRequestedFee && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                          (£{Number(dv.ownerRequestedFee).toFixed(2)})
                                        </span>
                                      )}
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
                            {/* Status Badge - Only show for REMOVED and WINNER */}
                            {dv.status !== "ACTIVE" && (
                              <div className="flex items-center gap-2">
                                <Badge variant={statusBadge.variant} className={cn("flex items-center gap-1", statusBadge.className)}>
                                  {statusBadge.icon}
                                  <span className="text-xs">{statusBadge.label}</span>
                                </Badge>
                              </div>
                            )}

                            {/* Title & Owner Fee */}
                            <div 
                              className="cursor-pointer"
                              onClick={() => router.push(`/admin/vehicles/${dv.vehicle.id}`)}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-semibold text-lg leading-tight flex-1">
                                  {dv.vehicle.name}
                                </h3>
                                {dv.ownerRequestedFee && (
                                  <span className="font-bold text-lg text-primary whitespace-nowrap">
                                    {new Intl.NumberFormat("en-GB", {
                                      style: "currency",
                                      currency: "GBP",
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    }).format(Number(dv.ownerRequestedFee))}
                                  </span>
                                )}
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
                            
                            {/* Email Status */}
                            <div className="flex items-center gap-2 pt-2">
                              {renderEmailStatusBadge(dv.vehicle.owner.id)}
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
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg leading-tight">
                                  {dv.vehicle.name}
                                </h3>
                                {/* Status Badge - Only show for REMOVED and WINNER */}
                                {dv.status !== "ACTIVE" && (
                                  <Badge variant={statusBadge.variant} className={cn("flex items-center gap-1", statusBadge.className)}>
                                    {statusBadge.icon}
                                    <span className="text-xs">{statusBadge.label}</span>
                                  </Badge>
                                )}
                              </div>
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
                            
                            {/* Email Status - Desktop */}
                            <div className="flex items-center gap-2">
                              {renderEmailStatusBadge(dv.vehicle.owner.id)}
                            </div>
                          </div>

                          {/* Owner Fee */}
                          {dv.ownerRequestedFee && (
                            <div className="flex-shrink-0">
                              <p className="text-xl font-bold text-primary">
                                {new Intl.NumberFormat("en-GB", {
                                  style: "currency",
                                  currency: "GBP",
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(Number(dv.ownerRequestedFee))}
                              </p>
                            </div>
                          )}

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
                                <DropdownMenuLabel>Vehicle Status</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => void handleStatusUpdate(dv.vehicle.id, "ACTIVE")}
                                  disabled={dv.status === "ACTIVE"}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as Active
                                  {dv.status === "ACTIVE" && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleStatusUpdate(dv.vehicle.id, "REMOVED")}
                                  disabled={dv.status === "REMOVED"}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Mark as Removed
                                  {dv.status === "REMOVED" && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleStatusUpdate(dv.vehicle.id, "WINNER")}
                                  disabled={dv.status === "WINNER"}
                                >
                                  <Trophy className="mr-2 h-4 w-4" />
                                  Mark as Winner
                                  {dv.status === "WINNER" && <Check className="ml-auto h-4 w-4" />}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleOpenFeeDialog(
                                    dv.vehicle.id,
                                    dv.vehicle.name,
                                    dv.ownerRequestedFee ? Number(dv.ownerRequestedFee) : null
                                  )}
                                >
                                  <DollarSign className="mr-2 h-4 w-4" />
                                  Set Owner Fee
                                  {dv.ownerRequestedFee && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      (£{Number(dv.ownerRequestedFee).toFixed(2)})
                                    </span>
                                  )}
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

      {/* Update Owner Fee Dialog */}
      {selectedVehicle && (
        <UpdateOwnerFeeDialog
          open={showFeeDialog}
          onOpenChange={setShowFeeDialog}
          vehicleName={selectedVehicle.name}
          currentFee={selectedVehicle.currentFee}
          onSubmit={handleFeeUpdate}
        />
      )}
    </div>
  );
}

