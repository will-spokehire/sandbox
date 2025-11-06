"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { useAuth } from "~/providers/auth-provider";
import { cn } from "~/lib/utils";

interface NavItem {
  name: string;
  href: string;
  requireAuth?: boolean;
}

const leftNavItems: NavItem[] = [
  {
    name: "Catalog",
    href: "/vehicles",
  },
  {
    name: "List My Vehicle",
    href: "/user/vehicles/new",
  },
];

function LeftNavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
      {leftNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
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
      <Button variant="ghost" asChild>
        <Link href="/enquiry/new" onClick={onClick}>
          Enquire Now
        </Link>
      </Button>

      {isAuthenticated ? (
        <>
          {/* My Vehicles link - only on desktop, hidden in dropdown on mobile */}
          <div className="hidden lg:block">
            <Button variant="ghost" asChild>
              <Link href="/user/vehicles">My Vehicles</Link>
            </Button>
          </div>
          
          {/* Mobile: My Vehicles as a regular link */}
          <div className="lg:hidden">
            <Link
              href="/user/vehicles"
              onClick={onClick}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                pathname === "/user/vehicles" || pathname.startsWith("/user/vehicles/")
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50"
                  : "text-slate-600 dark:text-slate-400"
              )}
            >
              My Vehicles
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Not logged in - show Login and Sign Up */}
          <Button variant="ghost" asChild>
            <Link href="/auth/login" onClick={onClick}>
              Login
            </Link>
          </Button>
          <Button asChild>
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
 * - Authenticated: Shows My Vehicles link and user avatar dropdown
 * 
 * Used across /vehicles, /user, and /enquiry routes.
 * Admin routes use separate AdminLayout navigation.
 */
export function PublicUserNavigation() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
                <SheetContent side="right" className="w-64 p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation menu
                  </SheetDescription>
                  <div className="flex flex-col h-full">
                    {/* Mobile Menu Header */}
                    <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">Menu</span>
                    </div>
                    
                    {/* Mobile Navigation */}
                    <div className="flex-1 px-3 py-4 overflow-y-auto">
                      <LeftNavLinks 
                        pathname={pathname} 
                        onClick={() => setMobileMenuOpen(false)} 
                      />
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <RightNavLinks 
                          pathname={pathname} 
                          onClick={() => setMobileMenuOpen(false)} 
                        />
                      </div>
                    </div>

                    {/* Mobile User Menu - only show if authenticated */}
                    {isAuthenticated && !isLoading && (
                      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                        <UserMenu />
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

