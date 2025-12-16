"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface ProgressStepperProps {
  /** Total number of steps */
  steps: number
  /** Current active step (1-indexed) */
  currentStep: number
  /** Optional labels for each step */
  labels?: string[]
  /** Additional CSS classes */
  className?: string
  /** Size variant */
  size?: "sm" | "md" | "lg"
}

/**
 * Checkmark icon for completed steps
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

/**
 * ProgressStepper component for multi-step forms
 *
 * Features:
 * - Numbered circles (48px, rounded)
 * - Connecting lines between steps
 * - Active step filled black
 * - Completed steps with checkmark
 * - Optional step labels
 *
 * @example
 * <ProgressStepper steps={4} currentStep={2} />
 *
 * @example
 * <ProgressStepper
 *   steps={3}
 *   currentStep={1}
 *   labels={["Details", "Payment", "Confirm"]}
 * />
 */
export function ProgressStepper({
  steps,
  currentStep,
  labels,
  className,
  size = "md",
}: ProgressStepperProps) {
  const sizeClasses = {
    sm: {
      step: "size-10 text-2xl",
      line: "h-px",
    },
    md: {
      step: "size-12 text-[32px]",
      line: "h-px",
    },
    lg: {
      step: "size-14 text-4xl",
      line: "h-px",
    },
  }[size]

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Steps row */}
      <div className="flex items-center">
        {Array.from({ length: steps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isActive = stepNumber === currentStep
          const isLast = stepNumber === steps

          return (
            <React.Fragment key={stepNumber}>
              {/* Step circle */}
              <div
                className={cn(
                  "progress-step shrink-0",
                  sizeClasses.step,
                  isActive && "progress-step-active",
                  isCompleted && "bg-spoke-black text-spoke-white"
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? (
                  <CheckIcon className="size-5" />
                ) : (
                  <span className="pb-1">{stepNumber}</span>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 min-w-8",
                    sizeClasses.line,
                    isCompleted ? "bg-spoke-black" : "bg-spoke-black/30"
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Labels row (if provided) */}
      {labels && labels.length > 0 && (
        <div className="flex items-start">
          {labels.map((label, index) => {
            const stepNumber = index + 1
            const isActive = stepNumber === currentStep
            const isLast = stepNumber === labels.length

            return (
              <React.Fragment key={stepNumber}>
                <span
                  className={cn(
                    "body-small text-center shrink-0",
                    sizeClasses.step.includes("size-10") && "w-10",
                    sizeClasses.step.includes("size-12") && "w-12",
                    sizeClasses.step.includes("size-14") && "w-14",
                    isActive ? "text-spoke-black font-medium" : "text-spoke-black/60"
                  )}
                >
                  {label}
                </span>
                {!isLast && <div className="flex-1 min-w-8" aria-hidden="true" />}
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProgressStepper

