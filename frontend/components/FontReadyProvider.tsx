'use client';

import { useEffect, useState } from 'react';

const MIN_LOADING_TIME = 300;
const MAX_LOADING_TIME = 3000;

/**
 * FontReadyProvider
 * 폰트가 완전히 로딩될 때까지 콘텐츠를 숨기고 로딩 화면 표시
 * SSR 호환: children은 항상 렌더링하되 visibility로 제어
 */
export function FontReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const startTime = Date.now();
    let isCompleted = false;

    const complete = () => {
      if (isCompleted) return;
      isCompleted = true;

      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, MIN_LOADING_TIME - elapsed);

      setTimeout(() => {
        setIsReady(true);
      }, remainingTime);
    };

    document.fonts.ready.then(complete).catch(complete);
    const timeout = setTimeout(complete, MAX_LOADING_TIME);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      {/* 로딩 화면: 클라이언트에서만 표시, 폰트 로딩 완료 시 사라짐 */}
      {isMounted && !isReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="text-6xl animate-pulse">🌸</div>
            <h1 className="text-2xl font-bold text-foreground">필사</h1>
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        </div>
      )}
      {/* 콘텐츠: 항상 렌더링, 폰트 로딩 전에는 숨김 */}
      <div style={{ visibility: isMounted && !isReady ? 'hidden' : 'visible' }}>
        {children}
      </div>
    </>
  );
}
