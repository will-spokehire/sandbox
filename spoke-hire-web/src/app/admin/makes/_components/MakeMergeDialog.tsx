/**
 * Make Merge Dialog Component
 * 
 * Dialog for merging multiple makes into a primary make.
 */

"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { api } from "~/trpc/react";
import type { MakeWithCount } from "~/server/types";

interface MakeMergeDialogProps {
  makes: MakeWithCount[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MakeMergeDialog({
  makes,
  open,
  onOpenChange,
  onSuccess,
}: MakeMergeDialogProps) {
  const [primaryMakeId, setPrimaryMakeId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();

  const mergeMakesMutation = api.make.merge.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      // Force immediate refetch to ensure UI shows updated data
      await utils.make.list.refetch();
      onSuccess();
      onOpenChange(false);
      setPrimaryMakeId("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(`Failed to merge makes: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleMerge = () => {
    if (!primaryMakeId) {
      toast.error("Please select a primary make");
      return;
    }

    const secondaryMakeIds = makes
      .filter((make) => make.id !== primaryMakeId)
      .map((make) => make.id);

    if (secondaryMakeIds.length === 0) {
      toast.error("No secondary makes selected");
      return;
    }

    setIsSubmitting(true);
    mergeMakesMutation.mutate({
      primaryMakeId,
      secondaryMakeIds,
    });
  };

  const totalVehicles = makes.reduce((sum, make) => sum + make._count.vehicles, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Makes</DialogTitle>
          <DialogDescription>
            Select the primary make to merge into. All vehicles from secondary makes will be reassigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. {makes.length} make(s) will be merged, affecting {totalVehicles} vehicle(s). Secondary makes will be deleted.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Primary Make:</Label>
            <RadioGroup value={primaryMakeId} onValueChange={setPrimaryMakeId}>
              {makes.map((make) => (
                <div
                  key={make.id}
                  className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50"
                >
                  <RadioGroupItem value={make.id} id={make.id} />
                  <Label
                    htmlFor={make.id}
                    className="flex-1 cursor-pointer space-y-1 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium break-words">{make.name}</span>
                      {!make.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {!make.isPublished && (
                        <Badge variant="secondary">Unpublished</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground break-all">
                      Slug: {make.slug} • {make._count.vehicles} vehicles • {make._count.models} models
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {primaryMakeId && (
            <div className="rounded-lg bg-muted p-4">
              <h4 className="mb-2 text-sm font-semibold">What will happen:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• All vehicles from secondary makes will be reassigned to the primary make</li>
                <li>• Models will be matched by name where possible</li>
                <li>• Secondary makes will be permanently deleted</li>
                <li>• {makes.filter(m => m.id !== primaryMakeId).length} make(s) will be removed</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPrimaryMakeId("");
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleMerge}
            disabled={!primaryMakeId || isSubmitting}
          >
            {isSubmitting ? "Merging..." : "Merge Makes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

