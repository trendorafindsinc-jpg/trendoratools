import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lucia.trendoratools',
  appName: 'Trendora Tools',
  webDir: 'dist',
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
      showSpinner: false,
    },
  },
};

export default config;
