/**
 * Desktop Filters
 * 
 * Container for filters on desktop devices
 */
export function DesktopFilters({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:flex md:flex-wrap gap-3">{children}</div>;
}

