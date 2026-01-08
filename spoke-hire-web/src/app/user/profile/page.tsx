"use client";

import { useCallback, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRequireAuth } from "~/providers/auth-provider";
import { api } from "~/trpc/react";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { ProfileForm, ProfilePreview } from "~/app/_components/shared";
import type { ProfileFormData } from "../vehicles/new/_components/validation";
import { TYPOGRAPHY } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

/**
 * User Profile Page
 * 
 * Allows users to view and edit their profile information including:
 * - Name and contact details
 * - Address with postcode lookup
 * - Geo location data
 */
export default function UserProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const utils = api.useUtils();
  const isSubmittingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile update mutation
  const updateProfileMutation = api.userVehicle.updateMyProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      // Invalidate and refresh auth session
      await utils.auth.invalidate();
      isSubmittingRef.current = false;
      // Return to preview mode
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
      isSubmittingRef.current = false;
    },
  });

  // Submit handler
  const handleSubmit = useCallback((data: ProfileFormData & { latitude?: number; longitude?: number }) => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    updateProfileMutation.mutate(data);
  }, [updateProfileMutation]);

  // Memoize default values to prevent unnecessary re-renders
  const defaultValues = useMemo(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    street: user?.street ?? "",
    city: user?.city ?? "",
    county: user?.county ?? "",
    postcode: user?.postcode ?? "",
    countryId: user?.countryId ?? "",
  }), [
    user?.firstName,
    user?.lastName,
    user?.phone,
    user?.street,
    user?.city,
    user?.county,
    user?.postcode,
    user?.countryId,
  ]);

  // Loading state
  if (isAuthLoading) {
    return (
      <>
        {/* Header */}
        <div className="bg-white">
          <div className="w-full flex flex-col items-center px-4 md:px-[30px] pt-[41px] pb-[20px]">
            <div className="w-full max-w-[808px] flex flex-col items-center gap-[11px]">
              <Skeleton className="h-16 md:h-24 w-64 md:w-96" />
              <Skeleton className="h-4 w-48 md:w-72" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-white">
          <div className="w-full flex flex-col items-center px-4 md:px-[30px] pt-[20px] pb-[41px]">
            <div className="w-full max-w-[808px] flex flex-col gap-10">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header - Match Figma design */}
      <div className="bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] pt-[41px] pb-[20px]">
          <div className="w-full max-w-[808px] flex flex-col items-center gap-[11px] text-center">
            {/* Main Title */}
            <h1 className={cn(TYPOGRAPHY.heroTitle, "text-black")}>
              My Profile
            </h1>
            <p className={cn(TYPOGRAPHY.pageDescription, "text-black")}>
              {isEditing 
                ? "Update your personal information and contact details"
                : "View your personal information and contact details"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] pt-[20px] pb-[41px]">
          <div className="w-full max-w-[808px] flex flex-col gap-10">
            {isEditing ? (
              <Card>
                <CardContent className="pt-6">
                  <ProfileForm
                    defaultValues={defaultValues}
                    onSubmit={handleSubmit}
                    isSubmitting={updateProfileMutation.isPending}
                    submitButtonText="Save Changes"
                    showCancelButton
                    onCancel={() => setIsEditing(false)}
                  />
                </CardContent>
              </Card>
            ) : (
              <ProfilePreview
                profile={{
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  email: user?.email,
                  phone: user?.phone,
                  street: user?.street,
                  city: user?.city,
                  county: user?.county,
                  postcode: user?.postcode,
                  countryName: user?.country?.name,
                }}
                onEditClick={() => setIsEditing(true)}
              />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
