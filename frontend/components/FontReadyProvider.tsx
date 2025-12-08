'use client';

import { useEffect, useState } from 'react';

/**
 * FontReadyProvider
 * 폰트 로딩 완료까지 스피너 표시, 콘텐츠는 CSS로 숨김 처리
 */
export function FontReadyProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    document.body.classList.add('fonts-loading');

    document.fonts.ready.then(() => {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-ready');
      setIsReady(true);
    });

    // 3초 타임아웃 (폰트 로딩 실패 대비)
    const timeout = setTimeout(() => {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-ready');
      setIsReady(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <>
      <div id="font-loader" className={isReady ? 'hidden' : ''}>
        <div className="spinner" />
      </div>
      {children}
    </>
  );
}
