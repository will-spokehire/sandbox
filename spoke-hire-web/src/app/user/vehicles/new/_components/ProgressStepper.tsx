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
 * Matches Figma design with black/white styling and horizontal layout.
 * Responsive: horizontal on desktop, compact on mobile.
 */
export function ProgressStepper({ steps, currentStep }: ProgressStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop view: Horizontal stepper matching Figma */}
      <div className="hidden md:flex md:items-center md:justify-center">
        <div className="flex items-center w-full max-w-[364px]">
          {steps.map((step, index) => {
            const isCurrent = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <>
                {/* Step circle */}
                <div
                  key={`step-${step.number}`}
                  className={cn(
                    "flex items-center justify-center rounded-full border transition-all",
                    "size-[48px] shrink-0",
                    (isCurrent || isCompleted) && "bg-black border-black",
                    !isCurrent && !isCompleted && "border-black bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-white stroke-[3]" />
                  ) : (
                    <span
                      className={cn(
                        "text-[32px] font-medium leading-[0.8] tracking-[-0.32px] uppercase pb-[4px]",
                        (isCurrent || isCompleted) && "text-white",
                        !isCurrent && !isCompleted && "text-black"
                      )}
                      style={{ fontFamily: "var(--font-degular), sans-serif" }}
                    >
                      {step.number + 1}
                    </span>
                  )}
                </div>

                {/* Connector line (flex-grow divider) */}
                {index < steps.length - 1 && (
                  <div key={`line-${step.number}`} className="flex-1 h-px bg-black mx-0" />
                )}
              </>
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
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

