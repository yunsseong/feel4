'use client';

import { useEffect, useState } from 'react';

/**
 * Loading Screen Component
 * Shows a loading screen during initial app load
 */
export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hide loading screen after initial render
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* App Icon/Logo */}
        <div className="text-6xl animate-pulse">🌸</div>

        {/* App Name */}
        <h1 className="text-2xl font-bold text-foreground">필사</h1>

        {/* Loading Spinner */}
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  );
}

/**
 * Suspense Fallback Component
 * Used for code-splitting and lazy loading
 */
export function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">로딩 중...</p>
      </div>
    </div>
  );
}
