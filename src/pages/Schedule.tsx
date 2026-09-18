import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import ScheduleTimeline from '../components/schedule/ScheduleTimeline';
import Skeleton from '../components/ui/Skeleton';
import { useSchedule } from '../hooks/useSchedule';
import { useGoogleHolidays } from '../hooks/useGoogleHolidays';
import { getNextSchoolAgenda } from '../lib/schoolCalendar';
import { cn } from '../lib/utils';
import { trackEvent } from '../lib/analytics';
import type { ScheduleItem } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { useFathurTutoringSchedule } from '../hooks/useFathurTutoringSchedule';

const baseDayList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;
const extendedDayList = [...baseDayList, 'Sabtu'] as const;
type SchoolDay = (typeof extendedDayList)[number];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function hoursMinutes(total: number) {
  return `${Math.floor(total / 60)}j ${total % 60}m`;
}

export default function Schedule() {
  const { items, loading, error } = useSchedule();
  const { workspace } = useWorkspace();
  const dayList = workspace.id === 'mazet' ? extendedDayList : baseDayList;
  const [selectedDay, setSelectedDay] = useState<SchoolDay | null>(null);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [now, setNow] = useState(() => new Date());

  const { byDate: holidayMap } = useGoogleHolidays(now);
  const tutoring = useFathurTutoringSchedule(now);

  useEffect(() => {
    trackEvent('schedule_viewed');
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const agenda = useMemo(
    () => getNextSchoolAgenda(now, holidayMap),
    [now, holidayMap],
  );

  const agendaDay = useMemo(() => {
    if (workspace.id !== 'mazet') return agenda?.dayName ?? null;
    const names: SchoolDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(now);
    const idx: Record<string, number> = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };
    const today = idx[weekday] ?? 0;
    const currentClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
    const currentMinutes = Number(currentClock.slice(0, 2)) * 60 + Number(currentClock.slice(3, 5));
    for (let offset = 0; offset < 7; offset += 1) {
      const candidate = names[(today + offset) % 7];
      const available = items.some((item) => {
        if (!item.active || item.day !== candidate) return false;
        if (offset > 0) return true;
        const start = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5));
        return start >= currentMinutes;
      });
      if (available) return candidate;
    }
    return null;
  }, [agenda?.dayName, items, now, workspace.id]);

  useEffect(() => {
    if (agendaDay) {
      setSelectedDay(agendaDay);
    }
  }, [agendaDay]);

  const activeDay = selectedDay ?? agendaDay ?? dayList[0];

  const selected = useMemo(
    () =>
      items
        .filter(
          (item) =>
            item.day === activeDay &&
            (type === 'all' || item.type === type) &&
            `${item.subject} ${item.teacher ?? ''}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [items, activeDay, query, type],
  );

  const totalMinutes = useMemo(
    () =>
      selected.reduce((total, item) => {
        const [sh, sm] = item.startTime.split(':').map(Number);
        const [eh, em] = item.endTime.split(':').map(Number);
        return total + (eh * 60 + em) - (sh * 60 + sm);
      }, 0),
    [selected],
  );

  const subjectCount = new Set(
    selected
      .filter((item) => item.type === 'subject')
      .map((item) => item.subject),
  ).size;

  const isTomorrowMode = agenda?.daysFromToday !== 0 && agendaDay === activeDay;


  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8 fade-up">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <CalendarClock size={12} />
              Agenda {workspace.name}
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Jadwal {workspace.name}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              {isTomorrowMode
                ? `Agenda berikutnya • ${activeDay}`
                : `Agenda ${activeDay}`}{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                • {formatDate(now)}
              </span>
            </p>
          </div>

          {agenda && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 dark:border-blue-950/70 dark:bg-blue-950/30">
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-500">
                {isTomorrowMode ? 'Berikutnya' : 'Hari ini'}
              </div>
              <div className="mt-1 text-sm font-extrabold text-blue-950 dark:text-blue-100">
                {activeDay}
              </div>
              <div className="mt-1 text-[11px] text-blue-800/70 dark:text-blue-200/70">
                {agenda.daysFromToday === 0
                  ? 'Agenda hari ini'
                  : `H-${agenda.daysFromToday} • dipilih otomatis`}
              </div>
            </div>
          )}
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-2 dark:border-slate-800">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {dayList.map((day) => {
              const count = items.filter(
                (item) => item.active && item.day === day,
              ).length;
              const isActive = activeDay === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'min-w-[112px] rounded-2xl px-4 py-3 text-left transition sm:min-w-[130px]',
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900',
                  )}
                >
                  <div className="text-sm font-extrabold">
                    {day}
                  </div>
                  <div
                    className={cn(
                      'mt-1 text-[10px]',
                      isActive
                        ? 'text-blue-100'
                        : 'text-slate-400',
                    )}
                  >
                    {count} sesi
                    {day === agendaDay && (
                      <> • {isTomorrowMode ? 'Berikutnya' : 'Hari aktif'}</>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-4 dark:border-slate-800 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              className="input h-11 pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari mapel atau guru..."
            />
          </div>

          <select
            className="input h-11"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="all">Semua kegiatan</option>
            <option value="subject">Pelajaran</option>
            <option value="break">Istirahat</option>
            <option value="ceremony">Upacara</option>
            <option value="religious_break">Religi</option>
            <option value="school_activity">Kegiatan</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:grid-cols-3">
          <Metric label="Sesi" value={String(selected.length)} />
          <Metric label="Mapel" value={String(subjectCount)} />
          <Metric label="Durasi" value={hoursMinutes(totalMinutes)} />
        </div>

        <div className="p-4 sm:p-6">
          {error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <div className="font-bold">Jadwal belum bisa dimuat</div>
              <div className="mt-1 text-xs">
                Periksa koneksi Supabase atau data schedule.
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Skeleton key={value} className="h-16" />
              ))}
            </div>
          ) : selected.length ? (
            <ScheduleTimeline
              items={selected}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <Sparkles className="mx-auto text-slate-300 dark:text-slate-700" size={24} />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                Belum ada agenda
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tidak ada sesi yang cocok dengan filter saat ini.
              </p>
            </div>
          )}
        </div>
      </Card>

      {workspace.id === 'fathur' && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300"><CalendarClock size={14} /> Jadwal Les Fathur</div>
              <h2 className="mt-1 text-xl font-black">Kelas 12B</h2>
              <p className="mt-1 text-sm text-slate-500">Jadwal tampil saja. Tidak membuat tugas atau deadline.</p>
            </div>
            <div className="text-xs font-semibold text-slate-400">Hari ini + besok</div>
          </div>
          {tutoring.loading ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
          ) : tutoring.error ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-white/60 p-4 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-slate-950/30 dark:text-amber-200">Jadwal les belum dapat dimuat dari Supabase.</div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {([['Hari Ini', tutoring.today], ['Besok', tutoring.tomorrow]] as const).map(([label, dayItems]) => (
                <div key={label} className="rounded-2xl border border-white/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-sm font-black">{label}</div>
                  <div className="mt-3 space-y-2">
                    {dayItems.length === 0 ? <div className="text-xs text-slate-500">Tidak ada jadwal les.</div> : dayItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                        <div className="min-w-0"><div className="truncate text-sm font-extrabold">{item.subjectName}</div><div className="mt-0.5 text-[11px] text-slate-500">{item.activityType}</div></div>
                        <div className="shrink-0 text-xs font-black text-amber-700 dark:text-amber-300">{item.startTimeLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}
