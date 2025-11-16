import Link from "next/link";
import { Breadcrumb } from "./Breadcrumb";

interface HeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    current?: boolean;
  }>;
}

export function Header({ title, subtitle, breadcrumbs }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbs} />
          </div>
        )}

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-gray-600">{subtitle}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/vehicles"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Vehicle Catalogue
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
