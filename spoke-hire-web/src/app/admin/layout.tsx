"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Mail, LayoutDashboard, Menu, Tag, Box } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "~/components/ui/sheet";
import { UserMenu } from "~/components/auth/UserMenu";
import { useRequireAdmin } from "~/providers/auth-provider";
import { cn } from "~/lib/utils";
import { PageLoading } from "~/components/loading";
import { api } from "~/trpc/react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Vehicles",
    href: "/admin/vehicles",
    icon: Car,
  },
  {
    name: "Deals",
    href: "/admin/deals",
    icon: Mail,
  },
  {
    name: "Makes",
    href: "/admin/makes",
    icon: Tag,
  },
  {
    name: "Models",
    href: "/admin/models",
    icon: Box,
  },
];

function NavLinks({ pathname, onClick }: { pathname: string; onClick?: () => void }) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = 
          item.href === "/admin" 
            ? pathname === "/admin" 
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useRequireAdmin();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const utils = api.useUtils();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Clear any old cached deal queries on mount (fixes enum migration issues)
  useEffect(() => {
    void utils.deal.list.invalidate();
  }, [utils.deal.list]);

  if (isLoading || !user) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-4 py-5 border-b border-slate-200 dark:border-slate-700">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  SpokeHire
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Admin Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 py-4">
            <NavLinks pathname={pathname} />
          </div>

          {/* User Menu */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                  {user.firstName ?? user.email}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                SpokeHire Admin
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <UserMenu />
              {isMounted && (
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64 p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <SheetDescription className="sr-only">
                      Main navigation menu for the admin panel
                    </SheetDescription>
                    <div className="flex flex-col h-full">
                      {/* Mobile Menu Header */}
                      <div className="flex items-center justify-between px-4 py-5 border-b">
                        <span className="text-lg font-semibold">Menu</span>
                      </div>
                      
                      {/* Mobile Navigation */}
                      <div className="flex-1 px-3 py-4 overflow-y-auto">
                        <NavLinks 
                          pathname={pathname} 
                          onClick={() => setMobileMenuOpen(false)} 
                        />
                      </div>

                      {/* Mobile User Info */}
                      <div className="border-t p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {user.firstName ?? user.email}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

