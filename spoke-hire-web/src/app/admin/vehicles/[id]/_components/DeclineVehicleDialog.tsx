"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { XCircle, Info } from "lucide-react";

interface DeclineVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
  vehicleName: string;
  ownerEmail: string;
}

/**
 * Decline Vehicle Dialog Component
 * 
 * Allows admin to enter a decline reason that will be sent to the vehicle owner
 */
export function DeclineVehicleDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  vehicleName,
  ownerEmail,
}: DeclineVehicleDialogProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length > 0) {
      onConfirm(reason.trim());
      setReason(""); // Reset for next time
    }
  };

  const handleCancel = () => {
    setReason("");
    onOpenChange(false);
  };

  const isValidReason = reason.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle>Decline Vehicle</DialogTitle>
          </div>
          <DialogDescription>
            Provide feedback to help the owner improve their vehicle listing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Email will be sent to: {ownerEmail}</p>
              <p>Vehicle: {vehicleName}</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="decline-reason">
              Decline Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="decline-reason"
              placeholder="Please provide specific reasons for declining this vehicle. This message will be sent to the owner via email..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
              className="resize-none"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValidReason || isPending}
          >
            {isPending ? "Declining..." : "Decline Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

