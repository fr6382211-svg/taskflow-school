import { useEffect, useState } from 'react';
import { Minus, Plus, Target, Loader2 } from 'lucide-react';
import GoalRing from '../ui/GoalRing';
import { useAuth } from '../../context/AuthContext';
import { loadWeeklyGoal, saveWeeklyGoal } from '../../services/goalService';

export default function WeeklyGoalCard({ completedThisWeek }: { completedThisWeek: number }) {
  const { user } = useAuth();
  const [target, setTarget] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const goal = await loadWeeklyGoal(user.id);
        if (mounted) setTarget(goal.target);
      } catch (error) {
        console.error('Weekly goal load failed:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [user?.id]);

  const adjust = async (delta: number) => {
    if (!user?.id || loading) return;
    const nextTarget = target + delta;
    setLoading(true);
    try {
      const saved = await saveWeeklyGoal(user.id, nextTarget);
      setTarget(saved.target);
    } catch (error) {
      console.error('Weekly goal save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const percent = target > 0 ? Math.round(Math.min(1, completedThisWeek / target) * 100) : 0;
  const message = percent >= 100
    ? 'Target minggu ini tercapai! 🎉'
    : percent >= 60
      ? 'Hampir sampai target minggu ini.'
      : 'Terus kerjakan tugas untuk mencapai target.';

  return (
    <section className="hub-surface hub-card-interactive rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2 text-base font-bold text-white">
        <Target size={17} className="text-emerald-300" /> Target Mingguan
      </div>
      <div className="flex items-center gap-4">
        <GoalRing value={completedThisWeek} target={target} sublabel="tugas" />
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-5 text-slate-500">{message}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Target</span>
            <button type="button" onClick={() => void adjust(-1)} disabled={loading || target <= 1} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40" aria-label="Kurangi target"><Minus size={13} /></button>
            <span className="w-8 text-center text-sm font-bold text-white tabular-nums">{target}</span>
            <button type="button" onClick={() => void adjust(1)} disabled={loading || target >= 200} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 disabled:opacity-40" aria-label="Tambah target"><Plus size={13} /></button>
            {loading ? <Loader2 size={13} className="animate-spin text-slate-500" /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
