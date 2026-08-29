import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, CheckCircle2, Flame, ListChecks, Target, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../components/ui/Card';
import { useTasks, useTaskStats } from '../hooks/useTasks';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { loadFocusStats } from '../services/focusService';
import { useEffect, useState } from 'react';

type Metric = { icon: LucideIcon; value: string | number; label: string };

export default function Insights({admin=false}:{admin?:boolean}) {
  const { user } = useAuth();
  const { tasks } = useTasks(admin);
  const stats = useTaskStats(tasks);
  const [focusMinutes,setFocusMinutes] = useState(0);
  useEffect(()=>{if(!user)return;void loadFocusStats(user.id).then(v=>setFocusMinutes(v.totalMinutes)).catch(()=>undefined)},[user]);
  const bySubject = useMemo(()=>{const m=new Map<string,{subject:string;total:number;completed:number}>();tasks.forEach(t=>{const k=t.subjectName||'Lainnya';const row=m.get(k)||{subject:k,total:0,completed:0};row.total++;if(t.status==='completed')row.completed++;m.set(k,row)});return [...m.values()].sort((a,b)=>b.total-a.total).slice(0,8)},[tasks]);
  const trend = useMemo(()=>Array.from({length:14},(_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(13-i));const key=d.toISOString().slice(0,10);return {date:d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'}),created:tasks.filter(t=>t.createdAt?.slice(0,10)===key).length,done:tasks.filter(t=>t.completedAt?.slice(0,10)===key).length}}),[tasks]);
  const completionRate = stats.total?Math.round((stats.completed/stats.total)*100):0;
  const metrics: Metric[] = [
    { icon: ListChecks, value: stats.total, label: 'Total Tugas' },
    { icon: CheckCircle2, value: stats.completed, label: 'Selesai' },
    { icon: Activity, value: stats.inProgress, label: 'Dikerjakan' },
    { icon: Flame, value: stats.overdue, label: 'Terlambat' },
    { icon: Target, value: completionRate + '%', label: 'Completion' },
    { icon: TrendingUp, value: focusMinutes + 'm', label: 'Focus Time' },
  ];
  return <div className="space-y-5 fade-up"><div><h1 className="text-2xl font-extrabold">{admin?'Analytics Sistem':'Insight Produktivitas'}</h1><p className="mt-1 text-sm text-slate-500">Semua metrik dihitung dari data Supabase, bukan angka contoh.</p></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{metrics.map(({icon: Icon, value, label})=><Card key={String(label)} className="p-4"><Icon size={18} className="text-blue-600"/><div className="mt-2 text-2xl font-black">{value}</div><div className="text-xs text-slate-500">{label}</div></Card>)}</div><div className="grid gap-5 xl:grid-cols-2"><Card className="p-5"><h2 className="font-bold">Aktivitas 14 Hari</h2><p className="text-xs text-slate-500">Tugas dibuat dan diselesaikan</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" fontSize={10}/><YAxis allowDecimals={false} fontSize={10}/><Tooltip/><Line type="monotone" dataKey="created" stroke="currentColor" className="text-blue-600" strokeWidth={3}/><Line type="monotone" dataKey="done" stroke="currentColor" className="text-emerald-600" strokeWidth={3}/></LineChart></ResponsiveContainer></div></Card><Card className="p-5"><h2 className="font-bold">Beban per Mata Pelajaran</h2><p className="text-xs text-slate-500">Top 8 mata pelajaran berdasarkan jumlah tugas</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={bySubject} layout="vertical" margin={{left:20,right:10}}><XAxis type="number" allowDecimals={false}/><YAxis dataKey="subject" type="category" width={110} fontSize={10}/><Tooltip/><Bar dataKey="total" fill="currentColor" className="text-blue-600" radius={[0,7,7,0]}/></BarChart></ResponsiveContainer></div></Card></div><Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Interpretasi cepat</h2><p className="text-xs text-slate-500">Saran berbasis data saat ini</p></div><Target size={19} className={cn(completionRate>=75?'text-emerald-600':'text-amber-500')}/></div><div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4 text-sm"><b>Completion</b><p className="mt-1 text-slate-500">{completionRate>=75?'Ritmemu sudah konsisten. Pertahankan.':completionRate>=45?'Prioritaskan tugas yang hampir deadline.':'Mulai dari satu tugas prioritas tinggi dan selesaikan.'}</p></div><div className="rounded-2xl bg-slate-50 p-4 text-sm"><b>Overdue</b><p className="mt-1 text-slate-500">{stats.overdue===0?'Tidak ada tugas terlambat.':`${stats.overdue} tugas terlambat perlu segera ditangani.`}</p></div><div className="rounded-2xl bg-slate-50 p-4 text-sm"><b>Focus</b><p className="mt-1 text-slate-500">{focusMinutes?`Kamu sudah fokus ${focusMinutes} menit.`:'Belum ada sesi fokus. Coba Focus Mode.'}</p></div></div></Card></div>
}
