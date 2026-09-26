import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fathur.schoolhub',
  appName: 'FAZET',
  webDir: 'dist',
  server: {
    // App loads your live deployed site directly.
    // Every time you deploy a new version to Vercel, the app updates automatically
    // — no need to rebuild the APK.
    url: 'https://pelajaranfathur.vercel.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    // Native app feel: no white flash / browser chrome while the WebView boots.
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0f172a',
      overlaysWebView: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
