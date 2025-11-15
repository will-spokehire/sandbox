"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, CheckCircle2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { PhoneInput } from "~/components/ui/phone-input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { api } from "~/trpc/react";
import { useRequireAuth } from "~/providers/auth-provider";
import { enquiryFormSchema, type EnquiryFormData } from "~/lib/schemas/enquiry";
import { LAYOUT_CONSTANTS, TYPOGRAPHY } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { trackEvent } from "~/lib/analytics";

/**
 * Enquiry Form Content Component
 * Wrapped in Suspense to handle useSearchParams
 */
function EnquiryFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const utils = api.useUtils();
  
  // Track if enquiry started event has been fired (prevent duplicates in Strict Mode)
  const hasTrackedEnquiryStartRef = useRef(false);
  
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
      // Check if ALL required fields are filled
      const hasAllRequiredFields = user.firstName && user.lastName && user.email && user.phone;
      
      // Use reset instead of setValue to properly update all fields including phone
      form.reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        company: user.company ?? "",
        dealType: form.getValues("dealType") || "PRODUCTION",
        date: form.getValues("date") || "",
        time: form.getValues("time") || "",
        location: form.getValues("location") || "",
        brief: form.getValues("brief") || "",
        vehicleId: vehicleIdFromUrl ?? undefined,
      });
      
      // If all required user data is pre-filled, start in preview mode
      if (hasAllRequiredFields) {
        setIsEditingPersonalInfo(false);
      } else {
        setIsEditingPersonalInfo(true);
      }
    } else {
      // No user data, start in edit mode
      setIsEditingPersonalInfo(true);
    }
  }, [user, form, vehicleIdFromUrl]);
  
  // Track enquiry started on mount (only once to prevent duplicates in Strict Mode)
  useEffect(() => {
    if (!hasTrackedEnquiryStartRef.current) {
      hasTrackedEnquiryStartRef.current = true;
      trackEvent('enquiry_started', {
        hasVehicle: !!vehicleIdFromUrl,
        vehicleId: vehicleIdFromUrl ?? undefined,
      });
    }
  }, [vehicleIdFromUrl]);

  // Create enquiry mutation
  const createEnquiryMutation = api.deal.createUserEnquiry.useMutation({
    onSuccess: async () => {
      toast.success("Enquiry submitted successfully!");
      // Invalidate auth cache to refresh user data for next enquiry
      await utils.auth.invalidate();
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
    
    // Track enquiry submission
    trackEvent('enquiry_submitted', {
      dealType: data.dealType,
      hasVehicle: !!data.vehicleId,
      vehicleId: data.vehicleId,
    });
    
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
    <>
      {/* Header with background (like app pages) */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className={cn(LAYOUT_CONSTANTS.container, "py-6 md:py-8 max-w-3xl")}>
          {vehicleIdFromUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/vehicles/${vehicleIdFromUrl}`)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vehicle
            </Button>
          )}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Make an Enquiry
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-2">
            Tell us about your requirements and we'll get back to you soon
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(LAYOUT_CONSTANTS.container, LAYOUT_CONSTANTS.pageSpacing, "max-w-3xl")}>
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
                  <Label htmlFor="date">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    {...form.register("date")}
                    disabled={isSubmitting}
                    placeholder="e.g., Jan 15, 2025"
                  />
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">
                    Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    {...form.register("time")}
                    disabled={isSubmitting}
                    placeholder="e.g., 9:00 AM"
                  />
                  {form.formState.errors.time && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.time.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  {...form.register("location")}
                  disabled={isSubmitting}
                  placeholder="e.g., Studio 51, London"
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brief">
                  Brief <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="brief"
                  {...form.register("brief")}
                  disabled={isSubmitting}
                  placeholder="Describe your requirements..."
                  rows={5}
                />
                {form.formState.errors.brief && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.brief.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Provide as much detail as possible about your requirements
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information Section */}
          <Card>
            <CardHeader className={cn(!isEditingPersonalInfo && "pb-4")}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={cn(!isEditingPersonalInfo && "text-base")}>Personal Information</CardTitle>
                  {isEditingPersonalInfo && (
                    <CardDescription>
                      Your contact details
                    </CardDescription>
                  )}
                </div>
                {!isEditingPersonalInfo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingPersonalInfo(true)}
                    disabled={isSubmitting}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className={cn(!isEditingPersonalInfo ? "pt-0" : "space-y-4")}>
              {!isEditingPersonalInfo ? (
                // Compact Preview Mode
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">
                      {form.watch("firstName")} {form.watch("lastName")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{form.watch("email")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">
                      {(() => {
                        const phone = form.watch("phone");
                        // Handle empty or just country code cases
                        if (!phone || phone.trim() === "" || phone === "+44") {
                          return "—";
                        }
                        // Display phone as-is if it already starts with +
                        if (phone.startsWith("+")) {
                          return phone;
                        }
                        // Add +44 prefix if it doesn't have it
                        return `+44 ${phone}`;
                      })()}
                    </span>
                  </div>
                  {form.watch("company") && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Company:</span>
                      <span className="font-medium">{form.watch("company")}</span>
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode
                <>
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
                        <p className="text-sm text-red-500">
                          {form.formState.errors.phone.message}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        For UK numbers, enter without the leading 0 (e.g., 7123 456789)
                      </p>
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
                </>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Submit Section */}
          <div className="flex justify-end gap-4">
            {vehicleIdFromUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/vehicles/${vehicleIdFromUrl}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
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
    </>
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

