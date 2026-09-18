import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { BarChart3, CalendarCheck2, Flame, Loader2, RefreshCw, Timer, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loadFocusStreak, type FocusStreak } from '../../services/focusService';

const EMPTY: FocusStreak = {
  currentStreak: 0,
  longestStreak: 0,
  todayMinutes: 0,
  activeDays: 0,
  totalMinutes: 0,
  sessions: 0,
  lastActiveDate: null,
};

function minutesLabel(value: number): string {
  const minutes = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}j` : `${hours}j ${rest}m`;
}

function dateLabel(value: string | null): string {
  if (!value) return 'Belum ada aktivitas';
  const date = new Date(`${value}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function Metric({ icon, title, value, note }: { icon: ReactNode; title: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{title}</div>
          <div className="mt-2 text-xl font-black tabular-nums text-white">{value}</div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-sky-300">{icon}</div>
      </div>
      <div className="mt-2 text-[10px] leading-4 text-slate-500">{note}</div>
    </div>
  );
}

export default function StudyStreakWidget() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<FocusStreak>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setStreak(EMPTY);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result: FocusStreak = await loadFocusStreak(user.id);
      setStreak(result);
    } catch (cause) {
      console.error('Study streak error:', cause);
      setStreak(EMPTY);
      setError(cause instanceof Error ? cause.message : 'Study streak gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!user) return null;

  return (
    <section className="hub-surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-black text-white">
            <Flame size={18} className="text-orange-300" />
            Study Streak
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Konsistensi belajar berdasarkan sesi Focus yang tersimpan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/5 p-3 text-[11px] text-rose-200/80">
          {error}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Flame size={17} />} title="Streak" value={`${streak.currentStreak} hari`} note="Streak aktif saat ini." />
        <Metric icon={<Trophy size={17} />} title="Rekor" value={`${streak.longestStreak} hari`} note="Streak terpanjang." />
        <Metric icon={<Timer size={17} />} title="Hari Ini" value={minutesLabel(streak.todayMinutes)} note="Total fokus hari ini." />
        <Metric icon={<BarChart3 size={17} />} title="Total Fokus" value={minutesLabel(streak.totalMinutes)} note={`${streak.sessions} sesi dari ${streak.activeDays} hari aktif.`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
        <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <CalendarCheck2 size={15} className="text-emerald-300" />
            Aktivitas terakhir
          </div>
          <div className="mt-2 text-sm font-black text-white">{dateLabel(streak.lastActiveDate)}</div>
          <div className="mt-1 text-[10px] text-slate-500">Tanggal dihitung berdasarkan WIB.</div>
        </div>

        <div className="rounded-2xl border border-sky-400/10 bg-sky-500/5 p-4 lg:min-w-[220px]">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-sky-300">Status</div>
          <div className="mt-2 text-sm font-black text-white">
            {streak.todayMinutes > 0 ? 'Focus tercatat' : 'Belum ada Focus'}
          </div>
          <div className="mt-1 text-[10px] leading-4 text-slate-500">
            {streak.todayMinutes > 0 ? 'Pertahankan ritmemu.' : 'Mulai Focus Mode untuk mencatat aktivitas.'}
          </div>
        </div>
      </div>
    </section>
  );
}
