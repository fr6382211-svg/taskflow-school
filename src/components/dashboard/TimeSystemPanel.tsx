import { useEffect, useMemo, useState } from 'react';
import { CalendarHeart, HeartHandshake } from 'lucide-react';

type DurationParts = {
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const UNITS: Array<[string, keyof DurationParts]> = [
  ['Bulan', 'months'],
  ['Minggu', 'weeks'],
  ['Hari', 'days'],
  ['Jam', 'hours'],
  ['Menit', 'minutes'],
  ['Detik', 'seconds'],
];

const RELATIONSHIP_START = new Date('2026-06-02T18:55:00+07:00');

function jakartaYear(now: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
    }).format(now),
  );
}

function birthdayTarget(month: number, day: number, now: Date): Date {
  const year = jakartaYear(now);
  const make = (targetYear: number) =>
    new Date(
      `${targetYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00+07:00`,
    );
  const current = make(year);
  return current.getTime() > now.getTime()
    ? current
    : make(year + 1);
}

function splitDuration(from: Date, to: Date): DurationParts {
  if (to.getTime() <= from.getTime()) {
    return { months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  let cursor = new Date(from.getTime());
  let months = 0;

  while (months < 2400) {
    const next = new Date(cursor.getTime());
    next.setUTCMonth(next.getUTCMonth() + 1);
    if (next.getTime() > to.getTime()) break;
    cursor = next;
    months += 1;
  }

  let remaining = to.getTime() - cursor.getTime();
  const weeks = Math.floor(remaining / 604800000);
  remaining %= 604800000;
  const days = Math.floor(remaining / 86400000);
  remaining %= 86400000;
  const hours = Math.floor(remaining / 3600000);
  remaining %= 3600000;
  const minutes = Math.floor(remaining / 60000);
  remaining %= 60000;
  const seconds = Math.floor(remaining / 1000);

  return { months, weeks, days, hours, minutes, seconds };
}

function BirthdayCard({
  label,
  target,
  tone,
  now,
}: {
  label: string;
  target: Date;
  tone: 'indigo' | 'rose';
  now: Date;
}) {
  const parts = useMemo(() => splitDuration(now, target), [now, target]);
  const className = tone === 'rose'
    ? 'border-rose-400/15 bg-rose-500/5'
    : 'border-indigo-400/15 bg-indigo-500/5';
  const iconClass = tone === 'rose' ? 'text-rose-300' : 'text-indigo-300';

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">
            Ulang Tahun {label}
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {target.toLocaleDateString('id-ID', {
              timeZone: 'Asia/Jakarta',
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
        <CalendarHeart size={18} className={iconClass} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {UNITS.map(([name, key]) => (
          <div key={name} className="rounded-xl bg-black/15 px-2 py-2.5 text-center">
            <div className="font-mono text-base font-black tabular-nums text-white">
              {String(parts[key]).padStart(2, '0')}
            </div>
            <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
              {name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimeSystemPanel() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const fathurTarget = useMemo(() => birthdayTarget(4, 12, now), [now]);
  const mazetTarget = useMemo(() => birthdayTarget(6, 30, now), [now]);
  const relationship = useMemo(
    () => splitDuration(RELATIONSHIP_START, now),
    [now],
  );

  return (
    <section className="hub-surface rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <HeartHandshake size={17} className="text-rose-300" />
          Perjalanan Kita
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Dua hari spesial dan perjalanan hubungan kita, dihitung realtime mengikuti WIB.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <BirthdayCard label="Fathur • 12 April" target={fathurTarget} tone="indigo" now={now} />
        <BirthdayCard label="Mazet • 30 Juni" target={mazetTarget} tone="rose" now={now} />
      </div>

      <div className="mt-3 rounded-2xl border border-rose-400/15 bg-gradient-to-br from-rose-500/10 via-violet-500/5 to-transparent p-4 sm:p-5">
        <div className="text-sm font-black text-white">Hubungan kita sudah sejauh ini</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-400">
          Terhitung sejak 2 Juni 2026 pukul 18:55 WIB.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {UNITS.map(([name, key]) => (
            <div key={name} className="rounded-xl border border-white/5 bg-black/10 px-2 py-3 text-center">
              <div className="font-mono text-lg font-black tabular-nums text-white">
                {relationship[key]}
              </div>
              <div className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                {name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
