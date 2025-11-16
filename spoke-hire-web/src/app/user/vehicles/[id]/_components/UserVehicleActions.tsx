"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type VehicleStatus } from "@prisma/client";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Power, Send } from "lucide-react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

interface UserVehicleActionsProps {
  vehicleId: string;
  currentStatus: VehicleStatus;
}

/**
 * User Vehicle Actions Component
 * 
 * Provides actions for vehicle owners:
 * - Publish (DRAFT/DECLINED → IN_REVIEW) with validation
 * - Deactivate (any status → ARCHIVED)
 * - Activate (ARCHIVED → IN_REVIEW)
 */
export function UserVehicleActions({
  vehicleId,
  currentStatus,
}: UserVehicleActionsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);

  // Get validation errors
  const { data: validationData } = api.userVehicle.getValidationErrors.useQuery(
    { vehicleId },
    { enabled: currentStatus === "DRAFT" || currentStatus === "DECLINED" }
  );

  const validationErrors = validationData?.errors ?? [];
  const canPublish = validationErrors.length === 0;

  // Submit for review mutation
  const submitMutation = api.userVehicle.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Vehicle submitted for review", {
        description: "An admin will review your vehicle shortly",
      });
      setIsPublishDialogOpen(false);
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to submit vehicle", {
        description: error.message,
      });
    },
  });

  // Deactivate mutation
  const deactivateMutation = api.userVehicle.archiveMyVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deactivated");
      setIsDeactivateDialogOpen(false);
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to deactivate vehicle", {
        description: error.message,
      });
    },
  });

  // Activate mutation (reuses submit for review)
  const activateMutation = api.userVehicle.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Vehicle activated", {
        description: "Your vehicle has been moved to review status",
      });
      setIsActivateDialogOpen(false);
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to activate vehicle", {
        description: error.message,
      });
    },
  });

  const handlePublish = () => {
    if (canPublish) {
      setIsPublishDialogOpen(true);
    }
  };

  const handleConfirmPublish = () => {
    submitMutation.mutate({ vehicleId });
  };

  const handleDeactivate = () => {
    setIsDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = () => {
    deactivateMutation.mutate({ vehicleId });
  };

  const handleActivate = () => {
    setIsActivateDialogOpen(true);
  };

  const handleConfirmActivate = () => {
    activateMutation.mutate({ vehicleId });
  };

  // Show publish button for DRAFT and DECLINED
  const canSubmitForReview = currentStatus === "DRAFT" || currentStatus === "DECLINED";

  // Can always deactivate (except if already deactivated)
  const canDeactivate = currentStatus !== "ARCHIVED";

  // Show activate button for ARCHIVED status
  const canActivate = currentStatus === "ARCHIVED";

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {canSubmitForReview && (
          <Button
            onClick={handlePublish}
            disabled={!canPublish || submitMutation.isPending}
            className="gap-2"
            size="sm"
          >
            <Send className="h-4 w-4" />
            {submitMutation.isPending ? "Submitting..." : "Publish"}
          </Button>
        )}

        {canActivate && (
          <Button
            onClick={handleActivate}
            disabled={activateMutation.isPending}
            className="gap-2"
            size="sm"
          >
            <Power className="h-4 w-4" />
            {activateMutation.isPending ? "Activating..." : "Activate"}
          </Button>
        )}

        {canDeactivate && (
          <Button
            variant="outline"
            onClick={handleDeactivate}
            disabled={deactivateMutation.isPending}
            className="gap-2"
            size="sm"
          >
            <Power className="h-4 w-4" />
            Deactivate
          </Button>
        )}
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <DialogTitle>Submit for Review?</DialogTitle>
            </div>
            <DialogDescription>
              Your vehicle will be submitted to an admin for review. You&apos;ll receive an email once it&apos;s been reviewed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPublishDialogOpen(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPublish}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Power className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <DialogTitle>Deactivate Vehicle?</DialogTitle>
            </div>
            <DialogDescription>
              This vehicle will be deactivated and hidden from your active listings. You can activate it again later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeactivateDialogOpen(false)}
              disabled={deactivateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? "Deactivating..." : "Deactivate Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activate Confirmation Dialog */}
      <Dialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <Power className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>Activate Vehicle?</DialogTitle>
            </div>
            <DialogDescription>
              Your vehicle will be moved to &quot;In Review&quot; status and submitted to an admin for review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActivateDialogOpen(false)}
              disabled={activateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmActivate}
              disabled={activateMutation.isPending}
            >
              {activateMutation.isPending ? "Activating..." : "Activate Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

