import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfig } from '../lib/supabase';
import { login as loginService, logout as logoutService, register as registerService, resetPassword as resetService } from '../services/authService';
import { subscribeUserProfile } from '../services/userService';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (e: string, p: string, r: boolean) => Promise<void>;
  register: (n: string, e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (e: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(r: Record<string, unknown>): UserProfile {
  return {
    uid: String(r.id),
    name: String(r.name ?? 'Pengguna'),
    email: String(r.email ?? ''),
    photoURL: r.photo_url ? String(r.photo_url) : undefined,
    role: r.role === 'admin' ? 'admin' : 'user',
    status: r.status === 'disabled' ? 'disabled' : 'active',
    createdAt: r.created_at == null ? undefined : String(r.created_at),
    updatedAt: r.updated_at == null ? undefined : String(r.updated_at),
    lastLoginAt: r.last_login_at == null ? undefined : String(r.last_login_at),
  };
}

function friendlyAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (!message) return 'Tidak dapat memeriksa sesi. Silakan coba lagi.';
  if (/Invalid API key|Invalid JWT|Failed to fetch|NetworkError|fetch failed/i.test(message)) {
    return 'Tidak dapat terhubung ke Supabase. Periksa konfigurasi deployment dan koneksi internet.';
  }
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const profileCleanupRef = useRef<(() => void) | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const attachProfile = (nextUser: User | null) => {
      profileCleanupRef.current?.();
      profileCleanupRef.current = undefined;
      if (!nextUser) {
        if (mountedRef.current) setProfile(null);
        return;
      }

      try {
        profileCleanupRef.current = subscribeUserProfile(
          nextUser.id,
          (nextProfile) => {
            if (!mountedRef.current) return;
            setProfile(nextProfile);
            setAuthError(null);
          },
          (error) => {
            if (!mountedRef.current) return;
            console.error('TASKFLOW profile load error', error);
            setProfile(null);
            setAuthError(friendlyAuthError(error));
          },
        );
      } catch (error) {
        console.error('TASKFLOW profile subscription error', error);
        if (mountedRef.current) {
          setProfile(null);
          setAuthError(friendlyAuthError(error));
        }
      }
    };

    const initialize = async () => {
      try {
        if (!supabaseConfig.configured) {
          setAuthError('Konfigurasi Supabase belum tersedia pada deployment ini.');
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!mountedRef.current) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        attachProfile(data.session?.user ?? null);
      } catch (error) {
        console.error('TASKFLOW auth initialization error', error);
        if (mountedRef.current) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthError(friendlyAuthError(error));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mountedRef.current) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        attachProfile(nextSession.user);
      } else {
        attachProfile(null);
      }
    });

    void initialize();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      profileCleanupRef.current?.();
      profileCleanupRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (profile?.status === 'disabled' && user) {
      void logoutService().catch((error) => console.error('TASKFLOW disabled-user logout failed', error));
    }
  }, [profile?.status, user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    loading,
    authError,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    login: async (email, password, remember) => {
      setAuthError(null);
      await loginService(email, password, remember);
    },
    register: async (name, email, password) => {
      setAuthError(null);
      await registerService(name, email, password);
    },
    logout: logoutService,
    resetPassword: resetService,
    refreshProfile: async () => {
      if (!user) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();
      if (error) throw error;
      setProfile(data ? mapUser(data as Record<string, unknown>) : null);
    },
  }), [user, session, profile, loading, authError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
