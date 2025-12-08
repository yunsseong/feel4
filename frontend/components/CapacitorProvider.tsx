'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initializeCapacitor, isNative } from '@/lib/capacitor';
import { registerServiceWorker } from '@/lib/service-worker';
import { enablePerformanceMonitoring } from '@/lib/performance-monitor';
import { App } from '@capacitor/app';

export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Initialize Capacitor
    initializeCapacitor();

    // Register Service Worker for web (not needed for native apps)
    if (!isNative) {
      registerServiceWorker();
    }

    // Enable performance monitoring in development
    const cleanup = enablePerformanceMonitoring();

    // Handle Android hardware back button
    let backButtonListener: any;
    if (isNative) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          router.back();
        } else {
          // On home page, minimize app instead of closing
          App.minimizeApp();
        }
      }).then(listener => {
        backButtonListener = listener;
      });
    }

    return () => {
      cleanup();
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [router]);

  return <>{children}</>;
}
