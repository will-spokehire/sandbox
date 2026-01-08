/**
 * Filter Types
 * 
 * Shared type definitions for vehicle filters
 */

export interface FilterOption {
  id: string;
  name: string;
  color?: string;
}

export interface MultiSelectFilterProps {
  label: string;
  placeholder: string;
  options: FilterOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  renderOption?: (option: FilterOption, selected: boolean) => React.ReactNode;
  searchPlaceholder?: string;
  enableSearch?: boolean;
  className?: string;
  onClear?: () => void;
}

export interface SingleSelectFilterProps {
  label: string;
  value?: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export interface YearRangeFilterProps {
  yearFrom?: string;
  yearTo?: string;
  onYearFromChange: (year?: string) => void;
  onYearToChange: (year?: string) => void;
  className?: string;
}

