'use client';

import { useEffect, useState } from 'react';

const MIN_LOADING_TIME = 300; // 최소 로딩 시간 (깜빡임 방지)
const MAX_LOADING_TIME = 3000; // 최대 대기 시간 (폰트 로딩 실패 대비)

/**
 * FontReadyProvider
 * 폰트가 완전히 로딩될 때까지 children을 렌더링하지 않고 로딩 화면 표시
 */
export function FontReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
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

    // 폰트 로딩 완료 대기
    document.fonts.ready.then(complete).catch(complete);

    // 최대 대기 시간 타임아웃
    const timeout = setTimeout(complete, MAX_LOADING_TIME);

    return () => clearTimeout(timeout);
  }, []);

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl animate-pulse">🌸</div>
          <h1 className="text-2xl font-bold text-foreground">필사</h1>
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
