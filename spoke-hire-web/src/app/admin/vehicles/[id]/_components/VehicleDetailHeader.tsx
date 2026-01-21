"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DeclineVehicleDialog } from "./DeclineVehicleDialog";
import { type VehicleDetail } from "~/types/vehicle";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { formatPricingRate } from "~/lib/pricing";

interface VehicleDetailHeaderProps {
  vehicle: VehicleDetail;
  onEdit?: () => void;
}

/**
 * Vehicle Detail Header
 * 
 * Header for the vehicle detail page with back navigation and admin actions.
 * Uses browser back() which automatically preserves the list state via URL.
 * Shows Approve/Decline buttons for IN_REVIEW vehicles.
 */
export function VehicleDetailHeader({ vehicle, onEdit }: VehicleDetailHeaderProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);

  // Check if make/model are unpublished
  const makeIsUnpublished = (vehicle.make as unknown as { isPublished?: boolean })?.isPublished === false;
  const modelIsUnpublished = (vehicle.model as unknown as { isPublished?: boolean })?.isPublished === false;
  const hasUnpublishedMakeModel = makeIsUnpublished || modelIsUnpublished;

  // Approve vehicle with make/model mutation
  const approveWithMakeModelMutation = api.vehicle.approveVehicleWithMakeModel.useMutation({
    onSuccess: (result) => {
      const messages: string[] = [];
      if (result.makeWasReused) {
        messages.push("Make matched with existing published make");
      }
      if (result.modelWasReused) {
        messages.push("Model matched with existing published model");
      }
      
      toast.success("Vehicle approved", {
        description: messages.length > 0 
          ? messages.join(". ") + ". Vehicle has been published and owner notified."
          : "Vehicle has been published and owner notified",
      });
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to approve vehicle", {
        description: error.message,
      });
    },
  });

  // Approve vehicle mutation (simple)
  const approveMutation = api.vehicle.approveVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle approved", {
        description: "Vehicle has been published and owner notified",
      });
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to approve vehicle", {
        description: error.message,
      });
    },
  });

  // Decline vehicle mutation
  const declineMutation = api.vehicle.declineVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle declined", {
        description: "Owner has been notified with your feedback",
      });
      setIsDeclineDialogOpen(false);
      void utils.vehicle.getById.invalidate({ id: vehicle.id });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to decline vehicle", {
        description: error.message,
      });
    },
  });

  const handleApprove = () => {
    if (hasUnpublishedMakeModel) {
      // If make/model are unpublished, prompt admin to review them first
      if (onEdit) {
        toast.info("Please review make/model first", {
          description: "This vehicle has user-created make/model that needs review",
        });
        onEdit();
      }
    } else {
      // Use simple approval
      approveMutation.mutate({ vehicleId: vehicle.id });
    }
  };

  const handleApproveWithMakeModel = () => {
    approveWithMakeModelMutation.mutate({
      vehicleId: vehicle.id,
      makeId: vehicle.makeId,
      makeName: vehicle.make.name,
      modelId: vehicle.modelId,
      modelName: vehicle.model.name,
    });
  };

  const handleDecline = (reason: string) => {
    declineMutation.mutate({
      vehicleId: vehicle.id,
      declinedReason: reason,
    });
  };

  const isInReview = vehicle.status === "IN_REVIEW";
  const isApproving = approveMutation.isPending || approveWithMakeModelMutation.isPending;

  return (
    <>
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Left: Back button + Vehicle name */}
            <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                    {vehicle.year} {vehicle.make.name} {vehicle.model.name}
                  </h1>
                  {hasUnpublishedMakeModel && isInReview && (
                    <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="hidden sm:inline">Review Make/Model</span>
                    </Badge>
                  )}
                </div>
                <p className="body-xs text-slate-600 dark:text-slate-400 truncate">
                  {[
                    vehicle.hourlyRate && `£${vehicle.hourlyRate} hourly`,
                    vehicle.dailyRate && `£${vehicle.dailyRate} daily`
                  ].filter(Boolean).join(' • ') || 'Pricing not set'}
                </p>
              </div>
            </div>

            {/* Right: Action buttons (wraps on mobile) */}
            <div className="flex items-center gap-2 flex-shrink-0 md:ml-4">
              {isInReview && (
                <>
                  {hasUnpublishedMakeModel ? (
                    <Button
                      onClick={onEdit}
                      disabled={isApproving}
                      variant="outline"
                      className="gap-2"
                      size="sm"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Review & Approve
                    </Button>
                  ) : (
                    <Button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="gap-2"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {isApproving ? "Approving..." : "Approve"}
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsDeclineDialogOpen(true)}
                    disabled={declineMutation.isPending}
                    variant="destructive"
                    className="gap-2"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Decline Dialog */}
      <DeclineVehicleDialog
        open={isDeclineDialogOpen}
        onOpenChange={setIsDeclineDialogOpen}
        vehicleName={vehicle.name}
        ownerEmail={vehicle.owner.email}
        onConfirm={handleDecline}
        isPending={declineMutation.isPending}
      />
    </>
  );
}
