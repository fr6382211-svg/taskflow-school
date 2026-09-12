import { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, Pause, Play, RotateCcw, Target, TimerReset } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { loadFocusStats, saveFocusSession, type FocusStats } from '../services/focusService';
import { trackEvent } from '../lib/analytics';

const PRESETS = [25, 50, 90] as const;

export default function Focus() {
  const { user } = useAuth();
  const { tasks } = useTasks();
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessions, setSessions] = useState(0);
  const [focusMinutes, setFocusMinutes] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setSessions(0);
      setFocusMinutes(0);
      return;
    }

    let active = true;

    const load = async (): Promise<void> => {
      try {
        const stats: FocusStats = await loadFocusStats(user.id);
        if (!active) return;
        setSessions(stats.sessions);
        setFocusMinutes(stats.totalMinutes);
      } catch (error) {
        console.error('Focus statistics load failed:', error);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || remaining !== 0 || !user?.id) return;

    const userId = user.id;
    const endedAt = new Date().toISOString();
    const effectiveStartedAt = startedAt ?? new Date(Date.now() - minutes * 60_000).toISOString();
    let active = true;

    setRunning(false);

    const finish = async (): Promise<void> => {
      try {
        await saveFocusSession(userId, {
          taskId: selectedTask || null,
          minutes,
          startedAt: effectiveStartedAt,
          endedAt,
        });

        if (!active) return;
        setSessions((value) => value + 1);
        setFocusMinutes((value) => value + minutes);
        void trackEvent('focus_session_completed', {
          minutes,
          taskId: selectedTask || undefined,
        });
      } catch (error) {
        console.error('Focus session save failed:', error);
      }
    };

    void finish();

    return () => {
      active = false;
    };
  }, [minutes, remaining, running, selectedTask, startedAt, user?.id]);

  const formatted = useMemo(
    () => `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`,
    [remaining],
  );

  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'submitted');

  const toggle = (): void => {
    setRunning((value) => !value);
    if (!running) {
      setStartedAt(new Date().toISOString());
      void trackEvent('focus_session_started', {
        minutes,
        taskId: selectedTask || undefined,
      });
    }
  };

  const reset = (): void => {
    setRunning(false);
    setRemaining(minutes * 60);
    setStartedAt(null);
  };

  const changePreset = (value: number): void => {
    setRunning(false);
    setMinutes(value);
    setRemaining(value * 60);
    setStartedAt(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5 fade-up">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Focus Mode</h1>
        <p className="mt-1 text-sm text-slate-500">Mode belajar fokus dengan timer, target tugas, dan riwayat sesi.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card className="p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Brain size={26} /></div>
          <div className="mt-5 text-7xl font-black tracking-tight text-slate-950 tabular-nums">{formatted}</div>
          <div className="mt-2 text-xs font-semibold uppercase tracking-[.2em] text-slate-400">{running ? 'Sedang fokus' : 'Siap mulai'}</div>

          <div className="mx-auto mt-6 flex max-w-md justify-center gap-2">
            {PRESETS.map((value) => (
              <button key={value} type="button" onClick={() => changePreset(value)} className={`rounded-xl px-4 py-2 text-sm font-bold ${minutes === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {value} menit
              </button>
            ))}
          </div>

          <div className="mx-auto mt-4 max-w-md">
            <label className="label text-left">Tugas fokus</label>
            <select className="input" value={selectedTask} onChange={(event) => setSelectedTask(event.target.value)}>
              <option value="">Belajar bebas</option>
              {activeTasks.slice(0, 50).map((task) => (
                <option key={task.id} value={task.id}>{task.title} • {task.subjectName}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={toggle} icon={running ? <Pause size={16} /> : <Play size={16} />}>{running ? 'Jeda' : 'Mulai Fokus'}</Button>
            <Button variant="outline" onClick={reset} icon={<RotateCcw size={16} />}>Reset</Button>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2"><Target size={18} className="text-blue-600" /><h2 className="font-bold">Statistik Fokus</h2></div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black">{sessions}</div><div className="text-xs text-slate-500">Sesi selesai</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-2xl font-black">{focusMinutes}</div><div className="text-xs text-slate-500">Menit fokus</div></div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2"><TimerReset size={18} className="text-blue-600" /><h2 className="font-bold">Tips</h2></div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
              <div>Matikan notifikasi yang tidak penting.</div>
              <div>Pilih satu tugas utama agar tidak berpindah konteks.</div>
              <div>Saat sesi selesai, ambil jeda sebelum sesi berikutnya.</div>
            </div>
            <Badge tone="blue" className="mt-4">Progress tersimpan di Supabase</Badge>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-600" /><h2 className="font-bold">Target hari ini</h2></div>
        <div className="mt-3 text-sm text-slate-500">{activeTasks.length ? `${activeTasks.length} tugas masih aktif. Gunakan Focus Mode untuk mengurangi beban satu per satu.` : 'Semua tugasmu sudah selesai. Mantap!'}</div>
      </Card>
    </div>
  );
}
