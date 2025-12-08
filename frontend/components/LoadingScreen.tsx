'use client';

import { useEffect, useState } from 'react';

/**
 * Loading Screen Component
 * Shows a loading screen until fonts are fully loaded
 */
export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const MIN_LOADING_TIME = 300; // 최소 로딩 시간 (너무 빨리 깜빡이는 것 방지)
    const MAX_LOADING_TIME = 3000; // 최대 대기 시간 (폰트 로딩 실패 시 대비)

    const startTime = Date.now();

    // 폰트 로딩 완료 대기
    const waitForFonts = async () => {
      try {
        // document.fonts.ready는 모든 폰트가 로드되면 resolve됨
        await document.fonts.ready;
      } catch {
        // 폰트 API 지원하지 않는 경우 무시
      }

      // 최소 로딩 시간 보장
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    };

    // 최대 대기 시간 타임아웃 설정
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, MAX_LOADING_TIME);

    waitForFonts();

    return () => clearTimeout(timeout);
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
