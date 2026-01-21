import * as React from "react"

import { cn } from "~/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /** Error message to display */
  error?: string
  /** Help text to display below the textarea */
  helpText?: string
  /** Label for the textarea */
  label?: string
  /** Mark field as required (adds * to label) */
  required?: boolean
  /** Container className */
  containerClassName?: string
}

/**
 * Textarea component with brand styling
 *
 * Features:
 * - 1px black border (matches Input component)
 * - Degular Medium font at 18px
 * - Optional label with required indicator
 * - Optional help text
 * - Error state styling
 * - Disabled state with 40% opacity
 * - Auto-resizing with field-sizing-content
 *
 * @example
 * // Basic textarea
 * <Textarea placeholder="Enter your message" />
 *
 * @example
 * // With label
 * <Textarea label="Message" required placeholder="Tell us more..." />
 *
 * @example
 * // With help text
 * <Textarea label="Bio" helpText="Max 500 characters" />
 */
function Textarea({
  className,
  containerClassName,
  error,
  helpText,
  label,
  required,
  id,
  disabled,
  ...props
}: TextareaProps) {
  const textareaId = id ?? React.useId()

  const textareaElement = (
    <textarea
      id={textareaId}
      data-slot="textarea"
      disabled={disabled}
      aria-invalid={Boolean(error)}
      aria-describedby={
        error ? `${textareaId}-error` : helpText ? `${textareaId}-help` : undefined
      }
      className={cn(
        // Base styles matching Input
        "w-full min-h-[120px] bg-spoke-white border border-spoke-black",
        "px-4 py-3",
        // Typography - Degular Medium 18px
        "font-degular text-lg font-medium leading-[1.4] text-spoke-black",
        // Placeholder
        "placeholder:text-spoke-black/40",
        // Focus state
        "outline-none focus:ring-2 focus:ring-spoke-black/50",
        // Disabled state
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Error state
        "aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/50",
        // Auto-resize
        "field-sizing-content resize-y",
        className
      )}
      {...props}
    />
  )

  // If no label, help text, or error, return just the textarea
  if (!label && !helpText && !error) {
    return textareaElement
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={textareaId}
          className="font-degular text-base font-normal leading-[1.2] tracking-tight text-spoke-black"
        >
          {label}
          {required && "*"}
        </label>
      )}
      {textareaElement}
      {error && (
        <p
          id={`${textareaId}-error`}
          className="font-degular body-xs font-medium leading-[1.2] tracking-tight text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
      {helpText && !error && (
        <p
          id={`${textareaId}-help`}
          className="font-degular body-xs font-medium leading-[1.2] tracking-tight text-spoke-black/60"
        >
          {helpText}
        </p>
      )}
    </div>
  )
}

export { Textarea }
