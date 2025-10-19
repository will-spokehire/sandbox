'use client';

import { useAuth } from '~/providers/auth-provider';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '~/components/ui/avatar';
import { Button } from '~/components/ui/button';
import { LogOut, User, Shield } from 'lucide-react';

/**
 * User Menu Component
 * 
 * Displays user information and provides sign out functionality.
 * Shows in the header/navbar for authenticated users.
 * 
 * @example
 * ```tsx
 * <UserMenu />
 * ```
 */
export function UserMenu() {
  const { user, isAuthenticated, signOut, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const initials = getInitials(user.firstName, user.lastName, user.email);
  const displayName = getDisplayName(user.firstName, user.lastName, user.email);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={() => router.push('/user/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {user.userType === 'ADMIN' && (
          <DropdownMenuItem disabled className="cursor-default">
            <Shield className="mr-2 h-4 w-4" />
            <span className="font-semibold">Admin Access</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 dark:text-red-400 cursor-pointer"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Get user initials for avatar
 */
function getInitials(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.substring(0, 2).toUpperCase();
  }
  if (lastName) {
    return lastName.substring(0, 2).toUpperCase();
  }
  // Fallback to first 2 chars of email
  return email.substring(0, 2).toUpperCase();
}

/**
 * Get display name for user
 */
function getDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  // Fallback to email username
  return email.split('@')[0] ?? email;
}

