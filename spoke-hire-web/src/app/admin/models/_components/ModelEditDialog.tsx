/**
 * Model Edit Dialog Component
 * 
 * Dialog for editing model details.
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
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import type { ModelWithDetails } from "~/server/types";

const modelFormSchema = z.object({
  makeId: z.string().min(1, "Make is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  isPublished: z.boolean(),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

interface ModelEditDialogProps {
  model: ModelWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ModelEditDialog({
  model,
  open,
  onOpenChange,
  onSuccess,
}: ModelEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = api.useUtils();
  
  const isCreating = !model?.id;

  // Fetch makes for the dropdown
  const { data: makesData } = api.make.list.useQuery(
    {
      limit: 1000,
      sortBy: "name",
      sortOrder: "asc",
    },
    {
      enabled: isCreating && open,
    }
  );

  const makes = makesData?.makes ?? [];

  const createModelMutation = api.model.create.useMutation({
    onSuccess: () => {
      toast.success("Model created successfully");
      void utils.model.list.invalidate();
      setIsSubmitting(false);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to create model: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const updateModelMutation = api.model.update.useMutation({
    onSuccess: () => {
      toast.success("Model updated successfully");
      void utils.model.list.invalidate();
      setIsSubmitting(false);
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update model: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const form = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      makeId: "",
      name: "",
      description: null,
      isPublished: true,
    },
  });

  // Reset form when model changes
  useEffect(() => {
    if (model?.id) {
      form.reset({
        makeId: model.makeId,
        name: model.name,
        description: model.description,
        isPublished: model.isPublished,
      });
      setIsSubmitting(false);
    } else if (isCreating) {
      form.reset({
        makeId: "",
        name: "",
        description: null,
        isPublished: true,
      });
      setIsSubmitting(false);
    }
  }, [model, form, isCreating]);

  const onSubmit = async (data: ModelFormValues) => {
    setIsSubmitting(true);
    
    // Convert empty strings to null for nullable fields
    const payload = {
      ...data,
      description: data.description || null,
    };

    if (isCreating) {
      createModelMutation.mutate(payload);
    } else {
      updateModelMutation.mutate({
        id: model.id,
        name: payload.name,
        description: payload.description,
        isPublished: payload.isPublished,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreating ? "Create Model" : "Edit Model"}</DialogTitle>
          <DialogDescription>
            {isCreating ? "Create a new vehicle model." : "Update the details of this vehicle model."}
          </DialogDescription>
        </DialogHeader>

        {!isCreating && model && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Make:</span>
              <Badge variant="outline">{model.make.name}</Badge>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isCreating && (
              <FormField
                control={form.control}
                name="makeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a make" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {makes.map((make) => (
                          <SelectItem key={make.id} value={make.id}>
                            {make.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="3 Series" {...field} />
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
                {isSubmitting ? (isCreating ? "Creating..." : "Saving...") : (isCreating ? "Create Model" : "Save Changes")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

