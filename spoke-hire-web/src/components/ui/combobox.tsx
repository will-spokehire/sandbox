"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  allowCustomValue?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  emptyText = "No results found.",
  searchPlaceholder = "Search...",
  disabled = false,
  allowCustomValue = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Find the selected option
  const selectedOption = options.find((option) => option.value === value);

  // Handle selection
  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    setSearchValue("");
  };

  // Handle custom value (if typing and pressing Enter)
  const handleCustomValue = (inputValue: string) => {
    if (allowCustomValue && inputValue.trim()) {
      onValueChange(inputValue.trim());
      setOpen(false);
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            // Match Input component styling
            "w-full h-[44px] bg-spoke-white border border-spoke-black",
            "px-4 py-2 justify-between",
            "font-degular text-lg font-medium leading-[1.4] text-spoke-black",
            "hover:bg-spoke-white hover:text-spoke-black",
            !selectedOption?.label && !value && "text-spoke-black/40"
          )}
        >
          {selectedOption?.label ?? (value ? value : placeholder)}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={(e) => {
              if (e.key === "Enter" && allowCustomValue) {
                e.preventDefault();
                handleCustomValue(searchValue);
              }
            }}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              {allowCustomValue && searchValue ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-spoke-black/60 mb-2">{emptyText}</p>
                  <p className="body-xs text-spoke-black/60">
                    Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 border border-spoke-black bg-spoke-grey px-1.5 font-mono text-[10px] font-medium text-spoke-black">Enter</kbd> to add &quot;{searchValue}&quot;
                  </p>
                </div>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) =>
                  option.label.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

