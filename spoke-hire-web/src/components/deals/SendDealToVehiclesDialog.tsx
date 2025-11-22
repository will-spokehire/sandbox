"use client";

import { useEffect, useState } from "react";
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
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Checkbox } from "~/components/ui/checkbox";
import { api } from "~/trpc/react";
import { CreateEditDealDialog } from "./CreateEditDealDialog";

interface SendDealToVehiclesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicleIds: string[];
  onSuccess: () => void;
}

export function SendDealToVehiclesDialog({
  open,
  onOpenChange,
  selectedVehicleIds,
  onSuccess,
}: SendDealToVehiclesDialogProps) {
  const [_selectedDealId, setSelectedDealId] = useState<string>("");
  const [showCreateDealDialog, setShowCreateDealDialog] = useState(false);
  const [vehicleOwners, setVehicleOwners] = useState<Array<{
    id: string;
    email: string;
    name: string;
  }>>([]);
  const [newVehicleCount, setNewVehicleCount] = useState(0);
  const [newOwnerCount, setNewOwnerCount] = useState(0);
  const [sendEmails, setSendEmails] = useState(false);

  const utils = api.useUtils();

  // Fetch existing deals (only non-archived deals can have vehicles added)
  const { data: dealsData, isLoading: isLoadingDeals } = api.deal.list.useQuery(
    {
      limit: 100,
      // Don't filter by status - get all non-archived deals
    },
    {
      enabled: open,
    }
  );

  // Fetch selected deal details to check for duplicates
  const { isLoading: isLoadingSelectedDeal } = api.deal.getById.useQuery(
    {
      id: _selectedDealId,
    },
    {
      enabled: open && !!_selectedDealId,
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
        dealId: _selectedDealId,
        vehicleIds: selectedVehicleIds,
      },
      {
        enabled: open && !!_selectedDealId && selectedVehicleIds.length > 0,
      }
    );

  // Check if we're calculating counts
  const isCalculating = 
    isLoadingVehicles || 
    (!!_selectedDealId && (isLoadingSelectedDeal || isLoadingNewItems));

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setSendEmails(false); // Reset to unchecked by default
    }
  }, [open]);

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
    vehicles.vehicles.forEach((vehicle) => {
      if (vehicle.owner && !ownersMap.has(vehicle.owner.id)) {
        ownersMap.set(vehicle.owner.id, {
          id: vehicle.owner.id,
          email: vehicle.owner.email,
          name: `${vehicle.owner.firstName ?? ""} ${vehicle.owner.lastName ?? ""}`.trim() || vehicle.owner.email,
        });
      }
    });

    setVehicleOwners(Array.from(ownersMap.values()));
  }, [vehicles, open]);

  // Update counts when backend returns new items data
  useEffect(() => {
    if (newItemsData) {
      setNewVehicleCount(newItemsData.newVehicleCount);
      setNewOwnerCount(newItemsData.newOwnerCount);
    } else {
      // Default to all vehicles/owners as new
      setNewVehicleCount(selectedVehicleIds.length);
      setNewOwnerCount(vehicleOwners.length);
    }
  }, [newItemsData, selectedVehicleIds.length, vehicleOwners.length]);

  // Add vehicles to existing deal mutation
  const addVehiclesMutation = api.deal.addVehiclesToDeal.useMutation({
    onSuccess: async () => {
      await utils.deal.list.invalidate();
      await utils.deal.getById.invalidate();
      toast.success(sendEmails ? "Vehicles added to deal and emails sent!" : "Vehicles added to deal!");
      onSuccess();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add vehicles to deal");
    },
  });

  const isSubmitting = addVehiclesMutation.isPending;

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
      sendEmails,
    });
  };

  const handleCreateDealSuccess = () => {
    setShowCreateDealDialog(false);
    onSuccess();
  };

  return (
    <>
      <Dialog open={open && !showCreateDealDialog} onOpenChange={onOpenChange}>
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

          <div className="space-y-4">
            {/* Create New Deal Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowCreateDealDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Deal
            </Button>

            <Separator />

            {/* Existing Deals List */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Or add to existing deal
                {dealsData?.deals && dealsData.deals.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{dealsData.deals.length}</Badge>
                )}
              </h3>

              {isLoadingDeals ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-lg border-2 border-dashed animate-pulse bg-muted/20" />
                  ))}
                </div>
              ) : dealsData?.deals && dealsData.deals.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {dealsData.deals.map((deal) => {
                    const isSelected = _selectedDealId === deal.id;
                    const showNewStats = isSelected;
                    
                    return (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedDealId(deal.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary ${
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h4 className="font-semibold truncate">{deal.name}</h4>
                            {deal.brief && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-all">
                                {deal.brief}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {isSelected && (
                                isCalculating ? (
                                  <Badge variant="secondary" className="gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    calculating...
                                  </Badge>
                                ) : (
                                  <>
                                    {newVehicleCount > 0 && (
                                      <Badge variant="default" className="bg-green-600">
                                        +{newVehicleCount} new vehicle{newVehicleCount !== 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                    {newOwnerCount > 0 && (
                                      <Badge variant="default" className="bg-green-600">
                                        +{newOwnerCount} new owner{newOwnerCount !== 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                  </>
                                )
                              )}
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
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToDeal(deal.id);
                                }}
                                disabled={isSubmitting || isCalculating || newVehicleCount === 0 || newOwnerCount === 0}
                              >
                                {isSubmitting ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add
                                  </>
                                )}
                              </Button>
                              <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={sendEmails}
                                  onCheckedChange={(checked) => setSendEmails(checked === true)}
                                  disabled={isSubmitting || isCalculating}
                                />
                                <span className="text-muted-foreground">Send email notifications</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">No deals available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a new deal using the button above
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Deal Dialog */}
      <CreateEditDealDialog
        open={showCreateDealDialog}
        onOpenChange={(isOpen) => {
          setShowCreateDealDialog(isOpen);
          // Don't need to reopen SendDeal dialog - it's controlled by the open && !showCreateDealDialog condition
        }}
        onSuccess={handleCreateDealSuccess}
      />
    </>
  );
}
