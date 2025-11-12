/**
 * Make Edit Dialog Component
 * 
 * Dialog for editing make details.
 */

"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { api } from "~/trpc/react";
import type { MakeWithCount } from "~/server/types";

const makeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isPublished: z.boolean(),
});

type MakeFormValues = z.infer<typeof makeFormSchema>;

interface MakeEditDialogProps {
  make: MakeWithCount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MakeEditDialog({
  make,
  open,
  onOpenChange,
  onSuccess,
}: MakeEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();
  
  const isCreating = !make?.id;

  const createMakeMutation = api.make.create.useMutation({
    onSuccess: () => {
      toast.success("Make created successfully");
      void utils.make.list.invalidate();
      setIsSubmitting(false);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create make: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const updateMakeMutation = api.make.update.useMutation({
    onSuccess: () => {
      toast.success("Make updated successfully");
      void utils.make.list.invalidate();
      setIsSubmitting(false);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update make: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const form = useForm<MakeFormValues>({
    resolver: zodResolver(makeFormSchema),
    defaultValues: {
      name: "",
      description: null,
      isPublished: true,
    },
  });

  // Reset form when make changes
  useEffect(() => {
    if (make) {
      form.reset({
        name: make.name,
        description: make.description,
        isPublished: make.isPublished,
      });
      setIsSubmitting(false); // Reset submitting state
    }
  }, [make, form]);

  const onSubmit = async (data: MakeFormValues) => {
    setIsSubmitting(true);
    
    // Convert empty strings to null for nullable fields
    const payload = {
      ...data,
      description: data.description || null,
    };

    if (isCreating) {
      createMakeMutation.mutate(payload);
    } else {
      updateMakeMutation.mutate({
        id: make.id,
        ...payload,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Create Make" : "Edit Make"}</DialogTitle>
          <DialogDescription>
            {isCreating ? "Create a new vehicle make." : "Update the details of this vehicle make."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="BMW" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Published</FormLabel>
                    <FormDescription>
                      Visible to all users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isCreating ? "Creating..." : "Saving...") : (isCreating ? "Create Make" : "Save Changes")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

