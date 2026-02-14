import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "~/lib/utils";
import type { Navigation } from "~/lib/payload-api";
import { NavAuthSection } from "./NavAuthSection";

interface PublicUserNavigationProps {
  navigation?: Navigation | null;
}

/**
 * Public User Navigation Component - SERVER COMPONENT
 * 
 * Renders navigation bar with server-side content for SEO:
 * - Logo (server-rendered)
 * - Navigation links (server-rendered)
 * - Auth section (client component via NavAuthSection)
 * 
 * This ensures crawlers see the logo and all nav links in the initial HTML.
 * The NavAuthSection client component handles auth-dependent UI.
 */
export function PublicUserNavigation({ navigation }: PublicUserNavigationProps) {
  const navItems = navigation?.mainMenu ?? [];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className={cn(
        "flex items-center justify-between",
        "h-[72px]"
      )}>
        {/* Logo - Server Rendered */}
        <Link href="/" className="flex items-center shrink-0">
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

        {/* Desktop Navigation Links - Server Rendered */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navItems.length > 0 && (
            <nav className="flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.link}
                  href={item.link}
                  className={cn(
                    "capitalize font-degular text-2xl leading-[1.5] transition-colors",
                    "hover:text-gray-600 text-black"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          
          {/* Auth Section - Client Component */}
          <Suspense fallback={<div className="w-20 h-10" />}>
            <NavAuthSection navigation={navigation} />
          </Suspense>
        </div>

        {/* Mobile Auth/Menu Section - Client Component */}
        <div className="lg:hidden">
          <Suspense fallback={<div className="w-10 h-10" />}>
            <NavAuthSection navigation={navigation} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
