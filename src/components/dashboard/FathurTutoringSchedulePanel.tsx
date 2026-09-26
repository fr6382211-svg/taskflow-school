import { BookOpen, CalendarDays, Clock3, GraduationCap } from 'lucide-react';
import { useFathurTutoringSchedule } from '../../hooks/useFathurTutoringSchedule';
import { useWorkspace } from '../../context/WorkspaceContext';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';

function timeToMinutes(value: string) {
  const match = value.replace('.', ':').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number(match[1]) * 60 + Number(match[2]);
}

function prettyDate(value: string) {
  const date = new Date(`${value}T12:00:00+07:00`);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function FathurTutoringSchedulePanel({ now }: { now: Date }) {
  const { workspaceId } = useWorkspace();
  const { today, tomorrow, loading, error, source } = useFathurTutoringSchedule(now);

  if (workspaceId !== 'fathur') return null;

  const renderDay = (label: string, items: typeof today) => {
    const ordered = [...items].sort((a, b) => {
      const am = timeToMinutes(a.startTimeLabel);
      const bm = timeToMinutes(b.startTimeLabel);
      return am - bm;
    });

    return (
      <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-amber-300" />
          <div className="text-sm font-black text-white">{label}</div>
          <span className="hub-chip ml-auto normal-case tracking-normal">{items.length} kegiatan</span>
        </div>

        {ordered.length === 0 ? (
          <div className="mt-4 text-xs text-slate-500">Tidak ada jadwal les pada hari ini.</div>
        ) : (
          <div className="mt-4 space-y-2">
            {ordered.map((item) => (
              <div key={item.id} className="rounded-xl border border-white/7 bg-black/10 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-300">
                      <Clock3 size={12} /> {item.startTimeLabel}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-100">{item.subjectName}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-400">
                    {item.activityType}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="hub-surface rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <GraduationCap size={17} className="text-amber-300" />
            Jadwal Les Fathur
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Kelas 12B • jadwal khusus les • hanya untuk ditampilkan, tidak membuat tugas.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
          <BookOpen size={14} /> {today[0]?.scheduleDate ? prettyDate(today[0].scheduleDate) : 'Jadwal aktif'}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <div className="mt-4">
          {error ? (
            <div className="mb-3 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-3 text-xs leading-5 text-amber-200">
              {String(error)}
            </div>
          ) : null}
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            Sumber: {source === 'supabase' ? 'Supabase' : 'Data jadwal terintegrasi'}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {renderDay('Hari Ini', today)}
            {renderDay('Besok', tomorrow)}
          </div>
        </div>
      )}
    </section>
  );
}
