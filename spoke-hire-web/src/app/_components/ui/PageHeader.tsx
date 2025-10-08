import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Standardized page header component for admin pages
 * Provides consistent title, description, and optional action area
 */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

