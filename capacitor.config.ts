import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lucia.trendoratools',
  appName: 'Trendoratools',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#07070A',
  },
  plugins: {
    SplashScreen: {
      backgroundColor: '#07070A',
      launchAutoHide: true,
      launchShowDuration: 400,
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#07070A',
    },
  },
};

export default config;
