"use client";

import * as React from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { api } from "~/trpc/react";
import { CreateContactDialog } from "./CreateContactDialog";

interface UserSearchSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * UserSearchSelect Component
 * 
 * Searchable dropdown for selecting users (for client contacts, etc.)
 * Displays: "FirstName LastName - Company" or "FirstName LastName (email)" if no company
 */
export function UserSearchSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select user...",
}: UserSearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  // Fetch users with search
  const { data: users, isLoading } = api.user.searchUsers.useQuery(
    { 
      search,
      limit: 20,
    },
    {
      enabled: open, // Only fetch when dropdown is open
    }
  );

  // Fetch selected user by ID if we have a value and it's not in the search results
  const { data: selectedUserFromId } = api.user.getById.useQuery(
    { id: value! },
    {
      enabled: !!value && !users?.find((u) => u.id === value), // Only fetch if we have a value but user is not in search results
    }
  );

  // Find selected user - prioritize search results, fallback to ID fetch
  const selectedUser = users?.find((u) => u.id === value) ?? selectedUserFromId;

  // Handle contact creation
  const handleContactCreated = (contactId: string) => {
    onValueChange(contactId);
    setOpen(false);
  };

  // Format user display name
  const formatUserDisplay = (user: { 
    firstName: string | null; 
    lastName: string | null; 
    email: string;
    company: string | null;
  }) => {
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
    const suffix = user.company ? ` - ${user.company}` : ` (${user.email})`;
    return name + suffix;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedUser ? (
              <span className="truncate">{formatUserDisplay(selectedUser)}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search users by name, email, or company..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Loading..." : "No users found."}
              </CommandEmpty>
              <CommandGroup>
                {/* Clear selection option */}
                {value && (
                  <CommandItem
                    value=""
                    onSelect={() => {
                      onValueChange(undefined);
                      setOpen(false);
                    }}
                  >
                    <span className="text-muted-foreground italic">Clear selection</span>
                  </CommandItem>
                )}
                
                {users?.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? undefined : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === user.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {user.company ? `${user.company} • ${user.email}` : user.email}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {/* Create New Contact Button */}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowCreateDialog(true);
                  }}
                  className="justify-center text-primary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span className="font-medium">Create New Contact</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onContactCreated={handleContactCreated}
      />
    </>
  );
}

