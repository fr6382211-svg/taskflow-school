import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App as CapacitorApp } from '@capacitor/app';
import { useEffect, useRef } from 'react';
import type { NavigateFunction } from 'react-router-dom';

export const isNative = Capacitor.isNativePlatform();

/** Call once at app boot. No-ops safely when running as a plain website. */
export async function initNativeApp() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0f172a' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch {
    /* status bar plugin not available on this platform variant */
  }
  try {
    // Give the WebView a beat to paint the first route before hiding the splash,
    // so the transition from native splash -> app feels seamless instead of a flash.
    setTimeout(() => void SplashScreen.hide(), 250);
  } catch {
    /* ignore */
  }
}

/** Light haptic tick for taps, toggles, and nav changes — mirrors native OS feedback. */
export async function hapticTap() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* ignore on unsupported devices */
  }
}

/** Slightly stronger feedback for confirmations (save, complete, submit). */
export async function hapticSuccess() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* ignore */
  }
}

/** Sharp feedback for destructive actions (delete) or errors. */
export async function hapticWarning() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    /* ignore */
  }
}

/**
 * Makes the Android hardware/gesture back button behave like a real app instead
 * of closing the WebView: goes back through in-app history first, and only exits
 * the app from the dashboard root after a second press within 2s ("tekan sekali
 * lagi untuk keluar" pattern used by most Android apps).
 */
export function useHardwareBackButton(navigate: NavigateFunction, onExitHint?: () => void) {
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (!isNative) return;
    const sub = CapacitorApp.addListener('backButton', () => {
      const path = window.location.pathname;
      const isRoot = path === '/' || path === '/dashboard';
      if (!isRoot && window.history.length > 1) {
        navigate(-1);
        return;
      }
      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        void CapacitorApp.exitApp();
      } else {
        lastBackPress.current = now;
        onExitHint?.();
      }
    });
    return () => {
      void sub.then((s) => s.remove());
    };
  }, [navigate, onExitHint]);
}
