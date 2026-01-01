"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";
import { UserSearchSelect } from "~/components/shared/UserSearchSelect";
import { CreateContactDialog } from "~/components/shared/CreateContactDialog";
import { UserPlus } from "lucide-react";

const createDealSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name must be less than 100 characters"),
  dealType: z.enum(["PERSONAL_HIRE", "PRODUCTION"], {
    required_error: "Please select a deal type",
  }),
  date: z.string().optional(),
  time: z.string().optional(),
  location: z.string().optional(),
  brief: z.string().optional(),
  fee: z.string().optional(),
  clientContactId: z.string().optional(),
  fullQuote: z.union([z.number().min(0).max(999999.99), z.nan()]).nullable().optional().transform((val) => (isNaN(val as number) || val === null || val === undefined) ? undefined : val),
  spokeFee: z.union([z.number().min(0).max(999999.99), z.nan()]).nullable().optional().transform((val) => (isNaN(val as number) || val === null || val === undefined) ? undefined : val),
  notes: z.string().max(2000).optional(),
  status: z.enum(["OPTIONS", "CONTRACTS_INVOICE", "COMPLETE", "POSTPONED", "ABANDONED", "ARCHIVED"]).optional(),
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
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);

  const form = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      name: "",
      dealType: "PRODUCTION",
      date: "",
      time: "",
      location: "",
      brief: "",
      fee: "",
      clientContactId: "",
      fullQuote: undefined,
      spokeFee: undefined,
      notes: "",
      status: "OPTIONS",
    },
  });

  // Handle contact creation
  const handleContactCreated = (contactId: string) => {
    form.setValue("clientContactId", contactId);
  };

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
        dealType: existingDeal.dealType,
        date: existingDeal.date ?? "",
        time: existingDeal.time ?? "",
        location: existingDeal.location ?? "",
        brief: existingDeal.brief ?? "",
        fee: existingDeal.fee ?? "",
        clientContactId: existingDeal.clientContactId ?? "",
        fullQuote: existingDeal.fullQuote ? Number(existingDeal.fullQuote) : undefined,
        spokeFee: existingDeal.spokeFee ? Number(existingDeal.spokeFee) : undefined,
        notes: existingDeal.notes ?? "",
        status: existingDeal.status,
      });
    } else if (!dealId) {
      // Reset to empty when creating new deal
      form.reset({
        name: "",
        dealType: "PRODUCTION",
        date: "",
        time: "",
        location: "",
        brief: "",
        fee: "",
        clientContactId: "",
        fullQuote: undefined,
        spokeFee: undefined,
        notes: "",
        status: "OPTIONS",
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
        dealType: data.dealType,
        date: data.date,
        time: data.time,
        location: data.location,
        brief: data.brief,
        fee: data.fee,
        clientContactId: data.clientContactId && data.clientContactId.trim() !== "" ? data.clientContactId : null,
        fullQuote: data.fullQuote ?? null,
        spokeFee: data.spokeFee ?? null,
        notes: data.notes,
        status: data.status,
      });
    } else {
      // Create new deal
      createDealMutation.mutate({
        name: data.name,
        dealType: data.dealType,
        date: data.date,
        time: data.time,
        location: data.location,
        brief: data.brief,
        fee: data.fee,
        clientContactId: data.clientContactId && data.clientContactId.trim() !== "" ? data.clientContactId : undefined,
        fullQuote: data.fullQuote,
        spokeFee: data.spokeFee,
        notes: data.notes,
        vehicleIds: [], // Empty array - vehicles will be added later
        recipientIds: [], // Empty array - recipients will be added with vehicles
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">{dealId ? "Edit Deal" : "Create New Deal"}</DialogTitle>
          <DialogDescription className="text-base md:text-lg leading-relaxed">
            {dealId 
              ? "Update the deal details below."
              : "Create a deal. You can add vehicles later from the vehicles page."
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

          <div className="space-y-2">
            <Label htmlFor="dealType">
              Deal Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.watch("dealType")}
              onValueChange={(value) => form.setValue("dealType", value as "PERSONAL_HIRE" | "PRODUCTION")}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERSONAL_HIRE">Personal Hire</SelectItem>
                <SelectItem value="PRODUCTION">Production</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.dealType && (
              <p className="text-sm text-red-500">
                {form.formState.errors.dealType.message}
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
              className="break-all"
            />
          </div>

          <Separator className="my-4" />

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Client Information</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="clientContact">Client Contact</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto py-0 px-2 text-xs"
                  onClick={() => setShowCreateContactDialog(true)}
                  disabled={isSubmitting}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  New
                </Button>
              </div>
              <UserSearchSelect
                value={form.watch("clientContactId")}
                onValueChange={(value) => form.setValue("clientContactId", value)}
                disabled={isSubmitting}
                placeholder="Select client contact..."
              />
              <p className="text-xs text-muted-foreground">
                The person/company requesting this job
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Financial Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Financial Information</h3>
              <p className="text-xs text-muted-foreground mt-1">Optional - you can add this later</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullQuote">Full Quote (£)</Label>
                <Input
                  id="fullQuote"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 800"
                  {...form.register("fullQuote", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spokeFee">Spoke Fee (£)</Label>
                <Input
                  id="spokeFee"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 300"
                  {...form.register("spokeFee", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee">Proposed fee (£)</Label>
                <Input
                  id="fee"
                  placeholder="e.g., £500/day"
                  {...form.register("fee")}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {dealId && (
            <>
              <Separator className="my-4" />

              {/* Status - only show when editing */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as any)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPTIONS">Options</SelectItem>
                    <SelectItem value="CONTRACTS_INVOICE">Contracts & Invoice</SelectItem>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="POSTPONED">Postponed</SelectItem>
                    <SelectItem value="ABANDONED">Abandoned</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator className="my-4" />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any internal notes or updates about this deal..."
              {...form.register("notes")}
              disabled={isSubmitting}
              rows={3}
              className="break-all"
            />
            <p className="text-xs text-muted-foreground">
              For internal use only (not sent to clients)
            </p>
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

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={showCreateContactDialog}
        onOpenChange={setShowCreateContactDialog}
        onContactCreated={handleContactCreated}
      />
    </Dialog>
  );
}
