"use client";

import { useState } from "react";
import { VehicleStatus } from "@prisma/client";
import { CheckCircle, XCircle, Archive, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { api } from "~/trpc/react";

interface VehicleStatusActionsProps {
  vehicleId: string;
  currentStatus: VehicleStatus;
}

/**
 * Vehicle Status Actions Component
 * 
 * Provides quick actions to change vehicle status with confirmation
 */
export function VehicleStatusActions({
  vehicleId,
  currentStatus,
}: VehicleStatusActionsProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | null>(null);

  const updateStatusMutation = api.vehicle.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success("Status updated successfully", {
        description: `Vehicle status changed to ${data.status}`,
      });
      setIsDialogOpen(false);
      router.refresh(); // Refresh the page to show updated data
    },
    onError: (error) => {
      toast.error("Failed to update status", {
        description: error.message,
      });
    },
  });

  const handleStatusChange = (status: VehicleStatus) => {
    setSelectedStatus(status);
    setIsDialogOpen(true);
  };

  const confirmStatusChange = () => {
    if (selectedStatus) {
      updateStatusMutation.mutate({
        id: vehicleId,
        status: selectedStatus,
      });
    }
  };

  // Define available status transitions
  const statusOptions = [
    {
      value: VehicleStatus.PUBLISHED,
      label: "Publish",
      icon: CheckCircle,
      variant: "default" as const,
      description: "Make this vehicle visible to the public",
      show: currentStatus !== VehicleStatus.PUBLISHED,
    },
    {
      value: VehicleStatus.DRAFT,
      label: "Move to Draft",
      icon: FileText,
      variant: "outline" as const,
      description: "Hide this vehicle and mark as draft",
      show: currentStatus !== VehicleStatus.DRAFT,
    },
    {
      value: VehicleStatus.DECLINED,
      label: "Decline",
      icon: XCircle,
      variant: "destructive" as const,
      description: "Decline this vehicle listing",
      show: currentStatus !== VehicleStatus.DECLINED,
    },
    {
      value: VehicleStatus.ARCHIVED,
      label: "Archive",
      icon: Archive,
      variant: "secondary" as const,
      description: "Archive this vehicle (soft delete)",
      show: currentStatus !== VehicleStatus.ARCHIVED,
    },
  ].filter((option) => option.show);

  const selectedOption = statusOptions.find((opt) => opt.value === selectedStatus);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background"
          >
            Change Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Change Vehicle Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {option.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Vehicle Status</DialogTitle>
            <DialogDescription>
              {selectedOption?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to change the status from{" "}
              <span className="font-semibold">{currentStatus}</span> to{" "}
              <span className="font-semibold">{selectedStatus}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={selectedOption?.variant || "default"}
              onClick={confirmStatusChange}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>Confirm</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

