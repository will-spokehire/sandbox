interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message = "Loading...", children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <div className="h-12 w-12 border-4 border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin" />
            <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
