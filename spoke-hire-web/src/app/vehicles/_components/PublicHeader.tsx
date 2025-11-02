"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Car } from "lucide-react";
import { api } from "~/trpc/react";

/**
 * Public Header
 * 
 * Header for public pages with branding and auth actions
 */
export function PublicHeader() {
  const { data: sessionData } = api.auth.getSession.useQuery(undefined, {
    staleTime: 60000, // 1 minute
  });
  
  const isAuthenticated = !!sessionData?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo/Brand */}
        <Link href="/vehicles" className="flex items-center gap-2 font-semibold text-xl">
          <Car className="h-6 w-6" />
          <span>SpokeHire</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {/* User is logged in - show dashboard and list vehicle */}
              <Button variant="ghost" asChild>
                <Link href="/admin/vehicles">My Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/vehicles/new">List Vehicle</Link>
              </Button>
            </>
          ) : (
            <>
              {/* User is not logged in - show login and list vehicle */}
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Log In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signin?callbackUrl=/admin/vehicles/new">List Vehicle</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

