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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "~/components/ui/alert";
import { Archive, Send, AlertCircle, ArchiveRestore } from "lucide-react";
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
 * - Archive (any status → ARCHIVED)
 * - Unarchive (ARCHIVED → IN_REVIEW)
 */
export function UserVehicleActions({
  vehicleId,
  currentStatus,
}: UserVehicleActionsProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isUnarchiveDialogOpen, setIsUnarchiveDialogOpen] = useState(false);

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

  // Archive mutation
  const archiveMutation = api.userVehicle.archiveMyVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle archived");
      setIsArchiveDialogOpen(false);
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to archive vehicle", {
        description: error.message,
      });
    },
  });

  // Unarchive mutation (reuses submit for review)
  const unarchiveMutation = api.userVehicle.submitForReview.useMutation({
    onSuccess: () => {
      toast.success("Vehicle unarchived", {
        description: "Your vehicle has been moved to review status",
      });
      setIsUnarchiveDialogOpen(false);
      void utils.userVehicle.myVehicleById.invalidate({ id: vehicleId });
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to unarchive vehicle", {
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

  const handleArchive = () => {
    setIsArchiveDialogOpen(true);
  };

  const handleConfirmArchive = () => {
    archiveMutation.mutate({ vehicleId });
  };

  const handleUnarchive = () => {
    setIsUnarchiveDialogOpen(true);
  };

  const handleConfirmUnarchive = () => {
    unarchiveMutation.mutate({ vehicleId });
  };

  // Show publish button for DRAFT and DECLINED
  const canSubmitForReview = currentStatus === "DRAFT" || currentStatus === "DECLINED";

  // Can always archive (except if already archived)
  const canArchive = currentStatus !== "ARCHIVED";

  // Show unarchive button for ARCHIVED status
  const canUnarchive = currentStatus === "ARCHIVED";

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

        {canUnarchive && (
          <Button
            onClick={handleUnarchive}
            disabled={unarchiveMutation.isPending}
            className="gap-2"
            size="sm"
          >
            <ArchiveRestore className="h-4 w-4" />
            {unarchiveMutation.isPending ? "Unarchiving..." : "Unarchive"}
          </Button>
        )}

        {canArchive && (
          <Button
            variant="outline"
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="gap-2"
            size="sm"
          >
            <Archive className="h-4 w-4" />
            Archive
          </Button>
        )}
      </div>

      {/* Show validation errors if can't publish */}
      {canSubmitForReview && !canPublish && validationErrors.length > 0 && (
        <Alert variant="default" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot submit for review</AlertTitle>
          <AlertDescription>
            <p className="mb-2">Please complete the following:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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

      {/* Archive Confirmation Dialog */}
      <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Archive className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
              <DialogTitle>Archive Vehicle?</DialogTitle>
            </div>
            <DialogDescription>
              This vehicle will be archived and hidden from your active listings. You can restore it later if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsArchiveDialogOpen(false)}
              disabled={archiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? "Archiving..." : "Archive Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unarchive Confirmation Dialog */}
      <Dialog open={isUnarchiveDialogOpen} onOpenChange={setIsUnarchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <ArchiveRestore className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle>Unarchive Vehicle?</DialogTitle>
            </div>
            <DialogDescription>
              Your vehicle will be moved to &quot;In Review&quot; status and submitted to an admin for review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUnarchiveDialogOpen(false)}
              disabled={unarchiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnarchive}
              disabled={unarchiveMutation.isPending}
            >
              {unarchiveMutation.isPending ? "Unarchiving..." : "Unarchive Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

