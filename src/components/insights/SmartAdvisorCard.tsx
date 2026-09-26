import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Clock3, Sparkles, Target } from 'lucide-react';
import Reveal from '../ui/Reveal';
import { computeSmartPlan } from '../../services/smartAdvisorService';
import type { FocusStreak } from '../../services/focusService';
import type { ScheduleItem, Task } from '../../types';

interface Props {
  now: Date;
  tasks: Task[];
  schedule: ScheduleItem[];
  streak: FocusStreak;
  variant?: 'compact' | 'full';
}

const RISK_STYLE: Record<string, { dot: string; label: string; text: string }> = {
  aman: { dot: 'bg-emerald-400', label: 'Aman', text: 'text-emerald-300' },
  waspada: { dot: 'bg-amber-400', label: 'Waspada', text: 'text-amber-300' },
  kritis: { dot: 'bg-rose-400', label: 'Kritis', text: 'text-rose-300' },
};

export default function SmartAdvisorCard({ now, tasks, schedule, streak, variant = 'full' }: Props) {
  const plan = useMemo(() => computeSmartPlan(now, tasks, schedule, streak), [now, tasks, schedule, streak]);
  const risk = RISK_STYLE[plan.riskLevel];

  return (
    <section className="hub-surface hub-card-interactive rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Sparkles size={17} className="text-violet-300" /> AI Study Advisor
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">{plan.headline}</p>
        </div>
        <span className={`hub-chip advisor-risk-dot border-white/10 ${risk.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} /> {risk.label}
        </span>
      </div>

      {plan.focusNext && (
        <div className="rounded-xl border border-violet-400/15 bg-violet-500/5 p-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-violet-300">
            <Target size={13} /> Kerjakan berikutnya
          </div>
          <div className="mt-1 truncate text-sm font-bold text-white">{plan.focusNext.title}</div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {plan.focusNext.subjectName} • {plan.focusNext.dueLabel}
          </div>
        </div>
      )}

      <ul className="mt-3 space-y-1.5">
        {plan.reasons.slice(0, variant === 'compact' ? 2 : 4).map((reason, index) => (
          <li key={index} className="flex items-start gap-2 text-[11px] leading-4 text-slate-400">
            <AlertTriangle size={12} className="mt-0.5 shrink-0 text-slate-600" /> {reason}
          </li>
        ))}
      </ul>

      {plan.blocks.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <Clock3 size={12} /> Rencana fokus otomatis hari ini
          </div>
          <div className="space-y-1.5">
            {plan.blocks.map((block, index) => (
              <Reveal key={block.id} delay={index * 70} className="hub-event flex items-center justify-between gap-2 !p-2.5">
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-slate-500">{block.window}</div>
                  <div className="truncate text-xs font-bold text-slate-200">
                    {block.taskTitle ?? 'Waktu luang untuk review'}
                  </div>
                </div>
                <span className="hub-chip shrink-0 normal-case tracking-normal">{block.minutes}m</span>
              </Reveal>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.025] p-3 text-[11px] leading-5 text-slate-400">
        💡 {plan.tip}
      </div>

      {variant === 'compact' && (
        <Link to="/insights" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-violet-300 hover:text-white">
          Lihat analisis lengkap <ArrowRight size={13} />
        </Link>
      )}
    </section>
  );
}
