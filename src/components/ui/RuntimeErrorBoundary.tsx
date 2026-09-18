import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { supabaseConfig } from '../../lib/supabase';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class RuntimeErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FATHUR SCHOOL HUB runtime error', error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isConfigError = !supabaseConfig.configured;

    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertTriangle size={23} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                Fathur School Hub
              </div>
              <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                Halaman gagal dimuat
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Terjadi error pada halaman ini. Workspace utama tidak perlu ikut mati; gunakan tombol di bawah untuk memulihkan tampilan.
              </p>
            </div>
          </div>

          {isConfigError && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              Konfigurasi Supabase belum lengkap untuk deployment ini.
            </div>
          )}

          <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <summary className="cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
              Detail teknis
            </summary>
            <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {error.stack || error.message}
            </pre>
          </details>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500"
            >
              <RefreshCw size={16} /> Coba lagi
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = '/dashboard'; }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Home size={16} /> Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
