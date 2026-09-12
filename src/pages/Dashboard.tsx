import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  MonitorPlay,
  Plus,
  Search,
  Sparkles,
  TimerReset,
  TrendingUp,
  FileDown,
  ListChecks,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import TaskForm from '../components/tasks/TaskForm';

import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTasks, useTaskStats } from '../hooks/useTasks';
import { useSchedule } from '../hooks/useSchedule';
import { useNotifications } from '../hooks/useNotifications';
import { useGoogleHolidays } from '../hooks/useGoogleHolidays';
import { useSchoolAgenda } from '../hooks/useSchoolAgenda';
import { formatDate } from '../lib/utils';
import { jakartaWeekday, type CalendarDay } from '../lib/schoolCalendar';
import { subscribeAnnouncements } from '../services/announcementService';
import type { Announcement, ScheduleItem } from '../types';
import TimeSystemPanel from '../components/dashboard/TimeSystemPanel';
import LocationIntelligencePanel from '../components/dashboard/LocationIntelligencePanel';
import FathurTutoringSchedulePanel from '../components/dashboard/FathurTutoringSchedulePanel';
import AcademicCommandCenter from '../components/dashboard/AcademicCommandCenter';
import { useFathurTutoringSchedule } from '../hooks/useFathurTutoringSchedule';

function formatClock(date: Date) {
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function timeStringToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return Number.POSITIVE_INFINITY;
  return hour * 60 + minute;
}

function jakartaCurrentMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}


function agendaLabel(daysFromToday: number | undefined) {
  if (!daysFromToday) return 'Hari ini';
  if (daysFromToday === 1) return 'Besok';
  return `${daysFromToday} hari lagi`;
}

function priorityTone(priority: string | undefined) {
  const value = String(priority ?? '').toLowerCase();
  if (value.includes('high') || value.includes('urgent') || value.includes('tinggi')) return '#ef4444';
  if (value.includes('medium') || value.includes('sedang')) return '#f59e0b';
  return '#6366f1';
}


function mergeConsecutiveSubjects(items: ScheduleItem[]) {
  const sorted = [...items]
    .filter((item) => item.type === 'subject')
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  const merged: Array<(typeof sorted)[number] & { mergedIds: string[]; mergedStart: string; mergedEnd: string }> = [];

  for (const item of sorted) {
    const previous = merged[merged.length - 1];
    const sameSubject = previous && previous.subject.trim().toLowerCase() === item.subject.trim().toLowerCase();
    const touches = previous && timeStringToMinutes(previous.mergedEnd) >= timeStringToMinutes(item.startTime);

    if (sameSubject && touches) {
      previous.mergedEnd = timeStringToMinutes(item.endTime) > timeStringToMinutes(previous.mergedEnd)
        ? item.endTime
        : previous.mergedEnd;
      previous.mergedIds.push(item.id);
      continue;
    }

    merged.push({
      ...item,
      mergedIds: [item.id],
      mergedStart: item.startTime,
      mergedEnd: item.endTime,
    });
  }

  return merged;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { workspace, workspaceId } = useWorkspace();
  const { tasks, loading: tasksLoading } = useTasks();
  const { items: schedule, loading: scheduleLoading } = useSchedule();
  const { notifications } = useNotifications();
  const { events: holidays, byDate: holidayMap } = useGoogleHolidays(new Date());
  const stats = useTaskStats(tasks);
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const tutoring = useFathurTutoringSchedule(now);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAnnouncements(
      setAnnouncements,
      (error) => console.error('Announcement load failed', error),
    );
    return unsubscribe;
  }, []);

  const { agenda, activeDay, agendaTasks, agendaSchedule } = useSchoolAgenda(
    now,
    holidayMap,
    tasks,
    schedule,
    workspaceId,
  );

  const agendaIsToday = (agenda?.daysFromToday ?? 0) === 0;
  const currentAgendaItem = useMemo(() => {
    if (!agendaIsToday) return null;
    const currentMinutes = jakartaCurrentMinutes(now);
    return agendaSchedule.find((item) => {
      const start = timeStringToMinutes(item.startTime);
      const end = timeStringToMinutes(item.endTime);
      return item.type === 'subject' && currentMinutes >= start && currentMinutes < end;
    }) ?? null;
  }, [agendaIsToday, now, agendaSchedule]);

  const nextAgendaItem = useMemo(() => {
    if (!agendaSchedule.length) return null;
    const currentMinutes = jakartaCurrentMinutes(now);
    return agendaSchedule.find((item) => {
      if (item.type !== 'subject') return false;
      if (!agendaIsToday) return true;
      return timeStringToMinutes(item.startTime) > currentMinutes;
    }) ?? null;
  }, [agendaIsToday, now, agendaSchedule]);

  const mergedAgendaSchedule = useMemo(() => mergeConsecutiveSubjects(agendaSchedule), [agendaSchedule]);

  const priorityTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => {
          const aTime = new Date(`${a.dueDate}T${a.dueTime ?? '23:59'}`).getTime();
          const bTime = new Date(`${b.dueDate}T${b.dueTime ?? '23:59'}`).getTime();
          return aTime - bTime;
        })
        .slice(0, 5),
    [tasks],
  );

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const unread = notifications.filter((item) => !item.read).length;
  const firstName = profile?.name?.split(' ')[0] ?? 'Pengguna';
  const todayLabel = formatDate(now.toISOString().slice(0, 10));

  const tomorrowSubjects = useMemo(() => {
    const days: CalendarDay[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const today = jakartaWeekday(now);
    const todayIndex = days.indexOf(today);
    const tomorrow = days[(todayIndex + 1) % days.length];
    const unique: string[] = [];
    for (const item of schedule) {
      if (item.day !== tomorrow || item.type !== 'subject' || item.active === false) continue;
      const subject = item.subject.trim();
      if (subject && !unique.includes(subject)) unique.push(subject);
    }
    return { day: tomorrow, subjects: unique };
  }, [now, schedule]);

  return (
    <div className="hub-dashboard mx-auto w-full max-w-[1680px] space-y-4 pb-10 fade-up">
      <section className="hub-surface relative overflow-hidden rounded-2xl p-4 sm:p-5 lg:p-6">
        <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-140px] left-[25%] h-72 w-72 rounded-full bg-emerald-500/6 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="hub-chip border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Akademik aktif
              </span>
              <span className="hub-chip">{workspace.schoolLabel}</span><span className="hub-chip border-violet-400/20 bg-violet-400/10 text-violet-200">{workspace.eyebrow}</span>
              <span className="hub-chip font-mono normal-case tracking-normal">{formatClock(now)} WIB</span>
            </div>
            <h1 className="text-[clamp(28px,4vw,42px)] font-extrabold tracking-[-0.045em] text-white">
              Selamat datang, {firstName} 👋
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {stats.total > 0
                ? `Kamu punya ${stats.pending} tugas aktif dan ${stats.completed} tugas selesai. Fokuskan energi ke deadline terdekat.`
                : 'Semua agenda belajar, tugas, jadwal, TimeBox, dan MediaBox ada di satu workspace.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg border border-white/7 bg-white/4 px-2.5 py-1.5 text-slate-300">{todayLabel}</span>
              <span className="rounded-lg border border-white/7 bg-white/4 px-2.5 py-1.5 text-slate-300">{agenda?.dayName ?? 'Hari libur'}</span>
              {holidays.length > 0 && (
                <span className="rounded-lg border border-rose-400/15 bg-rose-400/8 px-2.5 py-1.5 text-rose-300">
                  {holidays.length} kalender libur
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button icon={<Plus size={16} />} onClick={() => setOpen(true)}>
              Tugas baru
            </Button>
            <Button
              variant="outline"
              icon={<TimerReset size={16} />}
              onClick={() => navigate('/focus')}
            >
              Focus 25m
            </Button>
            <Button
              variant="outline"
              icon={<MonitorPlay size={16} />}
              onClick={() => navigate('/timebox')}
            >
              TimeBox
            </Button>
          </div>
        </div>
      </section>

      <TimeSystemPanel />

      <section className="hub-surface rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-white">
              <ListChecks size={17} className="text-sky-300" />
              Besok • {tomorrowSubjects.day}
            </div>
            <p className="mt-1 text-xs text-slate-500">Hanya mata pelajaran yang benar-benar memiliki sesi besok. Satu mata pelajaran hanya tampil satu kali.</p>
          </div>
          <Link to="/tasks/summary" className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-400/15">
            <FileDown size={15} /> Ringkasan PDF tugas
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tomorrowSubjects.subjects.length === 0 ? (
            <span className="rounded-xl border border-dashed border-white/10 px-3 py-2 text-xs font-semibold text-slate-500">Tidak ada sesi pelajaran besok.</span>
          ) : tomorrowSubjects.subjects.map((subject) => (
            <span key={subject} className="rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2 text-sm font-bold text-slate-200">{subject}</span>
          ))}
        </div>
      </section>

      <FathurTutoringSchedulePanel now={now} />

      <LocationIntelligencePanel schedule={schedule} tutoringSchedule={tutoring.items} />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tasksLoading ? (
          [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-[118px] rounded-2xl" />)
        ) : (
          <>
            <div className="hub-kpi">
              <div className="flex items-center justify-between"><span className="hub-kpi__label">Active tasks</span><BellRing size={15} className="text-rose-400" /></div>
              <div className="hub-kpi__value">{stats.pending}</div>
              <div className="flex items-center justify-between gap-3"><span className="hub-kpi__meta">{stats.overdue} terlambat</span><span className="text-[10px] font-mono text-rose-300">Due today</span></div>
            </div>
            <div className="hub-kpi">
              <div className="flex items-center justify-between"><span className="hub-kpi__label">Focus metric</span><TrendingUp size={15} className="text-emerald-400" /></div>
              <div className="hub-kpi__value">{completionRate}%</div>
              <div className="hub-progress"><span style={{ width: `${Math.max(4, completionRate)}%`, background: '#10b981' }} /></div>
            </div>
            <div className="hub-kpi">
              <div className="flex items-center justify-between"><span className="hub-kpi__label">{agendaLabel(agenda?.daysFromToday)} agenda</span><CalendarDays size={15} className="text-sky-400" /></div>
              <div className="hub-kpi__value">{agendaSchedule.length}</div>
              <div className="hub-kpi__meta">{activeDay ?? 'Tidak ada agenda'}</div>
            </div>
            <div className="hub-kpi">
              <div className="flex items-center justify-between"><span className="hub-kpi__label">Streak</span><Flame size={15} className="text-amber-400" /></div>
              <div className="hub-kpi__value">{Math.max(1, Math.min(30, stats.completed))}</div>
              <div className="hub-kpi__meta">hari produktif</div>
            </div>
          </>
        )}
      </section>

      <AcademicCommandCenter now={now} schedule={schedule} tasks={tasks} tutoring={tutoring} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="hub-surface rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-white"><CheckCircle2 size={17} className="text-indigo-300" /> Priority Sprint Tasks <span className="hub-chip normal-case tracking-normal">{priorityTasks.length} items</span></div>
                <p className="mt-1 text-xs text-slate-500">Deadline terdekat diprioritaskan lebih dulu.</p>
              </div>
              <Link to="/tasks" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white">Semua tugas <ArrowRight size={13} /></Link>
            </div>

            <div className="space-y-2">
              {priorityTasks.length === 0 ? (
                <EmptyState title="Semua tugas selesai" description="Belum ada tugas aktif yang perlu dikerjakan." action={<Button size="sm" onClick={() => setOpen(true)}>Buat tugas</Button>} />
              ) : (
                priorityTasks.map((task) => {
                  const tone = priorityTone(task.priority);
                  const progress = task.status === 'completed' ? 100 : task.status === 'submitted' ? 85 : task.status === 'in_progress' ? 50 : task.status === 'overdue' ? 30 : 10;
                  return (
                    <div key={task.id} className="hub-task">
                      <span className="hub-task__accent" style={{ background: tone }} />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-bold text-slate-100">{task.title}</div>
                        <div className="hub-task__meta">
                          {task.subjectName || 'Tanpa mata pelajaran'} • {task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ''}
                        </div>
                      </div>
                      <div className="hub-task__score">
                        <div className="mb-1 text-[9px] font-mono text-slate-500">{Math.max(0, Math.min(100, progress))}%</div>
                        <div className="hub-progress"><span style={{ width: `${Math.max(5, Math.min(100, progress))}%`, background: tone }} /></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="hub-surface rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-white"><CalendarDays size={17} className="text-emerald-300" /> {agendaLabel(agenda?.daysFromToday)} — Academic Timeline</div>
                <p className="mt-1 text-xs text-slate-500">{agenda?.dayName ?? 'Tidak ada agenda'} • {agendaLabel(agenda?.daysFromToday)}</p>
              </div>
              <Link to="/schedule" className="text-xs font-bold text-emerald-300 hover:text-white">Kelola jadwal</Link>
            </div>
            {scheduleLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : agendaSchedule.length === 0 ? (
              <EmptyState title="Belum ada jadwal" description="Tidak ada agenda sekolah untuk waktu ini." />
            ) : (
              <div className="hub-timeline">
                {mergedAgendaSchedule.slice(0, 8).map((item, index) => {
                  const selectedToday = agendaIsToday;
                  const isCurrent = selectedToday && item.mergedIds.includes(currentAgendaItem?.id ?? '');
                  const isNext = !isCurrent && item.mergedIds.includes(nextAgendaItem?.id ?? '');
                  const status = isCurrent ? 'Now' : (isNext ? 'Next' : `Period ${index + 1}`);
                  return (
                    <div key={`${item.mergedStart}-${item.subject}-${index}`} className={`hub-event ${isCurrent ? 'hub-event--active' : ''}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="hub-event__time">{item.mergedStart}–{item.mergedEnd} WIB</span>
                        <span className="hub-chip normal-case tracking-normal">{status}</span>
                      </div>
                      <div className="hub-event__title truncate">{item.subject}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="hub-surface rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-white"><Sparkles size={17} className="text-violet-300" /> Productivity Velocity</div>
                <p className="mt-1 text-xs text-slate-500">Progress tugas yang sudah tersimpan di workspace.</p>
              </div>
              <span className="hub-chip">Live</span>
            </div>
            <div className="grid grid-cols-7 items-end gap-2 rounded-xl border border-white/5 bg-white/[0.025] p-4">
              {[12, 18, 15, Math.max(8, Math.round(completionRate / 7)), 8, 5, 3].map((value, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div className="flex h-24 w-full max-w-[42px] items-end rounded-lg bg-white/[0.03] p-1">
                    <div className="w-full rounded-md bg-gradient-to-t from-indigo-500 via-violet-400 to-emerald-300" style={{ height: `${Math.max(8, Math.min(100, value * 4))}%` }} />
                  </div>
                  <span className={`text-[9px] font-mono ${index === 3 ? 'text-emerald-300' : 'text-slate-600'}`}>{['M','T','W','T','F','S','S'][index]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="hub-side-stat"><span>Completed</span><span>{stats.completed}</span></div>
              <div className="hub-side-stat"><span>Completion</span><span>{completionRate}%</span></div>
              <div className="hub-side-stat"><span>Alerts</span><span>{unread}</span></div>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="hub-surface rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-white"><Clock3 size={16} className="text-emerald-300" /> TimeBox Digital HUD</div><span className="hub-chip font-mono normal-case tracking-normal">GMT+7</span></div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-center">
              <div className="hub-clock">{formatClock(now)}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.15em] text-slate-500">{todayLabel}</div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-3 py-2.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agenda</span><span className="text-xs font-bold text-slate-200">{agenda?.dayName ? `${agendaLabel(agenda.daysFromToday)} • ${agenda.dayName}` : 'Libur'}</span></div>
            <div className="mt-3 grid grid-cols-2 gap-2"><button className="min-h-10 rounded-lg border border-white/7 bg-indigo-500/15 px-3 text-xs font-bold text-indigo-200" onClick={() => navigate('/timebox')}>Buka TimeBox</button><button className="min-h-10 rounded-lg border border-white/7 bg-white/[0.03] px-3 text-xs font-bold text-slate-300" onClick={() => navigate('/focus')}>Focus 25m</button></div>
          </section>

          <section className="hub-surface rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-white"><MonitorPlay size={16} className="text-sky-300" /> YouTube MediaBox</div><span className="hub-chip normal-case tracking-normal">Ready</span></div>
            <div className="hub-media-thumb"><div><MonitorPlay size={22} /> <span className="sr-only">MediaBox</span></div></div>
            <div className="mt-3 text-sm font-bold text-white">Study stream & Watch Party</div>
            <p className="mt-1 text-xs leading-5 text-slate-500">Cari video, atur antrean, buat room, dan kontrol playback tanpa keluar dari workspace.</p>
            <button onClick={() => navigate('/timebox')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/7 bg-white/[0.03] px-3 py-2.5 text-xs font-bold text-slate-200 transition hover:border-indigo-400/30 hover:bg-indigo-500/10"><Search size={14} /> Buka MediaBox</button>
          </section>

          <section className="hub-surface rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-bold text-white"><BellRing size={16} className="text-amber-300" /> Recent activity</div><Link to="/notifications" className="text-[10px] font-bold text-indigo-300">{unread} unread</Link></div>
            <div className="space-y-2">
              {announcements.slice(0, 3).map((item, index) => (
                <div key={`${item.id}-${index}`} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-xs font-bold text-slate-200">{item.title}</div>
                  <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{item.body}</div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/7 p-5 text-center text-xs text-slate-600">Belum ada pengumuman baru.</div>
              )}
            </div>
          </section>
        </aside>
      </div>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-white">Tambah Tugas</h2><p className="mt-1 text-xs text-slate-500">Masukkan tugas baru tanpa meninggalkan dashboard.</p></div>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-white/5" onClick={() => setOpen(false)} aria-label="Tutup">×</button>
            </div>
            <TaskForm open={open} onClose={() => setOpen(false)} onSaved={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
