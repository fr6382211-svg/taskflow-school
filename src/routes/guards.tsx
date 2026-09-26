import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/ui/Skeleton';
import { supabaseConfig } from '../lib/supabase';

export function AuthLoadingScreen() {
  const { authError } = useAuth();
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 font-black text-white">TF</div>
        {authError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 text-left shadow-sm">
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={19} /></div>
            <h1 className="text-lg font-extrabold text-slate-900">Sesi belum dapat diperiksa</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">{authError}</p>
            {!supabaseConfig.configured && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 font-mono text-xs text-slate-500">
                Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY tersedia di Vercel.
              </p>
            )}
            <button type="button" onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">
              <RefreshCw size={16} /> Muat ulang
            </button>
          </div>
        ) : (
          <>
            <Skeleton className="mx-auto h-4 w-40" />
            <Skeleton className="mx-auto mt-2 h-3 w-24" />
          </>
        )}
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isEmailVerified, user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <AuthLoadingScreen />;
  if (user && !isEmailVerified) return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email ?? '')}`} replace />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const adminByMetadata = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
  return isAdmin || adminByMetadata ? <>{children}</> : <Navigate to="/403" replace />;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}
