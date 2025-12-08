'use client';

import { useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { isNative } from '@/lib/capacitor';

export function KeyboardDismiss() {
  useEffect(() => {
    if (!isNative) return;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;

      // Don't dismiss if touching an input element
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      // Dismiss keyboard when touching outside input fields
      Keyboard.hide();
    };

    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return null;
}
