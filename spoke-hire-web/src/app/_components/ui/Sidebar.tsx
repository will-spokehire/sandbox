"use client";

import { useState } from "react";

interface SidebarProps {
  children: React.ReactNode;
  title: string;
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

export function Sidebar({ 
  children, 
  title, 
  isCollapsible = false, 
  defaultCollapsed = false,
  className = ""
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`
      bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 flex flex-col
      ${isCollapsed ? 'w-16' : 'w-full'} ${className}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        )}
        {isCollapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Content - Scrollable */}
      <div className={`
        flex-1 overflow-hidden
        ${isCollapsed ? 'p-2' : 'p-0'}
      `}>
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">📊</span>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
