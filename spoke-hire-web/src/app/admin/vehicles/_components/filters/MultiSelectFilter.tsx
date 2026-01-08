"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/useMediaQuery";
import type { MultiSelectFilterProps } from "./types";

/**
 * Multi-Select Filter
 * 
 * Generic multi-select filter with search
 * Automatically switches between Popover (desktop) and Sheet (mobile)
 */
export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selectedIds,
  onChange,
  renderOption,
  searchPlaceholder = "Search...",
  enableSearch = true,
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleToggle = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((selectedId) => selectedId !== id)
      : [...selectedIds, id];
    
    onChange(newIds);
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;
    if (selectedIds.length === 1) {
      return options.find((o) => o.id === selectedIds[0])?.name ?? placeholder;
    }
    return `${selectedIds.length} selected`;
  };

  const renderCommandItems = () => (
    <>
      {options.map((option) => {
        const isSelected = selectedIds.includes(option.id);
        return (
          <CommandItem
            key={option.id}
            value={option.name}
            onSelect={() => handleToggle(option.id)}
          >
            {renderOption ? (
              renderOption(option, isSelected)
            ) : (
              <>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    isSelected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className={cn(isSelected && "font-medium")}>{option.name}</span>
              </>
            )}
          </CommandItem>
        );
      })}
    </>
  );

  // Button base styles matching Figma dropdown component
  const buttonBaseStyles = cn(
    "bg-white border border-black border-solid",
    "h-[40px] px-4 py-2",
    "flex items-center justify-between",
    "font-degular text-[16px] font-normal leading-[1.2] tracking-[-0.16px]",
    "text-black",
    "transition-colors",
    "hover:bg-spoke-grey",
    className
  );

  // Only render after mount to avoid hydration issues
  if (!isMounted) {
    return (
      <button
        type="button"
        className={buttonBaseStyles}
        disabled
      >
        <span>{placeholder}</span>
        <ChevronsUpDown className="h-[13px] w-4 shrink-0" />
      </button>
    );
  }

  // Mobile: Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className={cn(buttonBaseStyles, "w-full")}
          >
            <span>{getDisplayText()}</span>
            <ChevronsUpDown className="h-[13px] w-4 shrink-0" />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <Command className="mt-4">
            {enableSearch && <CommandInput placeholder={searchPlaceholder} />}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>{renderCommandItems()}</CommandGroup>
            </CommandList>
          </Command>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={buttonBaseStyles}
        >
          <span className="flex-1 text-left">{getDisplayText()}</span>
          <ChevronsUpDown className="h-[13px] w-4 shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          {enableSearch && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>{renderCommandItems()}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

