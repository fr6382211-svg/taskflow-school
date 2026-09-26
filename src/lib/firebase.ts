/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// SECURITY: no hardcoded fallback keys. Config must come from environment
// variables so keys can be rotated without a new source-code deploy, and so
// old keys don't stay permanently embedded in git history / build artifacts.
const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ?? '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ?? '',
  databaseURL: (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined)?.trim() ?? '',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ?? '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() ?? '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() ?? '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() ?? '',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined)?.trim() ?? '',
};

const requiredKeys = [
  'apiKey', 'authDomain', 'databaseURL', 'projectId',
  'storageBucket', 'messagingSenderId', 'appId'
] as const;

export const firebaseConfigured = requiredKeys.every((key) => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.trim().length > 0;
});

let app: ReturnType<typeof initializeApp> | null = null;
let authInstance: Auth | null = null;
let databaseInstance: Database | null = null;

if (firebaseConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  databaseInstance = getDatabase(app);
}

// The app intentionally supports running without Firebase env vars.
// Export the instances with their Firebase types while preserving the runtime
// null value so existing feature guards (`if (!database)`) continue to work.
export const auth = authInstance as Auth;
export const database = databaseInstance as Database;

export const ensureAnonymousAuth = (): Promise<User> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      reject(new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables.'));
      return;
    }
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          signInAnonymously(auth)
            .then((cred) => {
              unsubscribe();
              resolve(cred.user);
            })
            .catch((err) => {
              unsubscribe();
              reject(err);
            });
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
};

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error('Firebase is not configured.');
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logoutUser = async (): Promise<void> => {
  if (!auth) return;
  await signOut(auth);
};
