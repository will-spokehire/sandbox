import { PublicHeader } from "./_components/PublicHeader";
import { PublicFooter } from "./_components/PublicFooter";

/**
 * Public Vehicles Layout
 * 
 * Layout for public vehicle pages (/vehicles)
 * Includes header with auth actions and footer
 */
export default function PublicVehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

