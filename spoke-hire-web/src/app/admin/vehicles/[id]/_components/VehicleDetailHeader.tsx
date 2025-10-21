"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DeclineVehicleDialog } from "./DeclineVehicleDialog";
import { type VehicleDetail } from "~/types/vehicle";
import { api } from "~/trpc/react";
import { toast } from "sonner";

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

  // Approve vehicle mutation
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
    approveMutation.mutate({ vehicleId: vehicle.id });
  };

  const handleDecline = (reason: string) => {
    declineMutation.mutate({
      vehicleId: vehicle.id,
      declinedReason: reason,
    });
  };

  const isInReview = vehicle.status === "IN_REVIEW";

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
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                  {vehicle.name}
                </h1>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">
                  {vehicle.make.name} {vehicle.model.name} • {vehicle.year}
                </p>
              </div>
            </div>

            {/* Right: Action buttons (wraps on mobile) */}
            <div className="flex items-center gap-2 flex-shrink-0 md:ml-4">
              {isInReview && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="gap-2"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approveMutation.isPending ? "Approving..." : "Approve"}
                  </Button>
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
