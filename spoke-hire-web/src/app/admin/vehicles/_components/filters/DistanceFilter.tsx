"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { PostcodeResponse } from "~/types/vehicle";

interface DistanceFilterProps {
  postcode?: string;
  maxDistance?: number;
  onPostcodeChange: (postcode: string) => void;
  onMaxDistanceChange: (distance?: number) => void;
  onPostcodeAndDistanceChange?: (postcode: string, distance: number) => void;
}

const DISTANCE_OPTIONS = [
  { value: "5", label: "5 miles" },
  { value: "10", label: "10 miles" },
  { value: "25", label: "25 miles" },
  { value: "50", label: "50 miles" },
  { value: "100", label: "100 miles" },
  { value: "250", label: "250 miles" },
];

/**
 * Distance Filter Component
 * 
 * Allows filtering vehicles by distance from a UK postcode
 * Uses postcodes.io API for geocoding
 */
export function DistanceFilter({
  postcode = "",
  maxDistance,
  onPostcodeChange,
  onMaxDistanceChange,
  onPostcodeAndDistanceChange,
}: DistanceFilterProps) {
  const [postcodeInput, setPostcodeInput] = useState(postcode);
  const [isValidating, setIsValidating] = useState(false);
  const [isValidPostcode, setIsValidPostcode] = useState(!!postcode); // Track if current input is valid

  // Sync internal state when postcode prop changes (e.g., when filters are cleared)
  useEffect(() => {
    setPostcodeInput(postcode);
    setIsValidPostcode(!!postcode);
  }, [postcode]);

  const validatePostcode = async () => {
    const normalized = postcodeInput.replace(/\s+/g, "").toUpperCase();
    
    if (!normalized) {
      toast.error("Please enter a postcode");
      return;
    }

    if (normalized.length < 5) {
      toast.error("Invalid postcode format", {
        description: "Please enter a valid UK postcode (e.g., SW1A 1AA)",
      });
      return;
    }

    setIsValidating(true);

    try {
      // Call postcodes.io API to validate
      const response = await fetch(`https://api.postcodes.io/postcodes/${normalized}`);
      const data = await response.json() as PostcodeResponse;

      if (response.ok && data.status === 200 && data.result) {
        // Valid postcode
        setIsValidPostcode(true); // Mark as valid immediately
        
        // If we have a combined handler and no distance is set, use it to update both atomically
        if (onPostcodeAndDistanceChange && !maxDistance) {
          // Update both postcode and distance in a single call
          onPostcodeAndDistanceChange(normalized, 5);
        } else {
          // Fallback to separate calls
          onPostcodeChange(normalized);
          
          // Set default radius to 5 miles if not already set
          if (!maxDistance) {
            onMaxDistanceChange(5);
          }
        }
        
        toast.success("Postcode found!", {
          description: `${data.result?.admin_district}, ${data.result?.region}`,
        });
      } else {
        // Invalid postcode
        setIsValidPostcode(false); // Mark as invalid
        toast.error("Postcode not found", {
          description: "Please check the postcode and try again",
        });
        onPostcodeChange("");
      }
    } catch {
      toast.error("Failed to validate postcode", {
        description: "Please check your internet connection and try again",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void validatePostcode();
    }
  };

  return (
    <>
      {/* Postcode Input with Lookup Button */}
      <div className="flex gap-1 md:w-[240px]">
        <Input
          placeholder="Postcode (e.g., SW1A 1AA)"
          value={postcodeInput}
          onChange={(e) => setPostcodeInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="uppercase flex-1"
          disabled={isValidating}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={validatePostcode}
          disabled={isValidating || !postcodeInput}
          className="shrink-0"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Distance Radius - Show when postcode is valid */}
      {isValidPostcode && (
        <Select
          value={maxDistance?.toString() ?? ""}
          onValueChange={(value) =>
            onMaxDistanceChange(value ? parseInt(value) : undefined)
          }
        >
          <SelectTrigger className="md:w-[140px]">
            <SelectValue placeholder="Radius" />
          </SelectTrigger>
          <SelectContent>
            {DISTANCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
