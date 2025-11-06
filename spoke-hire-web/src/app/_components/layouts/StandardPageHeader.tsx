import type { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { LAYOUT_CONSTANTS, TYPOGRAPHY } from "~/lib/design-tokens";

interface StandardPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: ReactNode;
  actions?: ReactNode;
  variant?: "hero" | "app" | "form" | "detail";
  backButton?: ReactNode;
}

/**
 * Standard Page Header
 * 
 * Reusable page header component with consistent styling based on page type.
 * 
 * Variants:
 * - hero: Large centered header with muted background (for public catalog/marketing pages)
 * - app: Medium left-aligned header with muted background (for dashboard/management pages)
 * - form: Simple inline header with no background (for forms/auth pages)
 * - detail: Compact header with back button and optional muted background
 * 
 * Usage:
 * ```tsx
 * // Marketing/Catalog pages
 * <StandardPageHeader variant="hero" title="Browse Vehicles" subtitle="..." />
 * 
 * // Dashboard/Management pages
 * <StandardPageHeader variant="app" title="My Vehicles" subtitle="..." actions={<Button />} />
 * 
 * // Form/Auth pages
 * <StandardPageHeader variant="form" title="Sign In" subtitle="..." />
 * 
 * // Detail pages
 * <StandardPageHeader variant="detail" title="Vehicle Name" backButton={<BackButton />} />
 * ```
 */
export function StandardPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  variant = "app",
  backButton,
}: StandardPageHeaderProps) {
  // Hero variant: Large centered header with background (marketing/catalog pages)
  if (variant === "hero") {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className={cn(LAYOUT_CONSTANTS.container, "py-12 md:py-16")}>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
            <h1 className={TYPOGRAPHY.heroTitle}>{title}</h1>
            {subtitle && (
              <h2 className={cn(TYPOGRAPHY.pageDescription, "font-medium text-xl md:text-2xl")}>
                {subtitle}
              </h2>
            )}
            {actions && <div className="pt-4">{actions}</div>}
          </div>
        </div>
      </div>
    );
  }

  // App variant: Medium header with background (dashboard/management pages)
  if (variant === "app") {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className={cn(LAYOUT_CONSTANTS.container, "py-6 md:py-8")}>
          {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className={TYPOGRAPHY.pageTitle}>{title}</h1>
              {subtitle && (
                <p className={cn(TYPOGRAPHY.pageDescription, "mt-2")}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Detail variant: Compact header with back button
  if (variant === "detail") {
    return (
      <div className="border-b bg-slate-50 dark:bg-slate-900">
        <div className={cn(LAYOUT_CONSTANTS.container, "py-4")}>
          <div className="space-y-3">
            {backButton && <div>{backButton}</div>}
            {breadcrumbs && <div>{breadcrumbs}</div>}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className={cn(TYPOGRAPHY.pageTitle, "text-2xl md:text-3xl")}>{title}</h1>
                {subtitle && (
                  <p className={cn(TYPOGRAPHY.pageDescription, "mt-1 text-sm")}>
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form variant: Clean inline header with no background (forms/auth pages)
  return (
    <div className="mb-8">
      {breadcrumbs && <div className="mb-4">{breadcrumbs}</div>}
      {backButton && <div className="mb-4">{backButton}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={TYPOGRAPHY.pageTitle}>{title}</h1>
          {subtitle && (
            <p className={cn(TYPOGRAPHY.pageDescription, "mt-2")}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

