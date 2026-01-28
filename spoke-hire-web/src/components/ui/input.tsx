import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "~/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  /** Show search icon on the left */
  showSearchIcon?: boolean
  /** Error message to display */
  error?: string
  /** Help text to display below the input */
  helpText?: string
  /** Label for the input */
  label?: string
  /** Mark field as required (adds * to label) */
  required?: boolean
  /** Container className */
  containerClassName?: string
}

/**
 * Input component with brand styling
 *
 * Features:
 * - 1px black border with 44px height (Figma spec)
 * - Degular Medium font at 18px
 * - Optional search icon
 * - Optional label with required indicator
 * - Optional help text
 * - Error state styling
 * - Disabled state with 40% opacity
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter your name" />
 *
 * @example
 * // With label
 * <Input label="First name" required placeholder="John" />
 *
 * @example
 * // With search icon
 * <Input showSearchIcon placeholder="Search..." />
 *
 * @example
 * // With help text
 * <Input label="Email" helpText="We'll never share your email" />
 *
 * @example
 * // With error
 * <Input label="Email" error="Invalid email address" />
 */
function Input({
  className,
  containerClassName,
  type = "text",
  showSearchIcon = false,
  error,
  helpText,
  label,
  required,
  id,
  disabled,
  ...props
}: InputProps) {
  const inputId = id ?? React.useId()

  const inputElement = (
    <div className="relative w-full">
      {showSearchIcon && (
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-spoke-black pointer-events-none"
          aria-hidden="true"
        />
      )}
      <input
        id={inputId}
        type={type}
        data-slot="input"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined
        }
        className={cn(
          // Base styles from Figma
          "w-full h-[44px] bg-spoke-white border border-spoke-black",
          "px-4 py-2",
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
          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-spoke-black",
          // Search icon padding
          showSearchIcon && "pl-10",
          className
        )}
        {...props}
      />
    </div>
  )

  // If no label, help text, or error, return just the input
  if (!label && !helpText && !error) {
    return inputElement
  }

  return (
    <div className={cn("flex flex-col gap-1 w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-degular text-base font-normal leading-[1.2] tracking-tight text-spoke-black"
        >
          {label}
          {required && "*"}
        </label>
      )}
      {inputElement}
      {error && (
        <p
          id={`${inputId}-error`}
          className="font-degular body-xs font-medium leading-[1.2] tracking-tight text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
      {helpText && !error && (
        <p
          id={`${inputId}-help`}
          className="font-degular body-xs font-medium leading-[1.2] tracking-tight text-spoke-black/60"
        >
          {helpText}
        </p>
      )}
    </div>
  )
}

export { Input }
