import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose';
};

const toneMap = {
  blue: 'from-blue-500/12 to-cyan-500/8 text-blue-600 dark:text-blue-300',
  violet: 'from-violet-500/12 to-fuchsia-500/8 text-violet-600 dark:text-violet-300',
  emerald: 'from-emerald-500/12 to-teal-500/8 text-emerald-600 dark:text-emerald-300',
  amber: 'from-amber-500/12 to-orange-500/8 text-amber-600 dark:text-amber-300',
  rose: 'from-rose-500/12 to-pink-500/8 text-rose-600 dark:text-rose-300',
};

export default function MetricTile({ label, value, hint, icon: Icon, tone='blue' }: Props) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${toneMap[tone]} p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800`}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 shadow-sm dark:bg-slate-950/60"><Icon size={18}/></div>
        <ArrowUpRight size={15} className="opacity-40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
      </div>
      <div className="mt-4 text-2xl font-black tracking-tight text-slate-950 dark:text-white">{value}</div>
      <div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      {hint && <div className="mt-2 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}
