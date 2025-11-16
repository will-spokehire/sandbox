/**
 * Model Merge Dialog Component
 * 
 * Dialog for merging multiple models into a primary model.
 * Only allows merging models from the same make.
 */

"use client";

import { useState, useMemo } from "react";
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
import type { ModelWithDetails } from "~/server/types";

interface ModelMergeDialogProps {
  models: ModelWithDetails[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModelMergeDialog({
  models,
  open,
  onOpenChange,
  onSuccess,
}: ModelMergeDialogProps) {
  const [primaryModelId, setPrimaryModelId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();

  const mergeModelsMutation = api.model.merge.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message);
      // Force immediate refetch to ensure UI shows updated data
      await utils.model.list.refetch();
      onSuccess();
      onOpenChange(false);
      setPrimaryModelId("");
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast.error(`Failed to merge models: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  // Check if all models are from the same make
  const differentMakes = useMemo(() => {
    if (models.length === 0) return false;
    const firstMakeId = models[0]?.makeId;
    return models.some((model) => model.makeId !== firstMakeId);
  }, [models]);

  const handleMerge = () => {
    if (differentMakes) {
      toast.error("Cannot merge models from different makes");
      return;
    }

    if (!primaryModelId) {
      toast.error("Please select a primary model");
      return;
    }

    const secondaryModelIds = models
      .filter((model) => model.id !== primaryModelId)
      .map((model) => model.id);

    if (secondaryModelIds.length === 0) {
      toast.error("No secondary models selected");
      return;
    }

    setIsSubmitting(true);
    mergeModelsMutation.mutate({
      primaryModelId,
      secondaryModelIds,
    });
  };

  const totalVehicles = models.reduce((sum, model) => sum + model._count.vehicles, 0);
  const makeName = models[0]?.make.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merge Models</DialogTitle>
          <DialogDescription>
            Select the primary model to merge into. All vehicles from secondary models will be reassigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {differentMakes ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cannot merge models from different makes. Please select models from the same make only.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action cannot be undone. {models.length} model(s) will be merged, affecting {totalVehicles} vehicle(s). Secondary models will be deleted.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium">
                  Make: <Badge variant="outline">{makeName}</Badge>
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Select Primary Model:</Label>
                <RadioGroup value={primaryModelId} onValueChange={setPrimaryModelId}>
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <RadioGroupItem value={model.id} id={model.id} />
                      <Label
                        htmlFor={model.id}
                        className="flex-1 cursor-pointer space-y-1 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium break-words">{model.name}</span>
                          {!model.isActive && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {!model.isPublished && (
                            <Badge variant="secondary">Unpublished</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground break-all">
                          Slug: {model.slug} • {model._count.vehicles} vehicles
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {primaryModelId && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="mb-2 text-sm font-semibold">What will happen:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• All vehicles from secondary models will be reassigned to the primary model</li>
                    <li>• Secondary models will be permanently deleted</li>
                    <li>• {models.filter(m => m.id !== primaryModelId).length} model(s) will be removed</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setPrimaryModelId("");
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleMerge}
            disabled={!primaryModelId || isSubmitting || differentMakes}
          >
            {isSubmitting ? "Merging..." : "Merge Models"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

