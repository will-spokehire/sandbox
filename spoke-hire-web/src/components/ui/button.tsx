import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "~/lib/utils"

/**
 * Loading spinner component for button loading state
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-spoke-black/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Brand primary - solid black background (replaces old default)
        default:
          "bg-spoke-black text-spoke-white border border-spoke-black font-helvetica uppercase tracking-normal hover:opacity-90",
        // Brand outline - transparent with black border (replaces old outline)
        outline:
          "bg-transparent text-spoke-black border border-spoke-black font-helvetica uppercase tracking-normal hover:bg-spoke-black hover:text-spoke-white",
        // Destructive - for dangerous actions
        destructive:
          "bg-destructive text-white border border-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        // Secondary - subtle background
        secondary:
          "bg-spoke-grey text-spoke-black border border-spoke-grey font-helvetica uppercase tracking-normal hover:bg-spoke-grey-light",
        // Ghost - no background until hover
        ghost:
          "text-spoke-black hover:bg-spoke-grey font-helvetica uppercase tracking-normal",
        // Link - text-only with underline
        link: "text-spoke-black underline-offset-4 hover:underline font-degular",
      },
      size: {
        // Default size matching Figma (padding: 11px 23px)
        default: "h-auto px-[23px] py-[11px] text-lg",
        // Small size for compact UI
        sm: "h-auto px-4 py-2 text-sm",
        // Large size for hero CTAs
        lg: "h-auto px-8 py-3 text-xl",
        // Icon-only button
        icon: "size-10 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render as a child component (e.g., Link) */
  asChild?: boolean
  /** Show loading spinner and disable interactions */
  loading?: boolean
  /** Text to show when loading (defaults to children) */
  loadingText?: string
}

/**
 * Button component with brand styling and loading state
 *
 * All variants now use the SpokeHire brand design system:
 * - default: Solid black background, white text, uppercase
 * - outline: Transparent with black border, fills on hover
 * - secondary: Grey background
 * - ghost: No background until hover
 * - link: Text-only with underline on hover
 * - destructive: Red for dangerous actions
 *
 * @example
 * // Primary button (solid black)
 * <Button>Get Started</Button>
 *
 * @example
 * // Outline button
 * <Button variant="outline">Learn More</Button>
 *
 * @example
 * // With loading state
 * <Button loading>Submitting...</Button>
 *
 * @example
 * // Full width button
 * <Button fullWidth>Continue</Button>
 *
 * @example
 * // Small size
 * <Button size="sm">Small Button</Button>
 */
function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      disabled={Boolean(disabled) || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner className="size-4" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
