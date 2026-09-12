/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  // Firebase Web App configuration supplied by the project owner.
  apiKey: 'AIzaSyCfM5LWU6azcKdPzqzxX4f8Ld7alYOdml4',
  authDomain: 'timebox-5600d.firebaseapp.com',
  databaseURL: 'https://timebox-5600d-default-rtdb.firebaseio.com',
  projectId: 'timebox-5600d',
  storageBucket: 'timebox-5600d.firebasestorage.app',
  messagingSenderId: '117902354837',
  appId: '1:117902354837:web:c03763943c04ddf510ee9c',
  measurementId: 'G-QHBD6HDSGF',
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
