"use client";

import type { ReactNode } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { ProgressStepper } from "./ProgressStepper";

interface WizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  steps: Array<{ number: number; title: string; description?: string }>;
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
      {/* Wizard Header - Integrates with parent layout navigation */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 md:py-6">
          {/* Page Title and Draft Actions */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                Add Your Vehicle
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Fill in the details about your vehicle
              </p>
            </div>
            {hasDraftData && onDeleteDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDeleteDraft}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Delete Draft</span>
              </Button>
            )}
          </div>

          {/* Progress Stepper */}
          <ProgressStepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-4 md:p-6 lg:p-8">
              {/* Form Content */}
              <div className="mb-6 md:mb-8">{children}</div>

              {/* Navigation Buttons - Hide on media step as it has its own button */}
              {canGoNext && (
                <div className="flex items-center justify-between gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    disabled={!canGoBack || isLoading}
                    className={cn(!canGoBack && "invisible", "min-w-[80px] md:min-w-[100px]")}
                    size="default"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={isLastStep ? onSubmit : onNext}
                    disabled={!canGoNext || isLoading}
                    className="min-w-[100px] md:min-w-[120px]"
                    size="default"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">...</span>
                      </div>
                    ) : (
                      nextButtonText
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}

