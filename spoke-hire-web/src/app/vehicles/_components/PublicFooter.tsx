import Link from "next/link";
import { Separator } from "~/components/ui/separator";

/**
 * Public Footer
 * 
 * Footer for public pages with links and information
 */
export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">SpokeHire</h3>
            <p className="text-sm text-muted-foreground">
              Premium classic and vintage vehicles for hire. Perfect for weddings, events, and special occasions.
            </p>
          </div>

          {/* Browse */}
          <div className="space-y-3">
            <h3 className="font-semibold">Browse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/vehicles" className="text-muted-foreground hover:text-foreground transition-colors">
                  All Vehicles
                </Link>
              </li>
              <li>
                <Link href="/vehicles?yearFrom=1960&yearTo=1969" className="text-muted-foreground hover:text-foreground transition-colors">
                  1960s Classics
                </Link>
              </li>
              <li>
                <Link href="/vehicles?yearFrom=1970&yearTo=1979" className="text-muted-foreground hover:text-foreground transition-colors">
                  1970s Classics
                </Link>
              </li>
              <li>
                <Link href="/vehicles?yearFrom=1980&yearTo=1989" className="text-muted-foreground hover:text-foreground transition-colors">
                  1980s Classics
                </Link>
              </li>
            </ul>
          </div>

          {/* For Owners */}
          <div className="space-y-3">
            <h3 className="font-semibold">For Owners</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/signin?callbackUrl=/admin/vehicles/new" className="text-muted-foreground hover:text-foreground transition-colors">
                  List Your Vehicle
                </Link>
              </li>
              <li>
                <Link href="/admin/vehicles" className="text-muted-foreground hover:text-foreground transition-colors">
                  Manage Vehicles
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="text-muted-foreground hover:text-foreground transition-colors">
                  Owner Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h3 className="font-semibold">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {currentYear} SpokeHire. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

