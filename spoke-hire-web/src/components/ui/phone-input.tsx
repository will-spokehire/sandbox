"use client";

import * as React from "react";
import { PhoneInput as BasePhoneInput, type CountryIso2 } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "~/lib/utils";

export interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * PhoneInput Component
 * 
 * A shadcn/ui-styled wrapper around react-international-phone
 * 
 * Features:
 * - International phone number input with country selector
 * - Country flags and calling codes (+44, +1, etc.) in dropdown
 * - Clean separation: country code in dropdown, number in input
 * - Default country: UK (+44)
 * - E.164 format output (e.g., "+447123456789")
 * - Integrates with React Hook Form
 * - Automatically parses existing E.164 numbers from database
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, placeholder = "7123 456789", disabled, className }, ref) => {
    /**
     * Smart onChange handler that strips leading zeros for UK numbers
     * Prevents truncation when users instinctively enter "0" before their number
     */
    const handleChange = (phone: string) => {
      // Detect UK number with leading zero after country code (+440...)
      // Strip the zero to prevent truncation of the last digit
      if (phone.startsWith('+440')) {
        const cleaned = phone.replace('+440', '+44');
        onChange?.(cleaned);
      } else {
        onChange?.(phone);
      }
    };

    return (
      <div
        className={cn(
          "flex w-full rounded-md ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        <BasePhoneInput
          defaultCountry="gb"
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          style={{ width: '100%' }}
          inputClassName={cn(
            "flex h-10 w-full rounded-r-md rounded-l-none border border-l-0 border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:border-input",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          countrySelectorStyleProps={{
            buttonClassName: cn(
              "h-10 rounded-l-md rounded-r-none border border-r-0 border-input bg-background px-3",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:outline-none focus:border-input",
              "disabled:cursor-not-allowed disabled:opacity-50"
            ),
            dropdownStyleProps: {
              className: "bg-background border border-input rounded-md shadow-lg z-50",
              listItemClassName: cn(
                "px-3 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                "flex items-center gap-2"
              ),
            },
          }}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
