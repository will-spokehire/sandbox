"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, User, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { useAuth } from "~/providers/auth-provider";
import { cn } from "~/lib/utils";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import type { Navigation } from "~/lib/payload-api";

interface PublicUserNavigationProps {
  navigation?: Navigation | null;
}

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

/**
 * Desktop Navigation Links from CMS
 */
function DesktopNavLinks({ 
  navigation, 
  pathname,
  isAuthenticated,
  isLoading
}: { 
  navigation?: Navigation | null; 
  pathname: string;
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  const navItems = navigation?.mainMenu ?? [];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-8">
      {navItems.map((item) => {
        const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
        
        return (
          <Link
            key={item.link}
            href={item.link}
            className={cn(
              "capitalize font-degular text-2xl leading-[1.5] transition-colors",
              "hover:text-gray-600",
              isActive ? "text-black font-medium" : "text-black"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Auth Buttons for Non-Authenticated Users */}
      {!isLoading && !isAuthenticated && (
        <>
          <Button variant="ghost" asChild>
            <Link href="/auth/login">
              Login
            </Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </nav>
  );
}

/**
 * Mobile Navigation Links
 */
function MobileNavLinks({ 
  navigation, 
  pathname, 
  onClick,
  isAuthenticated,
  isLoading
}: { 
  navigation?: Navigation | null; 
  pathname: string; 
  onClick?: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  const navItems = navigation?.mainMenu ?? [];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.link || pathname.startsWith(`${item.link}/`);
        
        return (
          <Link
            key={item.link}
            href={item.link}
            onClick={onClick}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors capitalize",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              isActive
                ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                : "text-slate-600 dark:text-slate-400"
            )}
          >
            {item.label}
          </Link>
        );
      })}

      {/* Auth Buttons for Non-Authenticated Users in Mobile */}
      {!isLoading && !isAuthenticated && (
        <>
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/auth/login" onClick={onClick}>
              Login
            </Link>
          </Button>
          <Button className="w-full" asChild>
            <Link href="/auth/signup" onClick={onClick}>
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </nav>
  );
}

/**
 * Public User Navigation Component
 * 
 * Unified navigation bar matching Figma design (node-id: 494-4082).
 * Adapts based on authentication state:
 * - Public: Shows CMS navigation links
 * - Authenticated: Shows CMS navigation links + user avatar dropdown
 * 
 * Uses navigation data from PayloadCMS Navigation global.
 * Used across /vehicles, /user, and /enquiry routes.
 * Admin routes use separate AdminLayout navigation.
 */
export function PublicUserNavigation({ navigation }: PublicUserNavigationProps) {
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
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-0 md:px-8 lg:px-[60px] h-[80px]">
        {/* Logo */}
        <Link href="/vehicles" className="flex items-center shrink-0">
          <div className="relative w-[120px] h-[28px] md:w-[160px] md:h-[37px]">
            <Image
              src="/SpokeHire-Logo.svg"
              alt="SpokeHire"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          <DesktopNavLinks 
            navigation={navigation} 
            pathname={pathname}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
          />
          
          {/* Authenticated User Menu */}
          {isAuthenticated && !isLoading && (
            <div className="ml-4">
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
                  <MobileNavLinks 
                    navigation={navigation}
                    pathname={pathname} 
                    onClick={() => setMobileMenuOpen(false)}
                    isAuthenticated={isAuthenticated}
                    isLoading={isLoading}
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
    </header>
  );
}
