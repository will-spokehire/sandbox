"use client";

import { useState } from "react";
import { type VehicleStatus } from "@prisma/client";
import { CheckCircle, XCircle, Send, Power } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { VehicleStatusBadge } from "~/components/vehicles/VehicleStatusBadge";
import { DeclineVehicleDialog } from "./DeclineVehicleDialog";
import { api } from "~/trpc/react";

interface VehicleStatusActionsProps {
  vehicleId: string;
  currentStatus: VehicleStatus;
  vehicleName: string;
  ownerEmail: string;
}

/**
 * Admin Vehicle Status Actions Component
 * 
 * Provides admin-specific status change actions:
 * - If IN_REVIEW: Show prominent Approve and Decline buttons
 * - Admin can change to any status from any status
 */
export function VehicleStatusActions({
  vehicleId,
  currentStatus,
  vehicleName,
  ownerEmail,
}: VehicleStatusActionsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);

  // Approve vehicle mutation
  const approveMutation = api.vehicle.approveVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle approved", {
        description: "Vehicle has been published and owner notified",
      });
      void utils.vehicle.getById.invalidate({ id: vehicleId });
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
      void utils.vehicle.getById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to decline vehicle", {
        description: error.message,
      });
    },
  });

  // General status update mutation
  const updateStatusMutation = api.vehicle.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success("Status updated", {
        description: `Vehicle status changed to ${data.status}`,
      });
      void utils.vehicle.getById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to update status", {
        description: error.message,
      });
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ vehicleId });
  };

  const handleDecline = (reason: string) => {
    declineMutation.mutate({
      vehicleId,
      declinedReason: reason,
    });
  };

  const handleStatusChange = (status: VehicleStatus) => {
    updateStatusMutation.mutate({
      id: vehicleId,
      status,
    });
  };

  // If vehicle is IN_REVIEW, show prominent Approve/Decline buttons
  if (currentStatus === "IN_REVIEW") {
    return (
      <>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <VehicleStatusBadge status={currentStatus} />
          <div className="flex gap-2">
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
              variant="destructive"
              onClick={() => setIsDeclineDialogOpen(true)}
              disabled={declineMutation.isPending}
              className="gap-2"
              size="sm"
            >
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>

        <DeclineVehicleDialog
          open={isDeclineDialogOpen}
          onOpenChange={setIsDeclineDialogOpen}
          onConfirm={handleDecline}
          isPending={declineMutation.isPending}
          vehicleName={vehicleName}
          ownerEmail={ownerEmail}
        />
      </>
    );
  }

  // For other statuses, show badge and quick action buttons
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <VehicleStatusBadge status={currentStatus} />
      <div className="flex gap-2 flex-wrap">
        {currentStatus !== "PUBLISHED" && (
          <Button
            onClick={() => handleStatusChange("PUBLISHED")}
            disabled={updateStatusMutation.isPending}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Publish
          </Button>
        )}
        {currentStatus !== "IN_REVIEW" && (
          <Button
            onClick={() => handleStatusChange("IN_REVIEW")}
            disabled={updateStatusMutation.isPending}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            In Review
          </Button>
        )}
        {currentStatus !== "ARCHIVED" && (
          <Button
            onClick={() => handleStatusChange("ARCHIVED")}
            disabled={updateStatusMutation.isPending}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Power className="h-4 w-4" />
            Deactivate
          </Button>
        )}
      </div>
    </div>
  );
}
