"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, User, Plus, Menu } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { cn } from "~/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "My Vehicles",
    href: "/user/vehicles",
    icon: Car,
  },
  {
    name: "Add Vehicle",
    href: "/user/vehicles/new",
    icon: Plus,
  },
  {
    name: "Profile",
    href: "/user/profile",
    icon: User,
  },
];

function NavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
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
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * User Navigation Component
 * 
 * Top navigation bar for all user pages with:
 * - Brand/logo on left
 * - Navigation links (Vehicles, Add Vehicle, Profile)
 * - User menu on right
 * - Responsive mobile menu
 */
export function UserNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <Link href="/user/vehicles" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  SpokeHire
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <NavLinks pathname={pathname} />
            </div>
          </div>

          {/* Right side: User Menu + Mobile Menu */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <UserMenu />
            </div>

            {/* Mobile Menu Button */}
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
                  Main navigation menu for user pages
                </SheetDescription>
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">Menu</span>
                  </div>
                  
                  {/* Mobile Navigation */}
                  <div className="flex-1 px-3 py-4 overflow-y-auto">
                    <NavLinks 
                      pathname={pathname} 
                      onClick={() => setMobileMenuOpen(false)} 
                    />
                  </div>

                  {/* Mobile User Menu */}
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                    <UserMenu />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

