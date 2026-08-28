import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { supabaseConfig } from '../../lib/supabase';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class RuntimeErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TASKFLOW runtime error', error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isConfigError = !supabaseConfig.configured;
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-6 py-12 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600"><AlertTriangle size={22} /></div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">TASKFLOW SCHOOL</p>
          <h1 className="mt-2 text-2xl font-black">Aplikasi belum dapat dijalankan</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {isConfigError
              ? 'Konfigurasi Supabase belum tersedia pada deployment ini.'
              : 'Terjadi kesalahan saat aplikasi dijalankan.'}
          </p>
          {isConfigError && (
            <div className="mt-5 rounded-2xl bg-black/20 p-4 font-mono text-xs leading-6 text-slate-300">
              <div>VITE_SUPABASE_URL = {supabaseConfig.url ? 'OK' : 'BELUM DIISI'}</div>
              <div>VITE_SUPABASE_PUBLISHABLE_KEY = {supabaseConfig.key ? 'OK' : 'BELUM DIISI'}</div>
            </div>
          )}
          <details className="mt-5 rounded-2xl bg-black/20 p-4 text-xs text-slate-400">
            <summary className="cursor-pointer font-semibold text-slate-300">Detail teknis</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words">{error.message}</pre>
          </details>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
          >
            <RefreshCw size={16} /> Muat ulang
          </button>
        </div>
      </div>
    );
  }
}
