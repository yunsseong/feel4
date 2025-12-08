import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.feel4.app',
  appName: '필사',
  webDir: 'out',
  server: {
    // Development server configuration
    // url: 'http://localhost:3200', // Uncomment for live reload during development
    cleartext: true, // Allow HTTP requests
    androidScheme: 'http', // Use HTTP instead of HTTPS for Android
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
