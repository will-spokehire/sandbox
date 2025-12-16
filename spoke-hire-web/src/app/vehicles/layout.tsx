import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "./_components/PublicFooter";

/**
 * Public Vehicles Layout
 * 
 * Layout for public vehicle pages (/vehicles)
 * Includes unified navigation and footer
 */
export default async function PublicVehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicUserNavigation />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

