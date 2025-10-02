"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "~/components/ui/button";
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
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

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
                {option.name}
              </>
            )}
          </CommandItem>
        );
      })}
    </>
  );

  // Mobile: Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <Command className="mt-4">
            <CommandInput placeholder={searchPlaceholder} />
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
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>{renderCommandItems()}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

