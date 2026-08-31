/**
 * Solvexa Firebase App Check Integration
 * 
 * Protects backend resources (Firestore, Storage, Functions) from unauthorized clients and bots.
 * In production: Configured with reCAPTCHA v3 or Enterprise provider.
 * In development: Uses App Check debug tokens.
 */

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import app, { isFirebaseConfigured } from '../../lib/firebase';

let appCheckInstance: ReturnType<typeof initializeAppCheck> | null = null;

export function initAppCheck(): void {
  if (typeof window === 'undefined' || !isFirebaseConfigured) return;
  if (appCheckInstance) return;

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (import.meta.env.DEV) {
    // In development, enable debug token if specified
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
    if (debugToken) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
    }
  }

  if (siteKey) {
    try {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
      if (import.meta.env.DEV) {
        console.log('[AppCheck] Initialized successfully with reCAPTCHA v3 provider.');
      }
    } catch (err) {
      console.warn('[AppCheck] Initialization notice:', err);
    }
  } else if (import.meta.env.DEV) {
    // Provide guidance for enabling production App Check in Firebase Console
    console.info(
      '[AppCheck] Optional: To enforce App Check on Firestore in production, generate a reCAPTCHA v3 site key in Google Cloud Console, register it under Firebase Console > App Check > Apps, and set VITE_RECAPTCHA_SITE_KEY in .env.local.'
    );
  }
}
