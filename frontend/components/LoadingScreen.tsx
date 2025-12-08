'use client';

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
