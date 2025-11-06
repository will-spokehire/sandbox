"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { api } from "~/trpc/react";
import { useRequireAuth } from "~/providers/auth-provider";
import { enquiryFormSchema, type EnquiryFormData } from "~/lib/schemas/enquiry";

/**
 * Enquiry Form Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function EnquiryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get vehicleId from URL if coming from vehicle page
  const vehicleIdFromUrl = searchParams.get("vehicleId");

  // Fetch vehicle details if vehicleId is provided (use public endpoint - no auth required)
  const { data: vehicle } = api.publicVehicle.getById.useQuery(
    { id: vehicleIdFromUrl! },
    { enabled: !!vehicleIdFromUrl }
  );

  // Initialize form with react-hook-form and zod validation
  const form = useForm<EnquiryFormData>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      dealType: "PRODUCTION",
      date: "",
      time: "",
      location: "",
      brief: "",
      vehicleId: vehicleIdFromUrl ?? undefined,
    },
  });

  // Pre-fill form with user data when available
  useEffect(() => {
    if (user) {
      form.setValue("firstName", user.firstName ?? "");
      form.setValue("lastName", user.lastName ?? "");
      form.setValue("email", user.email ?? "");
      form.setValue("phone", user.phone ?? "");
      form.setValue("company", user.company ?? "");
    }
  }, [user, form]);

  // Create enquiry mutation
  const createEnquiryMutation = api.deal.createUserEnquiry.useMutation({
    onSuccess: () => {
      toast.success("Enquiry submitted successfully!");
      router.push("/enquiry/success");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to submit enquiry");
      setIsSubmitting(false);
    },
  });

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await createEnquiryMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in onError callback
      console.error("Failed to submit enquiry:", error);
    }
  });

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Make an Enquiry
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Tell us about your requirements and we'll get back to you soon
          </p>
        </div>

        {/* Vehicle Info Card (if coming from vehicle page) */}
        {vehicle && (
          <Alert className="mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Vehicle selected:</span>{" "}
              {vehicle.make.name} {vehicle.model.name} {vehicle.year} - {vehicle.name}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Your contact details (pre-filled from your profile)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    {...form.register("company")}
                    disabled={isSubmitting}
                    placeholder="Optional"
                  />
                  {form.formState.errors.company && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.company.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enquiry Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Enquiry Details</CardTitle>
              <CardDescription>
                Tell us about your requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dealType">
                  Enquiry Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.watch("dealType")}
                  onValueChange={(value) => form.setValue("dealType", value as "PERSONAL_HIRE" | "PRODUCTION")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select enquiry type" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    {...form.register("date")}
                    disabled={isSubmitting}
                    placeholder="e.g., Jan 15, 2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    {...form.register("time")}
                    disabled={isSubmitting}
                    placeholder="e.g., 9:00 AM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  disabled={isSubmitting}
                  placeholder="e.g., Studio 51, London"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief">Brief</Label>
                <Textarea
                  id="brief"
                  {...form.register("brief")}
                  disabled={isSubmitting}
                  placeholder="Describe your requirements..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Provide as much detail as possible about your requirements
                </p>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Section */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Enquiry"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Enquiry Form Page
 * Public-facing enquiry submission form
 */
export default function EnquiryFormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <EnquiryFormContent />
    </Suspense>
  );
}

