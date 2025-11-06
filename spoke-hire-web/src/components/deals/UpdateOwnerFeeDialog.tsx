"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

/**
 * Validation schema for owner fee
 */
const updateFeeSchema = z.object({
  ownerRequestedFee: z
    .string()
    .transform((val) => (val === "" ? null : parseFloat(val)))
    .refine((val) => val === null || (!isNaN(val) && val >= 0 && val <= 1000000), {
      message: "Fee must be between £0 and £1,000,000",
    }),
});

type UpdateFeeFormValues = z.infer<typeof updateFeeSchema>;

interface UpdateOwnerFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleName: string;
  currentFee: number | null;
  onSubmit: (fee: number | null) => Promise<void>;
}

/**
 * Dialog for updating the owner requested fee for a vehicle in a deal
 */
export function UpdateOwnerFeeDialog({
  open,
  onOpenChange,
  vehicleName,
  currentFee,
  onSubmit,
}: UpdateOwnerFeeDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateFeeFormValues>({
    resolver: zodResolver(updateFeeSchema),
    defaultValues: {
      ownerRequestedFee: currentFee?.toString() ?? "",
    },
  });

  // Update form when dialog opens or current fee changes
  useEffect(() => {
    if (open) {
      form.reset({
        ownerRequestedFee: currentFee?.toString() ?? "",
      });
    }
  }, [open, currentFee, form]);

  // Reset form when dialog opens/closes or current fee changes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (values: UpdateFeeFormValues) => {
    setIsSubmitting(true);
    try {
      const fee = values.ownerRequestedFee === "" ? null : Number(values.ownerRequestedFee);
      await onSubmit(fee);
      handleOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Owner Fee</DialogTitle>
          <DialogDescription>
            Enter the fee requested by the owner for <strong>{vehicleName}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerRequestedFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Requested Fee (GBP)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        £
                      </span>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000000"
                        placeholder="0.00"
                        className="pl-7"
                        disabled={isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Leave empty to clear the fee. Enter amount without the £ symbol.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Fee
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

