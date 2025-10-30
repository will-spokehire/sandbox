"use client";

import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface Step {
  number: number;
  title: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
}

/**
 * Progress Stepper Component
 * 
 * Visual indicator showing the user's progress through the wizard.
 * Shows step numbers, titles, and completion status.
 * Responsive: horizontal on desktop, compact on mobile.
 */
export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop view: Horizontal stepper - Centralized */}
      <div className="hidden md:flex md:justify-center">
        <div className="flex items-center">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <div key={step.number} className="flex items-center">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "border-primary text-primary bg-primary/10",
                      isUpcoming && "border-muted-foreground text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{step.number + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center min-w-[80px]">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-primary",
                        isUpcoming && "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="w-16 h-0.5 mx-4 mb-8">
                    <div
                      className={cn(
                        "h-full transition-colors",
                        currentStep > step.number
                          ? "bg-primary"
                          : "bg-muted"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile view: Compact progress indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </p>
            <p className="text-lg font-semibold">
              {steps[currentStep]?.title}
            </p>
          </div>
        </div>
        {/* Single progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

