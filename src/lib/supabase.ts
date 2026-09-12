import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const BUILD_FALLBACK_URL = 'https://ubwzzqzsibkatfdibork.supabase.co';
const BUILD_FALLBACK_PUBLISHABLE_KEY = 'sb_publishable_fsowfcf0Rgf8bmlP9vs_0g_lEaAF0Yn';

const url = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || BUILD_FALLBACK_URL).trim();
const key = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  BUILD_FALLBACK_PUBLISHABLE_KEY
).trim();

export const supabaseConfig = {
  url: url || '',
  key: key || '',
  configured: Boolean(url && key),
};

type StorageMode = 'persistent' | 'session';
let desiredStorageMode: StorageMode = 'persistent';

const authStorage = {
  getItem(keyName: string) {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(keyName) ?? window.localStorage.getItem(keyName);
  },
  setItem(keyName: string, value: string) {
    if (typeof window === 'undefined') return;
    const target = desiredStorageMode === 'session' ? window.sessionStorage : window.localStorage;
    const other = desiredStorageMode === 'session' ? window.localStorage : window.sessionStorage;
    other.removeItem(keyName);
    target.setItem(keyName, value);
  },
  removeItem(keyName: string) {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(keyName);
    window.localStorage.removeItem(keyName);
  },
};

export function setAuthPersistence(remember: boolean) {
  desiredStorageMode = remember ? 'persistent' : 'session';
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseConfig.configured) {
    throw new Error(
      'Supabase belum dikonfigurasi. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di environment deployment.'
    );
  }

  client ??= createClient(supabaseConfig.url, supabaseConfig.key, {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const actual = getSupabase() as unknown as Record<PropertyKey, unknown>;
    const value = Reflect.get(actual, property, receiver);
    return typeof value === 'function' ? value.bind(actual) : value;
  },
});

const PRODUCTION_APP_URL = 'https://pelajaranfathur.vercel.app';
export const APP_URL = ((import.meta.env.VITE_APP_URL as string | undefined) || PRODUCTION_APP_URL).replace(/\/$/, '');
