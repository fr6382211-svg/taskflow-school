import { useMemo } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, GraduationCap, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ScheduleItem, Task } from '../../types';
import { jakartaWeekday, type CalendarDay } from '../../lib/schoolCalendar';
import type { TutoringScheduleItem } from '../../services/tutoringScheduleService';

type Props = { now: Date; schedule: ScheduleItem[]; tasks: Task[]; tutoring: { today: TutoringScheduleItem[]; tomorrow: TutoringScheduleItem[]; source: string | null } };

const DAYS: CalendarDay[] = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];

function dateKey(date: Date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
function addDays(key: string, amount: number) { const [y,m,d]=key.split('-').map(Number); const x=new Date(Date.UTC(y,m-1,d)); x.setUTCDate(x.getUTCDate()+amount); return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(x); }
function minutes(v:string){const m=v.replace('.',':').match(/^(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):Number.POSITIVE_INFINITY;}

export default function AcademicCommandCenter({ now, schedule, tasks, tutoring }: Props) {
 const today = jakartaWeekday(now);
 const tomorrow = DAYS[(DAYS.indexOf(today)+1)%DAYS.length];
 const tomorrowKey = addDays(dateKey(now),1);
 const tomorrowSubjects = useMemo(()=>Array.from(new Set(schedule.filter(x=>x.active&&x.day===tomorrow&&x.type==='subject').map(x=>x.subject.trim()).filter(Boolean))),[schedule,tomorrow]);
 const todayCurrent = useMemo(()=>{const key=dateKey(now);const current=now.toLocaleTimeString('en-GB',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hour12:false});const cm=minutes(current);return schedule.filter(x=>x.active&&x.day===today&&x.type==='subject').sort((a,b)=>minutes(a.startTime)-minutes(b.startTime)).find(x=>minutes(x.startTime)<=cm&&cm<minutes(x.endTime))??null;},[now,schedule,today]);
 const tomorrowTasks = useMemo(()=>tasks.filter(x=>x.dueDate===tomorrowKey&&x.status!=='completed').sort((a,b)=>minutes(a.dueTime)-minutes(b.dueTime)),[tasks,tomorrowKey]);
 return <section className="hub-surface rounded-2xl p-4 sm:p-5">
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
   <div><div className="flex items-center gap-2 text-base font-bold text-white"><GraduationCap size={17} className="text-sky-300"/> Academic Command Center</div><p className="mt-1 text-xs leading-5 text-slate-500">Ringkasan akademik aktif tanpa menggandakan sesi dan tanpa mencampur jadwal les dengan tugas.</p></div>
   <div className="flex flex-wrap gap-2"><Link to="/schedule" className="hub-chip">Kelola jadwal <ArrowRight size={12}/></Link><Link to="/tasks" className="hub-chip">Kelola tugas <ArrowRight size={12}/></Link></div>
  </div>
  <div className="mt-4 grid gap-3 lg:grid-cols-3">
   <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-300"><Clock3 size={15} className="text-emerald-300"/>Sedang berlangsung</div><div className="mt-3 text-lg font-black text-white">{todayCurrent?.subject ?? 'Tidak ada kelas'}</div><div className="mt-1 text-[11px] text-slate-500">{todayCurrent ? `${todayCurrent.startTime}–${todayCurrent.endTime} WIB` : 'Tidak ada sesi aktif saat ini'}</div></div>
   <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-300"><CalendarDays size={15} className="text-indigo-300"/>Besok • {tomorrow}</div><div className="mt-3 flex flex-wrap gap-2">{tomorrowSubjects.length?tomorrowSubjects.map(s=><span key={s} className="rounded-lg bg-indigo-500/10 px-2.5 py-1.5 text-xs font-bold text-indigo-200">{s}</span>):<span className="text-xs text-slate-500">Tidak ada pelajaran</span>}</div></div>
   <div className="rounded-2xl border border-white/7 bg-white/[0.025] p-4"><div className="flex items-center gap-2 text-xs font-bold text-slate-300"><ListChecks size={15} className="text-amber-300"/>Tugas besok</div><div className="mt-3 text-lg font-black text-white">{tomorrowTasks.length}</div><div className="mt-1 text-[11px] text-slate-500">{tomorrowTasks.length?'Menunggu dikerjakan':'Tidak ada tugas jatuh tempo besok'}</div></div>
  </div>
  <div className="mt-3 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-3 text-[11px] text-slate-400"><CheckCircle2 size={13} className="mr-2 inline text-amber-300"/>Jadwal les Fathur tetap hanya sebagai agenda. {tutoring.source==='supabase'?'Data les tersinkron ke Supabase.':'Data les memakai sumber terintegrasi sampai Supabase tersedia.'}</div>
 </section>;
}
