"use client";

import * as React from "react";
import { PhoneInput as BasePhoneInput, type CountryIso2 } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "~/lib/utils";
import "./phone-input.css";

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
          "flex w-full phone-input-wrapper",
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
          inputStyle={{
            borderRadius: 0,
          }}
          inputClassName={cn(
            "flex h-[44px] w-full border border-l-0 border-spoke-black bg-spoke-white px-4 py-2",
            "font-degular leading-[1.4] text-spoke-black",
            "placeholder:text-spoke-black/40",
            "outline-none",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
          countrySelectorStyleProps={{
            buttonStyle: {
              borderRadius: 0,
            },
            buttonClassName: cn(
              "h-[44px] border border-r-0 border-spoke-black bg-spoke-white px-3",
              "font-degular text-lg font-medium text-spoke-black",
              "hover:bg-spoke-black/5",
              "outline-none",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            ),
            dropdownStyleProps: {
              style: {
                borderRadius: 0,
              },
              className: "bg-spoke-white border border-spoke-black shadow-lg z-50",
              listItemClassName: cn(
                "px-3 py-2 hover:bg-spoke-black/5 cursor-pointer",
                "font-degular text-base font-medium text-spoke-black",
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
