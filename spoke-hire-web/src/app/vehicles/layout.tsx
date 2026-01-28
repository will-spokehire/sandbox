import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "./_components/PublicFooter";
import { getNavigation } from "~/lib/payload-api";

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
  const navigation = await getNavigation();

  return (
    <div className="flex min-h-screen flex-col">
      <PublicUserNavigation navigation={navigation} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

