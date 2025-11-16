"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PhoneInput } from "~/components/ui/phone-input";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { isValidPhoneNumber } from "~/lib/whatsapp";

const createContactSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val),
      "Please enter a valid phone number"
    ),
});

type CreateContactForm = z.infer<typeof createContactSchema>;

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactCreated?: (contactId: string) => void;
}

/**
 * CreateContactDialog Component
 * 
 * Dialog for quickly creating a new user/contact from the deal form
 */
export function CreateContactDialog({
  open,
  onOpenChange,
  onContactCreated,
}: CreateContactDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateContactForm>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
    },
  });

  const utils = api.useUtils();
  const createContactMutation = api.user.createContact.useMutation({
    onSuccess: async (data) => {
      toast.success("Contact created successfully");
      
      // Invalidate user searches to refresh the list
      await utils.user.searchUsers.invalidate();
      
      // Notify parent component with the new contact ID
      onContactCreated?.(data.id);
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create contact");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsSubmitting(true);
    createContactMutation.mutate({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || undefined,
      phone: data.phone || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Contact</DialogTitle>
          <DialogDescription>
            Add a new client contact to the system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...form.register("email")}
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="John"
                {...form.register("firstName")}
                disabled={isSubmitting}
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...form.register("lastName")}
                disabled={isSubmitting}
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Acme Productions"
              {...form.register("company")}
              disabled={isSubmitting}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Controller
              name="phone"
              control={form.control}
              render={({ field }) => (
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="7123 456789"
                  disabled={isSubmitting}
                />
              )}
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              For UK numbers, enter without the leading 0 (e.g., 7123 456789)
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

