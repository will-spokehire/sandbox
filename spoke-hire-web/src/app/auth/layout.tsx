import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "~/app/vehicles/_components/PublicFooter";

/**
 * Auth Layout
 * 
 * Shared layout for all /auth/* routes (login, signup, etc.)
 * Includes navigation header and footer for consistency
 */
export default function AuthLayout({
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

