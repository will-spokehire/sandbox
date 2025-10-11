"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

const createDealSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  fee: z.string().optional(),
});

type CreateDealFormData = z.infer<typeof createDealSchema>;

interface CreateEditDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  dealId?: string; // If provided, edit this deal instead of creating new
}

export function CreateEditDealDialog({
  open,
  onOpenChange,
  onSuccess,
  dealId,
}: CreateEditDealDialogProps) {
  const utils = api.useUtils();

  const form = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      name: "",
      date: "",
      time: "",
      location: "",
      brief: "",
      fee: "",
    },
  });

  // Fetch existing deal data when editing
  const { data: existingDeal, isLoading: isLoadingDeal } = api.deal.getById.useQuery(
    { id: dealId! },
    { enabled: open && !!dealId }
  );

  // Populate form with existing deal data
  useEffect(() => {
    if (existingDeal && dealId) {
      form.reset({
        name: existingDeal.name,
        date: existingDeal.date ?? "",
        time: existingDeal.time ?? "",
        location: existingDeal.location ?? "",
        brief: existingDeal.brief ?? "",
        fee: existingDeal.fee ?? "",
      });
    } else if (!dealId) {
      // Reset to empty when creating new deal
      form.reset({
        name: "",
        date: "",
        time: "",
        location: "",
        brief: "",
        fee: "",
      });
    }
  }, [existingDeal, dealId, form]);

  // Create deal mutation
  const createDealMutation = api.deal.create.useMutation({
    onSuccess: async () => {
      // Invalidate deals list to refresh
      await utils.deal.list.invalidate();
      
      toast.success("Deal created successfully! Add vehicles from the vehicles page.");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  // Update deal mutation
  const updateDealMutation = api.deal.update.useMutation({
    onSuccess: async () => {
      // Invalidate deals list and specific deal to refresh
      await utils.deal.list.invalidate();
      if (dealId) {
        await utils.deal.getById.invalidate({ id: dealId });
      }
      
      toast.success("Deal updated successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deal");
    },
  });

  const isSubmitting = createDealMutation.isPending || updateDealMutation.isPending;
  const isLoading = isLoadingDeal;

  const handleSubmit = form.handleSubmit((data) => {
    if (dealId) {
      // Update existing deal
      updateDealMutation.mutate({
        id: dealId,
        name: data.name,
        date: data.date,
        time: data.time,
        location: data.location,
        brief: data.brief,
        fee: data.fee,
      });
    } else {
      // Create new deal
      createDealMutation.mutate({
        name: data.name,
        date: data.date,
        time: data.time,
        location: data.location,
        brief: data.brief,
        fee: data.fee,
        vehicleIds: [], // Empty array - vehicles will be added later
        recipientIds: [], // Empty array - recipients will be added with vehicles
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dealId ? "Edit Deal" : "Create New Deal"}</DialogTitle>
          <DialogDescription>
            {dealId 
              ? "Update the deal details below."
              : "Create a deal without vehicles. You can add vehicles later from the vehicles page."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Deal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Mercedes C-Class for BMW Commercial"
              {...form.register("name")}
              disabled={isSubmitting}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                placeholder="e.g., Jan 15, 2025"
                {...form.register("date")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                placeholder="e.g., 9:00 AM"
                {...form.register("time")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Studio 51, London"
              {...form.register("location")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">Brief</Label>
            <Textarea
              id="brief"
              placeholder="Describe the job requirements..."
              {...form.register("brief")}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fee">Fee</Label>
            <Input
              id="fee"
              placeholder="e.g., £500/day"
              {...form.register("fee")}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dealId ? "Updating..." : "Creating..."}
                </>
              ) : (
                dealId ? "Update Deal" : "Create Deal"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
