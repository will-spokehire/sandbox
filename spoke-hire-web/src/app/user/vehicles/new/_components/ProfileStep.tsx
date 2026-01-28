"use client";

import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { ProfileForm } from "~/app/_components/shared";
import { profileSchema, type ProfileFormData } from "./validation";

interface ProfileStepProps {
  onComplete: () => void;
  defaultValues?: Partial<ProfileFormData>;
}

/**
 * Profile Step Component
 * 
 * Collects user profile information if not already complete.
 * Auto-skips if profile is already filled out.
 */
export function ProfileStep({ onComplete, defaultValues }: ProfileStepProps) {
  const utils = api.useUtils();
  const isSubmittingRef = useRef(false);

  // Profile update mutation
  const updateProfileMutation = api.userVehicle.updateMyProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully");
      // Invalidate and WAIT for auth session to refresh user data
      await utils.auth.invalidate();
      // Wait a bit more to ensure the data is refreshed
      await new Promise(resolve => setTimeout(resolve, 500));
      isSubmittingRef.current = false;
      onComplete();
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      });
      isSubmittingRef.current = false;
    },
  });

  // Submit handler wrapped in useCallback to prevent re-creation
  const handleSubmit = useCallback((data: ProfileFormData & { latitude?: number; longitude?: number }) => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    updateProfileMutation.mutate(data);
  }, [updateProfileMutation]);

  return (
    <div className="space-y-6">
      <div className="w-full flex flex-col gap-3 items-center text-center mb-6">
        <h2 className="text-[32px] md:text-[40px] font-normal leading-[0.95] uppercase text-black tracking-[-0.4px]">
          Profile Information
        </h2>
        <p className="text-[18px] md:text-[22px] font-normal leading-[1.3] text-black tracking-[-0.22px]">
          Complete your profile details
        </p>
      </div>

      <ProfileForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateProfileMutation.isPending}
        onSubmitRefReady={(submitFn) => {
          const w = window as Window & { __currentStepSubmit?: () => void };
          w.__currentStepSubmit = submitFn;
        }}
      />
    </div>
  );
}
