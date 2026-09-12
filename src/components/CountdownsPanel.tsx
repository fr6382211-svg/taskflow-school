import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, TimerReset } from 'lucide-react';

const ORIGIN = new Date('2026-06-02T18:55:00+07:00');

type BirthdayTarget = { label: string; day: number; month: number; className: string };
function targetDate(now: Date, month: number, day: number) {
  const target = new Date(now.getFullYear(), month, day, 0, 0, 0, 0);
  if (target.getTime() <= now.getTime()) target.setFullYear(target.getFullYear() + 1);
  return target;
}
function durationParts(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    months: Math.floor(totalSeconds / 2629800),
    weeks: Math.floor(totalSeconds / 604800),
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds,
  };
}
function elapsedSince(originMs: number, nowMs: number) {
  if (nowMs < originMs) return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const start = new Date(originMs);
  let cursor = new Date(start);
  let months = 0;
  while (true) {
    const next = new Date(cursor);
    next.setMonth(next.getMonth() + 1);
    if (next.getTime() > nowMs) break;
    months += 1;
    cursor = next;
  }
  let remaining = nowMs - cursor.getTime();
  const weeks = Math.floor(remaining / 604800000); remaining %= 604800000;
  const days = Math.floor(remaining / 86400000); remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000); remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000); remaining %= 60000;
  const seconds = Math.floor(remaining / 1000);
  return { months, weeks, days, hours, minutes, seconds };
}

function UnitGrid({ parts }: { parts: ReturnType<typeof durationParts> }) {
  const cells = [['Bulan', parts.months], ['Minggu', parts.weeks], ['Hari', parts.days], ['Jam', parts.hours], ['Menit', parts.minutes], ['Detik', parts.seconds]];
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">{cells.map(([label, value]) => <div key={label} className="rounded-xl border border-white/7 bg-white/[0.03] p-3 text-center"><div className="font-mono text-xl font-black text-white">{String(value).padStart(2, '0')}</div><div className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</div></div>)}</div>;
}

function BirthdayCard({ target, now }: { target: BirthdayTarget; now: Date }) {
  const date = useMemo(() => targetDate(now, target.month, target.day), [now, target.month, target.day]);
  const parts = durationParts(date.getTime() - now.getTime());
  return <div className={`rounded-2xl border p-4 ${target.className}`}><div className="flex items-center gap-2 text-sm font-bold text-white"><CalendarHeart size={16} /> {target.label}</div><div className="mt-1 text-[11px] text-slate-400">Target berikutnya • {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div><div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{[['Bulan', parts.months], ['Minggu', parts.weeks], ['Hari', parts.days], ['Jam', parts.hours], ['Menit', parts.minutes], ['Detik', parts.seconds]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/20 p-2.5 text-center"><div className="font-mono text-base font-black text-white">{String(value).padStart(2, '0')}</div><div className="mt-0.5 text-[8px] uppercase tracking-widest text-slate-500">{label}</div></div>)}</div></div>;
}

export default function CountdownsPanel() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(id); }, []);
  const elapsed = elapsedSince(ORIGIN.getTime(), now.getTime());
  return <section className="hub-surface rounded-2xl p-4 sm:p-5"><div className="mb-4 flex items-center gap-2 text-base font-bold text-white"><TimerReset size={17} className="text-cyan-300" /> Sistem Waktu & Countdown</div><p className="mb-4 text-xs leading-5 text-slate-500">Semua timer memakai waktu Asia/Jakarta. Countdown ulang tahun akan otomatis berpindah ke tahun berikutnya setelah target terlewati.</p><div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4"><div className="text-sm font-bold text-cyan-200">Waktu berlalu sejak 2 Juni 2026 • 18:55 WIB</div><div className="mt-1 text-[10px] text-slate-500">02 Juni 2026 18:55 WIB → sekarang</div><div className="mt-4"><UnitGrid parts={elapsed} /></div></div><div className="mt-3 grid gap-3 lg:grid-cols-2"><BirthdayCard target={{ label: '30 Juni • Mazet', day: 30, month: 5, className: 'border-violet-400/15 bg-violet-400/5' }} now={now} /><BirthdayCard target={{ label: '12 April • Fathur', day: 12, month: 3, className: 'border-indigo-400/15 bg-indigo-400/5' }} now={now} /></div></section>;
}
