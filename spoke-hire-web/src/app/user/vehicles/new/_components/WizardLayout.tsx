"use client";

import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { ProgressStepper } from "./ProgressStepper";

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  steps: Array<{ number: number; title: string; description?: string }>;
  stepTitle?: string;
  stepDescription?: string;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextButtonText?: string;
  isLoading?: boolean;
  autoSaved?: boolean;
  hasDraftData?: boolean;
  onDeleteDraft?: () => void;
}

/**
 * Wizard Layout Component
 * 
 * Provides consistent layout for all wizard steps with:
 * - Progress indicator
 * - Form container
 * - Navigation buttons
 * - Auto-save indicator
 */
export function WizardLayout({
  children,
  currentStep,
  totalSteps,
  steps,
  stepTitle,
  stepDescription,
  onBack,
  onNext,
  onSubmit,
  canGoBack = true,
  canGoNext = true,
  nextButtonText = "Next",
  isLoading = false,
  autoSaved = false,
  hasDraftData = false,
  onDeleteDraft,
}: WizardLayoutProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Wizard Header - Match Figma design */}
      <div className="bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] py-[41px]">
          <div className="w-full max-w-[808px] flex flex-col items-center gap-20 md:gap-[80px]">
            {/* Main Title */}
            <div className="w-full flex flex-col items-center gap-[11px] text-center">
              <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
                Add your vehicle
              </h1>
            </div>

            {/* Progress Stepper and Step Title Section */}
            <div className="w-full flex flex-col gap-6 items-center">
              {/* Progress Stepper */}
              <ProgressStepper steps={steps} currentStep={currentStep} />
              
              {/* Step-specific Title and Description */}
              {stepTitle && (
                <div className="w-full flex flex-col gap-3 items-center text-center">
                  <h2 className="text-[32px] md:text-[40px] font-normal leading-[0.95] uppercase text-black tracking-[-0.4px]">
                    {stepTitle}
                  </h2>
                  {stepDescription && (
                    <p className="text-[18px] md:text-[22px] font-normal leading-[1.3] text-black tracking-[-0.22px]">
                      {stepDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] py-[41px]">
          <div className="w-full max-w-[808px] flex flex-col gap-10">
            {/* Form Content */}
            <div className="w-full">{children}</div>

            {/* Navigation Buttons - Hide on media step as it has its own button */}
            {canGoNext && (
              <div className="w-full flex items-center justify-center">
                <Button
                  type="button"
                  onClick={isLastStep ? onSubmit : onNext}
                  disabled={!canGoNext || isLoading}
                  className="w-full max-w-[480px]"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    nextButtonText.toLowerCase()
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

