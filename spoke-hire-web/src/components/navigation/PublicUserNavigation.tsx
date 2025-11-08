"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, Menu, User, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { useAuth } from "~/providers/auth-provider";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";

interface NavItem {
  name: string;
  href: string;
  requireAuth?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "Browse Vehicles",
    href: "/vehicles",
  },
  {
    name: "List My Vehicle",
    href: "/user/vehicles/new",
  },
  {
    name: "My Vehicles",
    href: "/user/vehicles",
    requireAuth: true,
  },
];

/**
 * Get user initials for avatar (shared with UserMenu)
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
  return email.substring(0, 2).toUpperCase();
}

/**
 * Get display name for user (shared with UserMenu)
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
  return email.split('@')[0] ?? email;
}

function LeftNavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
      {navItems
        .filter(item => !item.requireAuth || isAuthenticated)
        .map((item) => {
          // Check for active state with proper specificity
          // Exact match always wins
          const isActive = (() => {
            if (pathname === item.href) return true;
            
            // For specific terminal routes (like /user/vehicles/new), 
            // don't match parent routes
            if (item.href === "/user/vehicles" && pathname === "/user/vehicles/new") {
              return false;
            }
            
            // For parent routes, check if current path is a child
            return pathname.startsWith(item.href + "/");
          })();

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClick}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                isActive
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              {item.name}
            </Link>
          );
        })}
    </nav>
  );
}

function RightNavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
        <div className="h-9 w-24 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-2">
      {/* Enquire Now - visible to all */}
      <Button variant="ghost" asChild className="justify-start lg:justify-center">
        <Link href="/enquiry/new" onClick={onClick}>
          Enquire Now
        </Link>
      </Button>

      {!isAuthenticated && (
        <>
          {/* Not logged in - show Login and Sign Up */}
          <Button variant="ghost" asChild className="justify-start lg:justify-center">
            <Link href="/auth/login" onClick={onClick}>
              Login
            </Link>
          </Button>
          <Button asChild className="justify-start lg:justify-center">
            <Link href="/auth/signup" onClick={onClick}>
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Public User Navigation Component
 * 
 * Unified navigation bar for public and authenticated users.
 * Adapts based on authentication state:
 * - Public: Shows Login/Sign Up
 * - Authenticated: Shows user avatar dropdown with profile and sign out
 * 
 * Used across /vehicles, /user, and /enquiry routes.
 * Admin routes use separate AdminLayout navigation.
 */
export function PublicUserNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const initials = user ? getInitials(user.firstName, user.lastName, user.email) : "";
  const displayName = user ? getDisplayName(user.firstName, user.lastName, user.email) : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <Link href="/vehicles" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  SpokeHire
                </h1>
              </div>
            </Link>

            {/* Desktop Left Navigation */}
            <div className="hidden lg:block">
              <LeftNavLinks pathname={pathname} />
            </div>
          </div>

          {/* Right side: Right Nav Links + User Menu + Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Desktop Right Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <RightNavLinks pathname={pathname} />
              {isAuthenticated && !isLoading && (
                <div className="ml-2">
                  <UserMenu />
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {isMounted && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 p-0 flex flex-col">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation menu with user options
                  </SheetDescription>

                  {/* Mobile Menu Header with User Info (if authenticated) */}
                  {isAuthenticated && user && !isLoading ? (
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-base">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Menu</h2>
                    </div>
                  )}
                  
                  {/* Mobile Navigation Links */}
                  <div className="flex-1 px-4 py-4 overflow-y-auto">
                    <div className="space-y-1">
                      <LeftNavLinks 
                        pathname={pathname} 
                        onClick={() => setMobileMenuOpen(false)} 
                      />
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-1">
                      <RightNavLinks 
                        pathname={pathname} 
                        onClick={() => setMobileMenuOpen(false)} 
                      />
                    </div>
                  </div>

                  {/* Mobile User Actions (if authenticated) */}
                  {isAuthenticated && !isLoading && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-1">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push('/user/profile');
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={async () => {
                          setMobileMenuOpen(false);
                          await signOut();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

