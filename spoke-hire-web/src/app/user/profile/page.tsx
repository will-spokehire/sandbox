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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          My Profile
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          {isEditing 
            ? "Update your personal information and contact details"
            : "View your personal information and contact details"}
        </p>
      </div>

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
    </main>
  );
}
