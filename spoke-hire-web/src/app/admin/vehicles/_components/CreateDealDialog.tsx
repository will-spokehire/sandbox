"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Send, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";

const createDealSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

type CreateDealFormData = z.infer<typeof createDealSchema>;

interface CreateDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicleIds: string[];
  onSuccess: () => void;
}

export function CreateDealDialog({
  open,
  onOpenChange,
  selectedVehicleIds,
  onSuccess,
}: CreateDealDialogProps) {
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("existing");
  const [vehicleOwners, setVehicleOwners] = useState<Array<{
    id: string;
    email: string;
    name: string;
  }>>([]);
  const [newVehicleCount, setNewVehicleCount] = useState(0);
  const [newOwnerCount, setNewOwnerCount] = useState(0);

  const utils = api.useUtils();

  const form = useForm<CreateDealFormData>({
    resolver: zodResolver(createDealSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch existing deals (only active deals can have vehicles added)
  const { data: dealsData, isLoading: isLoadingDeals } = api.deal.list.useQuery(
    {
      limit: 100,
      status: "ACTIVE",
    },
    {
      enabled: open,
    }
  );

  // Set default tab based on whether there are active deals (after data loads)
  useEffect(() => {
    if (!isLoadingDeals && dealsData) {
      const hasActiveDeals = (dealsData?.deals?.length ?? 0) > 0;
      setActiveTab(hasActiveDeals ? "existing" : "new");
    }
  }, [isLoadingDeals, dealsData]);

  // Fetch selected deal details to check for duplicates
  const { data: selectedDeal, isLoading: isLoadingSelectedDeal } = api.deal.getById.useQuery(
    {
      id: selectedDealId,
    },
    {
      enabled: open && !!selectedDealId,
    }
  );

  // Fetch vehicle details to get owners
  const { data: vehicles, isLoading: isLoadingVehicles } = api.vehicle.list.useQuery(
    {
      limit: 50,
      vehicleIds: selectedVehicleIds,
    },
    {
      enabled: open && selectedVehicleIds.length > 0,
    }
  );

  // Fetch new vehicles/owners for existing deal using backend filtering
  const { data: newItemsData, isLoading: isLoadingNewItems } = 
    api.deal.getNewVehiclesAndOwners.useQuery(
      {
        dealId: selectedDealId,
        vehicleIds: selectedVehicleIds,
      },
      {
        enabled: open && !!selectedDealId && selectedVehicleIds.length > 0,
      }
    );

  // Check if we're calculating counts
  const isCalculating = 
    isLoadingVehicles || 
    (!!selectedDealId && (isLoadingSelectedDeal || isLoadingNewItems));

  // Extract unique owners from vehicles
  useEffect(() => {
    // Only run when dialog is open
    if (!open) return;

    if (!vehicles?.vehicles) {
      setVehicleOwners([]);
      setNewVehicleCount(0);
      setNewOwnerCount(0);
      return;
    }

    // Extract all owners from selected vehicles
    const ownersMap = new Map();
    vehicles.vehicles.forEach((vehicle: any) => {
      if (vehicle.owner && !ownersMap.has(vehicle.owner.id)) {
        const name =
          vehicle.owner.firstName || vehicle.owner.lastName
            ? `${vehicle.owner.firstName || ""} ${vehicle.owner.lastName || ""}`.trim()
            : vehicle.owner.email;
        ownersMap.set(vehicle.owner.id, {
          id: vehicle.owner.id,
          email: vehicle.owner.email,
          name,
        });
      }
    });

    const allOwners = Array.from(ownersMap.values());

    // Use backend-filtered data if available (for existing deals)
    if (activeTab === "existing" && selectedDealId && newItemsData) {
      setNewVehicleCount(newItemsData.newVehicleCount);
      setNewOwnerCount(newItemsData.newOwnerCount);
      
      // Filter owners to only show new ones
      const newOwners = allOwners.filter((owner) =>
        newItemsData.newOwnerIds.includes(owner.id)
      );
      setVehicleOwners(newOwners);
    } else {
      // For new deals, all vehicles and owners are new
      setVehicleOwners(allOwners);
      setNewVehicleCount(selectedVehicleIds.length);
      setNewOwnerCount(allOwners.length);
    }
  }, [vehicles, newItemsData, selectedVehicleIds, activeTab, selectedDealId, open]);

  // Create deal mutation
  // Note: Emails are sent automatically on the server after deal creation
  const createDealMutation = api.deal.create.useMutation({
    onSuccess: async (deal) => {
      // Invalidate deals list to refresh
      await utils.deal.list.invalidate();
      
      toast.success("Deal created and emails sent successfully!");
      onSuccess();
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal");
    },
  });

  // Add vehicles to existing deal mutation
  // Note: Emails are sent automatically on the server to new recipients only
  const addVehiclesMutation = api.deal.addVehiclesToDeal.useMutation({
    onSuccess: async (deal) => {
      // Invalidate deals list and specific deal to refresh
      await utils.deal.list.invalidate();
      await utils.deal.getById.invalidate({ id: deal.id });
      
      toast.success("Vehicles added and emails sent to new recipients!");
      onSuccess();
      onOpenChange(false);
      setSelectedDealId("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add vehicles to deal");
    },
  });

  const isSubmitting = createDealMutation.isPending || addVehiclesMutation.isPending;

  const handleAddToDeal = (dealId: string) => {
    if (newVehicleCount === 0) {
      toast.error("All selected vehicles are already in this deal");
      return;
    }
    
    if (newOwnerCount === 0) {
      toast.error("All vehicle owners have already received this deal");
      return;
    }

    addVehiclesMutation.mutate({
      dealId,
      vehicleIds: selectedVehicleIds,
      recipientIds: vehicleOwners.map((o) => o.id),
    });
  };

  const handleSubmit = form.handleSubmit(
    (data) => {
      
      // For new deals - validate name is provided
      if (!data.name || data.name.trim() === "") {
        toast.error("Deal name is required");
        return;
      }
      
      if (vehicleOwners.length === 0) {
        toast.error("No vehicle owners found");
        return;
      }

      // Create new deal
      createDealMutation.mutate({
        name: data.name!,
        description: data.description,
        vehicleIds: selectedVehicleIds,
        recipientIds: vehicleOwners.map((o) => o.id),
      });
    },
    (errors) => {
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Send Deal to Vehicle Owners</DialogTitle>
          <DialogDescription>
            {isCalculating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Calculating recipients...
              </span>
            ) : (
              <>
                Sending {selectedVehicleIds.length} vehicle{selectedVehicleIds.length !== 1 ? "s" : ""} to {newOwnerCount} owner{newOwnerCount !== 1 ? "s" : ""}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">
              Add to Existing Deal
              {dealsData?.deals && dealsData.deals.length > 0 && (
                <Badge variant="secondary" className="ml-2">{dealsData.deals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="new">
              <Plus className="h-4 w-4 mr-1" />
              Create New Deal
            </TabsTrigger>
          </TabsList>

          {/* Existing Deals Tab */}
          <TabsContent value="existing" className="space-y-4">
            {isLoadingDeals ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-lg border-2 border-dashed animate-pulse bg-muted/20" />
                ))}
              </div>
            ) : dealsData?.deals && dealsData.deals.length > 0 ? (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {dealsData.deals.map((deal: any) => {
                  // Calculate stats when this deal is selected
                  const isSelected = selectedDealId === deal.id;
                  
                  // Show stats from the selected deal state if this deal is selected
                  const showNewStats = isSelected && selectedDealId === deal.id;
                  
                  return (
                    <div
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                        isSelected ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{deal.name}</h4>
                          {deal.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {deal.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {deal._count.vehicles} vehicle{deal._count.vehicles !== 1 ? "s" : ""}
                              </Badge>
                              {isSelected && (
                                isCalculating ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    calculating...
                                  </Badge>
                                ) : newVehicleCount > 0 ? (
                                  <Badge variant="default" className="bg-green-600">
                                    +{newVehicleCount} new
                                  </Badge>
                                ) : null
                              )}
                            </div>
                            <Separator orientation="vertical" className="h-5" />
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {deal._count.recipients} owner{deal._count.recipients !== 1 ? "s" : ""}
                              </Badge>
                              {isSelected && (
                                isCalculating ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    calculating...
                                  </Badge>
                                ) : newOwnerCount > 0 ? (
                                  <Badge variant="default" className="bg-green-600">
                                    +{newOwnerCount} new
                                  </Badge>
                                ) : null
                              )}
                            </div>
                          </div>
                          {showNewStats && !isCalculating && (newVehicleCount === 0 || newOwnerCount === 0) && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {newVehicleCount === 0 
                                ? "All selected vehicles are already in this deal"
                                : "All vehicle owners have already received this deal"}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToDeal(deal.id);
                            }}
                            disabled={isSubmitting || isCalculating || newVehicleCount === 0 || newOwnerCount === 0}
                            className="flex-shrink-0"
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Add & Send
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No active deals available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new deal in the next tab
                </p>
              </div>
            )}
          </TabsContent>

          {/* New Deal Tab */}
          <TabsContent value="new" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Deal Name */}
              <div>
                <Label htmlFor="dealName">Deal Name *</Label>
                <Input
                  id="dealName"
                  placeholder="e.g., Classic Cars Collection - March 2025"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Deal Description */}
              <div>
                <Label htmlFor="dealDescription">Description (Optional)</Label>
                <Textarea
                  id="dealDescription"
                  placeholder="Add details about this job offer..."
                  rows={3}
                  {...form.register("description")}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isCalculating || vehicleOwners.length === 0}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating & Sending...
                    </>
                  ) : isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create & Send Deal
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

