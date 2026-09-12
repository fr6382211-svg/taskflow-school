import { useMemo, useState } from 'react';
import { BookOpenCheck, CalendarDays, ChevronLeft, ChevronRight, CircleAlert, Download, GraduationCap, PartyPopper, Sun } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useTasks } from '../hooks/useTasks';
import { useSchedule } from '../hooks/useSchedule';
import { useGoogleHolidays } from '../hooks/useGoogleHolidays';
import { countdownToSchoolDay, dateKey, isHoliday, isWeekend } from '../lib/schoolCalendar';
import { cn } from '../lib/utils';
import { exportCalendarIcs } from '../lib/ics';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const DAY_NAME: Record<number, string> = { 0: 'Minggu', 1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu' };

function calendarCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? new Date(year, month, day) : null;
  });
}

export default function Calendar() {
  const { tasks } = useTasks();
  const { items: schedule } = useSchedule();
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const { events: holidays, byDate: holidayByDate, loading: holidayLoading, error: holidayError } = useGoogleHolidays(cursor);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => calendarCells(year, month), [year, month]);
  const todayKey = dateKey(new Date());
  const countdown = useMemo(() => countdownToSchoolDay(new Date(), holidayByDate), [holidayByDate]);
  const taskCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const task of tasks) map.set(task.dueDate, (map.get(task.dueDate) || 0) + 1);
    return map;
  }, [tasks]);

  const selectedDate = new Date(`${selected}T12:00:00+07:00`);
  const selectedTasks = tasks.filter((task) => task.dueDate === selected);
  const selectedHoliday = holidayByDate.get(selected) || [];
  const selectedDayName = DAY_NAME[selectedDate.getDay()];
  const selectedSchedule = schedule.filter((item) => item.day === selectedDayName && item.active).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const schoolDay = !isWeekend(selected) && selectedHoliday.length === 0;
  const title = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cursor);

  function moveMonth(delta: number) { setCursor(new Date(year, month + delta, 1)); }

  return <div className="space-y-5 fade-up">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><h1 className="text-2xl font-extrabold tracking-tight">Kalender Pintar</h1><p className="mt-1 text-sm text-slate-500">Deadline tugas, jadwal sekolah, akhir pekan, dan hari libur Indonesia.</p></div>
      <div className="flex items-center gap-2"><Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => exportCalendarIcs(tasks, schedule, cursor)}>Export .ICS</Button><button className="focus-ring rounded-xl border border-slate-200 bg-white p-2" onClick={() => moveMonth(-1)} aria-label="Bulan sebelumnya"><ChevronLeft size={17} /></button><div className="min-w-32 text-center text-sm font-bold">{title}</div><button className="focus-ring rounded-xl border border-slate-200 bg-white p-2" onClick={() => moveMonth(1)} aria-label="Bulan berikutnya"><ChevronRight size={17} /></button></div>
    </div>

    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4 md:col-span-2"><div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><GraduationCap size={20} /></div><div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Status sekolah</div><div className="mt-1 text-lg font-extrabold text-slate-900">{countdown.label}</div><p className="mt-1 text-xs text-slate-500">Akhir pekan dan hari libur tidak dihitung sebagai hari sekolah.</p></div></div></Card>
      <Card className="p-4"><div className="flex items-center gap-2"><BookOpenCheck size={18} className="text-blue-600" /><div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal Terintegrasi</div><div className="text-sm font-bold">{schedule.length} sesi mingguan</div><div className="mt-1 text-[11px] text-slate-500">Supabase • sinkron realtime</div></div></div></Card>
      <Card className="p-4"><div className="flex items-center gap-2"><Sun size={18} className="text-amber-500" /><div><div className="text-xs font-bold uppercase tracking-wider text-slate-400">Google Holiday</div><div className="text-sm font-bold">{holidayLoading ? 'Memuat…' : `${holidays.length} agenda libur`}</div>{holidayError !== null && <div className="mt-1 text-[11px] text-amber-700">Data libur tidak tersedia; weekend tetap terdeteksi.</div>}</div></div></Card>
    </div>

    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Card className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-slate-400">{WEEKDAYS.map((day) => <div key={day} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            if (!cell) return <div key={`empty-${index}`} className="min-h-24 rounded-xl" />;
            const key = dateKey(cell);
            const count = taskCountByDate.get(key) || 0;
            const holiday = isHoliday(key, holidayByDate);
            const weekend = isWeekend(key);
            const dayName = DAY_NAME[cell.getDay()];
            const hasSchedule = !holiday && !weekend && schedule.some((item) => item.day === dayName && item.active);
            const isToday = key === todayKey;
            return <button key={key} type="button" onClick={() => setSelected(key)} className={cn('relative min-h-24 rounded-xl p-2 text-left transition hover:bg-slate-50', weekend && 'bg-slate-50', holiday && 'bg-rose-50', selected === key && 'ring-2 ring-blue-200')}>
              <span className={cn('grid h-8 w-8 place-items-center rounded-full text-sm font-bold', isToday ? 'bg-blue-600 text-white' : weekend ? 'text-slate-400' : 'text-slate-700')}>{cell.getDate()}</span>
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1">
                {count > 0 && <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">{count} tugas</span>}
                {hasSchedule && <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">jadwal</span>}
                {holiday && <span title={String(holidayByDate.get(key)?.[0]?.summary || 'Libur')} className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">LIBUR</span>}
              </div>
            </button>;
          })}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2"><CalendarDays size={18} className="text-blue-600" /><h2 className="font-bold">Detail Hari</h2></div>
        <div className="mt-1 text-xs font-semibold text-slate-500">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(selectedDate)}</div>
        <div className="mt-4 space-y-4">
          {selectedHoliday.map((holiday) => <div key={holiday.id} className="rounded-xl border border-rose-100 bg-rose-50 p-3"><div className="flex items-center gap-2 text-sm font-bold text-rose-800"><PartyPopper size={16} />{String(holiday.summary)}</div>{holiday.htmlLink && <a className="mt-2 inline-block text-xs font-semibold text-rose-700 underline" href={holiday.htmlLink} target="_blank" rel="noreferrer">Buka Google Calendar</a>}</div>)}
          {isWeekend(selected) && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600"><Sun size={15} className="mr-2 inline" />Akhir pekan — libur.</div>}
          <section><div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Deadline tugas</div>{selectedTasks.length ? selectedTasks.map((task) => <div key={task.id} className="mb-2 rounded-xl border border-slate-100 p-3"><div className="text-xs font-bold text-blue-600">{task.subjectName}</div><div className="mt-1 text-sm font-bold">{task.title}</div><div className="mt-2"><Badge tone="slate">{task.dueTime}</Badge></div></div>) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Tidak ada deadline pada tanggal ini.</p>}</section>
          {schoolDay && <section><div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal sekolah</div>{selectedSchedule.length ? selectedSchedule.slice(0, 8).map((item) => <div key={item.id} className="mb-1 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><div><div className="text-xs font-bold">{item.subject}</div><div className="text-[10px] text-slate-500">{item.teacher || '—'}</div></div><div className="text-[10px] font-bold text-slate-400">{item.startTime}–{item.endTime}</div></div>) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Belum ada jadwal terdaftar.</p>}</section>}
          {selectedTasks.length===0 && selectedHoliday.length===0 && !isWeekend(selected) && selectedSchedule.length===0 && <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500"><CircleAlert size={15} className="mr-2 inline" />Tidak ada agenda lain.</div>}
        </div>
      </Card>
    </div>
  </div>;
}
