"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, LogOut, Car } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { useAuth } from "~/providers/auth-provider";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import type { Navigation } from "~/lib/payload-api";

interface NavAuthSectionProps {
  navigation?: Navigation | null;
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
  return email.split('@')[0] ?? email;
}

/**
 * NavAuthSection - Client Component
 * 
 * Handles only the auth-dependent parts of navigation:
 * - Desktop: Login/Signup buttons OR UserMenu avatar
 * - Mobile: Hamburger menu with user actions
 * 
 * This is the only client component in the navigation.
 * The parent PublicUserNavigation is a server component that renders
 * the logo and nav links server-side for SEO.
 */
export function NavAuthSection({ navigation }: NavAuthSectionProps) {
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

  const navItems = navigation?.mainMenu ?? [];

  return (
    <>
      {/* Desktop Auth Buttons / User Menu */}
      <div className="hidden lg:flex lg:items-center lg:gap-4">
        {/* Show login/signup by default to avoid hydration mismatch */}
        {/* Hide once we confirm user is authenticated */}
        {(!isMounted || isLoading || !isAuthenticated) && (
          <>
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
          </>
        )}
        {/* Show user menu only after mount + auth confirmed */}
        {isMounted && !isLoading && isAuthenticated && (
          <UserMenu />
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
                    <AvatarFallback className="bg-spoke-grey-light text-spoke-black font-medium text-base tracking-wide">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {displayName}
                    </p>
                    <p className="body-xs text-muted-foreground truncate">
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
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
                  
                  return (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 rounded-md font-degular text-2xl transition-colors capitalize",
                        "hover:bg-slate-100 dark:hover:bg-slate-800",
                        isActive
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 font-medium"
                          : "text-slate-600 dark:text-slate-400"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                {/* Auth Buttons for Non-Authenticated Users in Mobile */}
                {/* Show by default to match server render, hide once auth is confirmed */}
                {(isLoading || !isAuthenticated) && (
                  <>
                    <Separator className="my-2" />
                    <Button variant="ghost" className="w-full justify-center" asChild>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button className="w-full justify-center" asChild>
                      <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </nav>
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
                  className="w-full justify-start"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push('/user/vehicles');
                  }}
                >
                  <Car className="h-4 w-4 mr-2" />
                  My Vehicles
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
    </>
  );
}
