import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Search, SlidersHorizontal } from 'lucide-react';
import Card from '../components/ui/Card';
import ScheduleTimeline from '../components/schedule/ScheduleTimeline';
import Skeleton from '../components/ui/Skeleton';
import { useSchedule,useScheduleHelpers } from '../hooks/useSchedule';
import { cn } from '../lib/utils';
import { trackEvent } from '../lib/analytics';

const dayList=['Senin','Selasa','Rabu','Kamis','Jumat'] as const;
export default function Schedule(){
  const {items,loading,error}=useSchedule(); const {todayName,current}=useScheduleHelpers(items); const [day,setDay]=useState<typeof dayList[number]>((todayName as typeof dayList[number])||'Senin'); const [q,setQ]=useState(''); const [type,setType]=useState('all');
  useEffect(()=>{trackEvent('schedule_viewed')},[]);
  const selected=useMemo(()=>items.filter(i=>i.day===day && (type==='all'||i.type===type) && `${i.subject} ${i.teacher||''}`.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.startTime.localeCompare(b.startTime)),[items,day,q,type]);
  const totalMinutes=useMemo(()=>selected.reduce((sum,i)=>{const [sh,sm]=i.startTime.split(':').map(Number),[eh,em]=i.endTime.split(':').map(Number);return sum+(eh*60+em)-(sh*60+sm)},0),[selected]);
  const subjectCount=new Set(selected.filter(i=>i.type==='subject').map(i=>i.subject)).size;
  return <div className="space-y-5 fade-up"><div><h1 className="text-2xl font-extrabold tracking-tight">Jadwal Sekolah</h1><p className="mt-1 text-sm text-slate-500">Timeline terintegrasi dengan tugas dan kalender. Data berasal dari Supabase.</p></div>
    <Card className="overflow-hidden"><div className="scrollbar-hide flex overflow-x-auto border-b border-slate-100 p-2">{dayList.map(d=><button key={d} onClick={()=>setDay(d)} className={cn('min-w-24 rounded-xl px-4 py-2.5 text-sm font-bold transition',day===d?'bg-blue-600 text-white':'text-slate-500 hover:bg-slate-50')}>{d}<span className="ml-1 text-[10px] opacity-70">{d===todayName?'• Hari ini':''}</span></button>)}</div>
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_180px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input className="input pl-9" value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari mapel atau guru..."/></div><div className="relative"><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/><select className="input pl-9" value={type} onChange={e=>setType(e.target.value)}><option value="all">Semua kegiatan</option><option value="subject">Pelajaran</option><option value="break">Istirahat</option><option value="ceremony">Upacara</option><option value="religious_break">Religi</option><option value="school_activity">Kegiatan</option></select></div></div>
      <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 md:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Sesi</div><div className="mt-1 text-xl font-black">{selected.length}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Mapel</div><div className="mt-1 text-xl font-black">{subjectCount}</div></div><div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-400">Durasi</div><div className="mt-1 text-xl font-black">{Math.floor(totalMinutes/60)}j {totalMinutes%60}m</div></div></div>
      <div className="p-4 md:p-6">{error?<div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><div className="font-bold">Jadwal belum bisa dimuat</div><div className="mt-1 text-xs">Pastikan migration schedule sudah dijalankan.</div></div>:loading?<div className="space-y-2">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-16"/>)}</div>:<ScheduleTimeline items={selected} currentId={day===todayName?current?.id:undefined}/>}</div>
    </Card>
    <Card className="p-4"><div className="flex items-center gap-2 text-sm font-bold"><CalendarClock size={17} className="text-blue-600"/> Integrasi dengan tugas</div><p className="mt-1 text-xs leading-5 text-slate-500">Saat kamu membuat tugas, mapel dan guru diambil dari master Supabase. Jadwal hari pelajaran juga dapat tampil di kalender pada tanggal yang sesuai.</p></Card>
  </div>
}
