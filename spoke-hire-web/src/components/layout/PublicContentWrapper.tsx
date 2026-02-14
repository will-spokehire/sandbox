import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";

interface PublicContentWrapperProps {
  children: React.ReactNode;
}

/**
 * PublicContentWrapper - Server Component
 * 
 * Applies consistent max-width and horizontal padding to public page content.
 * This is a server-side replacement for the old MaxWidthWrapper that used
 * usePathname() (which caused SSR bailout).
 * 
 * Use in public-facing layouts (homepage, vehicles, auth, etc.).
 * Admin layouts have their own full-width styling.
 * 
 * Full-width blocks (like image carousels) can break out using negative margins:
 * className="-mx-4 md:-mx-[30px] w-[calc(100%+2rem)] md:w-[calc(100%+60px)]"
 */
export function PublicContentWrapper({ children }: PublicContentWrapperProps) {
  return (
    <div className={`${LAYOUT_CONSTANTS.maxWidthContainer} overflow-hidden`}>
      {children}
    </div>
  );
}
