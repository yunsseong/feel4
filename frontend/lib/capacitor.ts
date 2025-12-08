import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// Dark mode detection
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export async function initializeCapacitor() {
  if (!isNative) {
    console.log('Running in web mode');
    return;
  }

  console.log(`Initializing Capacitor on ${platform}`);

  try {
    // Initial Status Bar configuration based on system theme
    await updateStatusBarTheme();

    // Splash Screen
    await SplashScreen.hide();

    // Keyboard configuration
    if (platform === 'ios') {
      Keyboard.setAccessoryBarVisible({ isVisible: true });
    }

    // Listen for theme changes
    if (typeof window !== 'undefined') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        updateStatusBarTheme();
      });
    }

    // App state listeners
    App.addListener('appStateChange', ({ isActive }) => {
      console.log('App state changed. Is active:', isActive);
      if (isActive) {
        // Refresh status bar when app becomes active
        updateStatusBarTheme();
      }
    });

    App.addListener('appUrlOpen', (data) => {
      console.log('App opened with URL:', data);
    });

    console.log('Capacitor initialized successfully');
  } catch (error) {
    console.error('Error initializing Capacitor:', error);
  }
}

async function updateStatusBarTheme() {
  if (!isNative) return;

  const dark = isDarkMode();

  try {
    if (platform === 'ios' || platform === 'android') {
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });

      if (platform === 'android') {
        await StatusBar.setBackgroundColor({
          color: dark ? '#1a1a1a' : '#ffffff',
        });
      }
    }
  } catch (error) {
    console.error('Error updating status bar theme:', error);
  }
}

// Utility functions
export function showStatusBar() {
  if (isNative) {
    StatusBar.show();
  }
}

export function hideStatusBar() {
  if (isNative) {
    StatusBar.hide();
  }
}

export function setStatusBarLight() {
  if (isNative) {
    StatusBar.setStyle({ style: Style.Light });
  }
}

export function setStatusBarDark() {
  if (isNative) {
    StatusBar.setStyle({ style: Style.Dark });
  }
}
