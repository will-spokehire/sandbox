"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRequireAuth } from "~/providers/auth-provider";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import {
  WizardLayout,
  ProfileStep,
  BasicInfoStep,
  TechnicalDetailsStep,
  VehicleDetailsStep,
  MediaStep,
  isProfileComplete,
  type ProfileFormData,
  type BasicInfoFormData,
  type BasicInfoSubmitData,
  type TechnicalDetailsFormData,
  type TechnicalDetailsSubmitData,
  type VehicleDetailsFormData,
  type VehicleDetailsSubmitData,
} from "./_components";

// Storage keys for auto-save
const STORAGE_KEY_PREFIX = "vehicle_wizard_";
const PROFILE_KEY = `${STORAGE_KEY_PREFIX}profile`;
const BASIC_INFO_KEY = `${STORAGE_KEY_PREFIX}basic_info`;
const TECHNICAL_DETAILS_KEY = `${STORAGE_KEY_PREFIX}technical_details`;
const VEHICLE_DETAILS_KEY = `${STORAGE_KEY_PREFIX}vehicle_details`;
const CURRENT_STEP_KEY = `${STORAGE_KEY_PREFIX}current_step`;

/**
 * Add Vehicle Wizard Page
 * 
 * Multi-step form for adding a new vehicle:
 * 1. Profile completion (if needed)
 * 2. Basic vehicle information (Make, Model, Year, Registration, Price)
 * 3. Technical details (Engine, Seats, Steering, Gearbox, Colors, Condition)
 * 4. Vehicle details (Name, Description, Collections) - creates vehicle here
 * 5. Photos (with success dialog and redirect)
 */
export default function AddVehiclePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const utils = api.useUtils();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<Partial<ProfileFormData>>({});
  const [basicInfoData, setBasicInfoData] = useState<Partial<BasicInfoSubmitData>>({});
  const [technicalDetailsData, setTechnicalDetailsData] = useState<Partial<TechnicalDetailsSubmitData>>({});
  const [vehicleDetailsData, setVehicleDetailsData] = useState<Partial<VehicleDetailsSubmitData>>({});
  const [createdVehicleId, setCreatedVehicleId] = useState<string | null>(null);
  const [profileNeedsCompletion, setProfileNeedsCompletion] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasDraftData, setHasDraftData] = useState(false);
  const [registrationErrorDialog, setRegistrationErrorDialog] = useState<{
    vehicleId: string;
    vehicleName: string;
    isOwnVehicle: boolean;
  } | null>(null);
  
  // Track if profile was just completed to prevent re-initialization
  const justCompletedProfileRef = useRef(false);

  // Fetch filter options for labels
  const { data: filterOptions } = api.userVehicle.getFilterOptions.useQuery();
  
  // Fetch models for the selected make (for auto-generating vehicle name)
  const { data: modelsForName } = api.userVehicle.getModelsByMake.useQuery(
    { makeId: basicInfoData.makeId ?? "" },
    { enabled: !!basicInfoData.makeId }
  );

  // Create vehicle mutation
  const createVehicleMutation = api.userVehicle.createMyVehicle.useMutation({
    onSuccess: (vehicle) => {
      toast.success("Vehicle created successfully!");
      setCreatedVehicleId(vehicle.id);
      
      // Invalidate caches to ensure new make/model appears in lists
      void utils.userVehicle.myVehicles.invalidate();
      void utils.userVehicle.myVehicleCounts.invalidate();
      void utils.userVehicle.getFilterOptions.invalidate();
      void utils.userVehicle.getModelsByMake.invalidate();
      
      // Clear saved data from sessionStorage
      clearStoredData();
      
      // IMPORTANT: Clear React state to prevent auto-save from re-saving
      setProfileData({});
      setBasicInfoData({});
      setTechnicalDetailsData({});
      setVehicleDetailsData({});
      
      // Move to media step (use functional update to get latest value)
      setCurrentStep((prev) => prev + 1);
    },
    onError: (error) => {
      // Try to parse registration error
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.code === "REGISTRATION_EXISTS") {
          setRegistrationErrorDialog({
            vehicleId: errorData.vehicleId,
            vehicleName: errorData.vehicleName,
            isOwnVehicle: errorData.isOwnVehicle,
          });
          return;
        }
      } catch {
        // Not a JSON error, fall through to default handling
      }

      toast.error("Failed to create vehicle", {
        description: error.message,
      });
    },
  });

  // Initialize wizard state on mount
  useEffect(() => {
    if (!user || isAuthLoading) return;

    // Skip re-initialization if profile was just completed
    if (justCompletedProfileRef.current) {
      justCompletedProfileRef.current = false;
      return;
    }

    // Check if profile is complete
    const needsProfile = !isProfileComplete({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      postcode: user.postcode,
    });

    setProfileNeedsCompletion(needsProfile);

    // Check if we're returning from a completed creation (no saved data means fresh start)
    const hasSavedData = sessionStorage.getItem(BASIC_INFO_KEY) || 
                         sessionStorage.getItem(TECHNICAL_DETAILS_KEY);
    
    setHasDraftData(!!hasSavedData);
    
    if (!hasSavedData) {
      // Fresh start - clear everything to be safe
      clearStoredData();
      
      // Pre-fill profile with user data if available
      if (user) {
        setProfileData({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phone: user.phone ?? "",
          street: user.street ?? "",
          city: user.city ?? "",
          county: user.county ?? "",
          postcode: user.postcode ?? "",
          countryId: user.countryId ?? "",
        });
      }
      
      setIsInitialized(true);
      return;
    }

    // Load saved data from sessionStorage (user is in middle of wizard)
    try {
      const savedProfile = sessionStorage.getItem(PROFILE_KEY);
      const savedBasicInfo = sessionStorage.getItem(BASIC_INFO_KEY);
      const savedTechnicalDetails = sessionStorage.getItem(TECHNICAL_DETAILS_KEY);
      const savedVehicleDetails = sessionStorage.getItem(VEHICLE_DETAILS_KEY);
      const savedStep = sessionStorage.getItem(CURRENT_STEP_KEY);

      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      } else if (user) {
        // Pre-fill with existing user data
        setProfileData({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phone: user.phone ?? "",
          street: user.street ?? "",
          city: user.city ?? "",
          county: user.county ?? "",
          postcode: user.postcode ?? "",
          countryId: user.countryId ?? "",
        });
      }

      if (savedBasicInfo) {
        const parsed = JSON.parse(savedBasicInfo);
        // Ensure price is a number if present
        setBasicInfoData({
          ...parsed,
          price: parsed.price !== undefined ? Number(parsed.price) : undefined,
        });
      }
      if (savedTechnicalDetails) {
        const parsed = JSON.parse(savedTechnicalDetails);
        // Ensure engineCapacity is a number
        setTechnicalDetailsData({
          ...parsed,
          engineCapacity: Number(parsed.engineCapacity),
        });
      }
      if (savedVehicleDetails) {
        setVehicleDetailsData(JSON.parse(savedVehicleDetails));
      }
      if (savedStep) {
        const step = parseInt(savedStep);
        // Start at profile step if needed, otherwise skip it
        if (needsProfile) {
          setCurrentStep(Math.min(step, 0));
        } else {
          setCurrentStep(Math.max(step, 1)); // Skip profile step
        }
      } else if (!needsProfile) {
        setCurrentStep(1); // Skip profile step if not needed
      }
    } catch (error) {
      console.error("Failed to load saved wizard data:", error);
      // On error, clear corrupted data
      clearStoredData();
    }

    setIsInitialized(true);
  }, [user, isAuthLoading]);

  // Auto-save data to sessionStorage
  useEffect(() => {
    if (!isInitialized) return;
    
    // Don't auto-save if we're on the media step (vehicle already created)
    const mediaStep = profileNeedsCompletion ? 4 : 3;
    if (currentStep === mediaStep) return;

    try {
      if (Object.keys(profileData).length > 0) {
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
      }
      if (Object.keys(basicInfoData).length > 0) {
        sessionStorage.setItem(BASIC_INFO_KEY, JSON.stringify(basicInfoData));
      }
      if (Object.keys(technicalDetailsData).length > 0) {
        sessionStorage.setItem(TECHNICAL_DETAILS_KEY, JSON.stringify(technicalDetailsData));
      }
      if (Object.keys(vehicleDetailsData).length > 0) {
        sessionStorage.setItem(VEHICLE_DETAILS_KEY, JSON.stringify(vehicleDetailsData));
      }
      sessionStorage.setItem(CURRENT_STEP_KEY, currentStep.toString());
      
      // Update draft data flag
      const hasSavedData = sessionStorage.getItem(BASIC_INFO_KEY) || 
                           sessionStorage.getItem(TECHNICAL_DETAILS_KEY);
      setHasDraftData(!!hasSavedData);
    } catch (error) {
      console.error("Failed to save wizard data:", error);
    }
  }, [profileData, basicInfoData, technicalDetailsData, vehicleDetailsData, currentStep, isInitialized, profileNeedsCompletion]);

  const clearStoredData = () => {
    sessionStorage.removeItem(PROFILE_KEY);
    sessionStorage.removeItem(BASIC_INFO_KEY);
    sessionStorage.removeItem(TECHNICAL_DETAILS_KEY);
    sessionStorage.removeItem(VEHICLE_DETAILS_KEY);
    sessionStorage.removeItem(CURRENT_STEP_KEY);
    setHasDraftData(false);
  };

  const handleDeleteDraft = () => {
    if (confirm("Are you sure you want to delete your draft? This cannot be undone.")) {
      clearStoredData();
      // Reset all form data
      setProfileData({});
      setBasicInfoData({});
      setTechnicalDetailsData({});
      setVehicleDetailsData({});
      setCurrentStep(profileNeedsCompletion ? 0 : 0);
      toast.success("Draft deleted");
      // Refresh the page to reset state
      router.push("/user/vehicles/new");
    }
  };

  // Define steps based on whether profile needs completion
  const steps = profileNeedsCompletion
    ? [
        { number: 0, title: "Profile", description: "Your details" },
        { number: 1, title: "Basic Info", description: "Vehicle basics" },
        { number: 2, title: "Technical", description: "Specifications" },
        { number: 3, title: "Details", description: "Name & tags" },
        { number: 4, title: "Photos", description: "Add images" },
      ]
    : [
        { number: 0, title: "Basic Info", description: "Vehicle basics" },
        { number: 1, title: "Technical", description: "Specifications" },
        { number: 2, title: "Details", description: "Name & tags" },
        { number: 3, title: "Photos", description: "Add images" },
      ];

  const totalSteps = steps.length;

  // Navigation handlers
  const handleNext = () => {
    // Trigger the current step's form submission
    if (typeof (window as any).__currentStepSubmit === 'function') {
      (window as any).__currentStepSubmit();
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleProfileComplete = () => {
    // Set flag to prevent re-initialization when user data refreshes
    justCompletedProfileRef.current = true;
    
    // Profile step handles its own submission and navigation
    // After profile completion, profileNeedsCompletion becomes false
    // In that case, Basic Info is at step 0 (not step 1!)
    // So explicitly navigate to step 0 to show Basic Info
    setCurrentStep(0);
  };

  const handleBasicInfoComplete = (data: BasicInfoSubmitData) => {
    setBasicInfoData(data);
    setCurrentStep(currentStep + 1);
  };

  const handleTechnicalDetailsComplete = (data: TechnicalDetailsSubmitData) => {
    setTechnicalDetailsData(data);
    setCurrentStep(currentStep + 1);
  };

  const handleVehicleDetailsComplete = (data: VehicleDetailsSubmitData) => {
    setVehicleDetailsData(data);
    
    // Create the vehicle after vehicle details are complete
    // Combine all previous step data with vehicle details for vehicle creation
    const fullData = {
      makeId: basicInfoData.makeId!,
      modelId: basicInfoData.modelId!,
      year: basicInfoData.year!,
      registration: basicInfoData.registration!,
      price: basicInfoData.price,
      engineCapacity: technicalDetailsData.engineCapacity!,
      numberOfSeats: technicalDetailsData.numberOfSeats!,
      steeringId: technicalDetailsData.steeringId!,
      gearbox: technicalDetailsData.gearbox!,
      exteriorColour: technicalDetailsData.exteriorColour!,
      interiorColour: technicalDetailsData.interiorColour!,
      condition: technicalDetailsData.condition!,
      isRoadLegal: technicalDetailsData.isRoadLegal!,
      name: data.name,
      description: data.description,
      collectionIds: data.collectionIds,
    };

    createVehicleMutation.mutate(fullData);
  };

  const handleMediaComplete = () => {
    // Redirect to vehicle detail page
    if (createdVehicleId) {
      router.push(`/user/vehicles/${createdVehicleId}`);
    }
  };

  // Don't render until initialized
  if (!isInitialized || isAuthLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render appropriate step
  const renderStep = () => {
    // Profile step (only if needed)
    if (profileNeedsCompletion && currentStep === 0) {
      // Create a key that changes to force remount when navigating back
      const profileKey = `profile-${user?.id}-${user?.firstName}-${user?.lastName}`;
      
      return (
        <ProfileStep
          key={profileKey}
          onComplete={handleProfileComplete}
          defaultValues={{
            firstName: user?.firstName ?? "",
            lastName: user?.lastName ?? "",
            phone: user?.phone ?? "",
            street: user?.street ?? "",
            city: user?.city ?? "",
            county: user?.county ?? "",
            postcode: user?.postcode ?? "",
            countryId: user?.countryId ?? "",
          }}
        />
      );
    }

    // Basic info step
    const basicInfoStep = profileNeedsCompletion ? 1 : 0;
    if (currentStep === basicInfoStep) {
      return (
        <BasicInfoStep
          onComplete={handleBasicInfoComplete}
          defaultValues={basicInfoData}
        />
      );
    }

    // Technical details step
    const technicalStep = profileNeedsCompletion ? 2 : 1;
    if (currentStep === technicalStep) {
      return (
        <TechnicalDetailsStep
          onComplete={handleTechnicalDetailsComplete}
          defaultValues={technicalDetailsData}
        />
      );
    }

    // Vehicle details step (Name, Description, Collections)
    const vehicleDetailsStep = profileNeedsCompletion ? 3 : 2;
    if (currentStep === vehicleDetailsStep) {
      // Generate auto name from basic info
      const makeName = (filterOptions?.makes as any[] | undefined)?.find((m: any) => m.id === basicInfoData.makeId)?.name;
      const modelName = (modelsForName as any[] | undefined)?.find((m: any) => m.id === basicInfoData.modelId)?.name;
      const autoGeneratedName = 
        makeName && modelName && basicInfoData.year
          ? `${makeName} ${modelName} ${basicInfoData.year}`
          : undefined;

      // Prepare vehicle data for AI generation (only if all required data is available)
      const vehicleData = 
        basicInfoData.makeId && 
        basicInfoData.modelId && 
        basicInfoData.year && 
        basicInfoData.price &&
        technicalDetailsData.engineCapacity &&
        technicalDetailsData.numberOfSeats &&
        technicalDetailsData.steeringId &&
        technicalDetailsData.gearbox &&
        technicalDetailsData.exteriorColour &&
        technicalDetailsData.interiorColour &&
        typeof technicalDetailsData.isRoadLegal === 'boolean'
          ? {
              makeId: basicInfoData.makeId,
              modelId: basicInfoData.modelId,
              year: basicInfoData.year,
              price: basicInfoData.price,
              engineCapacity: technicalDetailsData.engineCapacity,
              numberOfSeats: technicalDetailsData.numberOfSeats,
              steeringId: technicalDetailsData.steeringId,
              gearbox: technicalDetailsData.gearbox,
              exteriorColour: technicalDetailsData.exteriorColour,
              interiorColour: technicalDetailsData.interiorColour,
              isRoadLegal: technicalDetailsData.isRoadLegal,
            }
          : undefined;

      return (
        <VehicleDetailsStep
          onComplete={handleVehicleDetailsComplete}
          defaultValues={vehicleDetailsData}
          autoGeneratedName={autoGeneratedName}
          vehicleData={vehicleData}
        />
      );
    }

    // Media step (after vehicle is created)
    if (isMediaStep && createdVehicleId) {
      return (
        <MediaStep
          vehicleId={createdVehicleId}
          onComplete={handleMediaComplete}
        />
      );
    }

    return null;
  };

  // Determine navigation button state
  const mediaStep = profileNeedsCompletion ? 4 : 3;
  const isMediaStep = currentStep === mediaStep;
  
  const canGoBack = currentStep > 0 && !isMediaStep;
  const canGoNext = !isMediaStep; // Allow "next" on all steps except media (media step has its own continue button)
  
  const nextButtonText = "Next";

  return (
    <>
      <WizardLayout
        currentStep={currentStep}
        totalSteps={totalSteps}
        steps={steps}
        onBack={handleBack}
        onNext={handleNext}
        canGoBack={canGoBack}
        canGoNext={canGoNext}
        nextButtonText={nextButtonText}
        isLoading={createVehicleMutation.isPending}
        autoSaved={isInitialized}
        hasDraftData={hasDraftData}
        onDeleteDraft={handleDeleteDraft}
      >
        {renderStep()}
      </WizardLayout>

      {/* Registration Error Dialog */}
      <Dialog open={!!registrationErrorDialog} onOpenChange={() => setRegistrationErrorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registration Number Already Exists</DialogTitle>
            <DialogDescription>
              {registrationErrorDialog?.isOwnVehicle ? (
                <>
                  You already have a vehicle with this registration: <strong>{registrationErrorDialog.vehicleName}</strong>
                </>
              ) : (
                <>
                  This registration is already in use. If this is your vehicle, please contact support.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistrationErrorDialog(null)}>
              Close
            </Button>
            {registrationErrorDialog?.isOwnVehicle && (
              <Button onClick={() => router.push(`/user/vehicles/${registrationErrorDialog.vehicleId}?from=registration`)}>
                View This Vehicle
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

