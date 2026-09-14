/**
 * Capacitor native shell bootstrap.
 * Safe no-op when running as a normal web / PWA build.
 */
export async function initNativeShell() {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;

    const [{ App }, { StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ]);

    await StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
    await StatusBar.setBackgroundColor({ color: '#07070A' }).catch(() => undefined);
    await SplashScreen.hide().catch(() => undefined);

    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    // Web build or plugins not available — ignore.
  }
}
