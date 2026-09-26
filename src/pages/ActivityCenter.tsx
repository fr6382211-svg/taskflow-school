import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Globe2, LogOut, Monitor, ShieldCheck, Smartphone, Tablet } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDateTime, errorMessage } from '../lib/utils';
import { getRecentLoginSessions, getStoredSessionKey, revokeLoginSession, revokeOtherLoginSessions, type LoginSession } from '../services/loginSessionService';

type ActivityRow={id:string;event_type:string;device_type:string|null;device_name:string|null;manufacturer:string|null;device_model:string|null;os:string|null;os_version:string|null;browser:string|null;browser_version:string|null;ip_address:string|null;client_timezone:string|null;created_at:string};

const EVENT_LABELS:Record<string,string>={login:'Login',heartbeat:'Aktif',logout:'Logout',revoke:'Sesi dicabut',ip_change:'Perubahan IP',device_change:'Perangkat baru',security_check:'Pemeriksaan keamanan'};
const EVENT_FILTERS=['all','login','logout','revoke','ip_change','device_change','security_check'] as const;
type EventFilter=typeof EVENT_FILTERS[number];

function relativeTime(iso:string):string{
  const diffMs=Date.now()-new Date(iso).getTime();
  const min=Math.floor(diffMs/60000);
  if(min<1)return'Baru saja';
  if(min<60)return`${min} menit lalu`;
  const hr=Math.floor(min/60);
  if(hr<24)return`${hr} jam lalu`;
  const day=Math.floor(hr/24);
  return`${day} hari lalu`;
}
function DeviceIcon({type}:{type:string}){
  if(type==='mobile')return<Smartphone size={18}/>;
  if(type==='tablet')return<Tablet size={18}/>;
  return<Monitor size={18}/>;
}

export default function ActivityCenter(){
  const {user}=useAuth();
  const [sessions,setSessions]=useState<LoginSession[]>([]);
  const [sessionsLoading,setSessionsLoading]=useState(true);
  const [sessionsError,setSessionsError]=useState('');
  const [revokingId,setRevokingId]=useState<string|null>(null);
  const [revokingAll,setRevokingAll]=useState(false);

  const [rows,setRows]=useState<ActivityRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [filter,setFilter]=useState<EventFilter>('all');
  const [visibleCount,setVisibleCount]=useState(20);

  const currentSessionKey=getStoredSessionKey();

  const loadSessions=async()=>{
    if(!user?.id){setSessions([]);setSessionsLoading(false);return;}
    setSessionsLoading(true);setSessionsError('');
    try{
      const data=await getRecentLoginSessions(user.id,20);
      setSessions(data.filter(s=>s.is_current&&!s.logout_at));
    }catch(e){setSessionsError(errorMessage(e));}
    finally{setSessionsLoading(false);}
  };

  useEffect(()=>{void loadSessions();},[user?.id]);

  useEffect(()=>{let alive=true;const load=async()=>{setLoading(true);setError(''); if(!user?.id){setRows([]);setLoading(false);return;} const {data,error:e}=await supabase.from('login_activity').select('id,event_type,device_type,device_name,manufacturer,device_model,os,os_version,browser,browser_version,ip_address,client_timezone,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200);if(!alive)return;if(e){setError(errorMessage(e));setRows([]);}else setRows((data??[]) as unknown as ActivityRow[]);setLoading(false);};void load();return()=>{alive=false}},[user?.id]);

  const recentSuspicious=useMemo(()=>rows.slice(0,5).find(r=>r.event_type==='ip_change'||r.event_type==='device_change'),[rows]);

  const filteredRows=useMemo(()=>{
    const base=filter==='all'?rows:rows.filter(r=>r.event_type===filter);
    return base.slice(0,visibleCount);
  },[rows,filter,visibleCount]);
  const filteredTotal=useMemo(()=>filter==='all'?rows.length:rows.filter(r=>r.event_type===filter).length,[rows,filter]);

  async function handleRevoke(session:LoginSession){
    if(!user?.id)return;
    setRevokingId(session.id);
    try{
      await revokeLoginSession(session.id,user.id);
      setSessions(prev=>prev.filter(s=>s.id!==session.id));
    }catch(e){setSessionsError(errorMessage(e));}
    finally{setRevokingId(null);}
  }

  async function handleRevokeAll(){
    if(!user?.id)return;
    setRevokingAll(true);
    try{
      await revokeOtherLoginSessions(user.id,currentSessionKey);
      await loadSessions();
    }catch(e){setSessionsError(errorMessage(e));}
    finally{setRevokingAll(false);}
  }

  const otherSessionsCount=sessions.filter(s=>s.session_key!==currentSessionKey).length;

  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8 fade-up">
    <header>
      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--ed-terracotta-soft,#eef2ff)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[var(--ed-terracotta-ink,#4338ca)]"><Activity size={12}/>Security Activity</div>
      <h1 className="editorial-heading mt-3 text-3xl font-black tracking-tight">Aktivitas & Perangkat</h1>
      <p className="mt-2 text-sm text-slate-500">Kelola perangkat yang sedang login dan tinjau riwayat keamanan akunmu.</p>
    </header>

    {recentSuspicious&&<Card className="flex items-start gap-3 border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/25">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600"/>
      <div className="text-sm text-amber-800 dark:text-amber-200"><span className="font-bold">{EVENT_LABELS[recentSuspicious.event_type]??recentSuspicious.event_type}</span> terdeteksi {relativeTime(recentSuspicious.created_at)}. Kalau ini bukan kamu, cabut akses perangkat asing di bawah dan ganti password.</div>
    </Card>}

    {/* Active devices — the actionable part this page was missing entirely. */}
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-[.12em] text-slate-500">Perangkat aktif ({sessions.length})</h2>
        {otherSessionsCount>0&&<Button variant="danger" size="sm" loading={revokingAll} icon={<LogOut size={13}/>} onClick={()=>void handleRevokeAll()}>Keluar dari {otherSessionsCount} perangkat lain</Button>}
      </div>
      {sessionsError&&<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{sessionsError}</div>}
      {sessionsLoading?<div className="grid gap-3 sm:grid-cols-2">{[1,2].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>
        :sessions.length===0?<Card className="p-6"><EmptyState title="Tidak ada sesi aktif" description="Perangkat yang sedang login akan muncul di sini."/></Card>
        :<div className="grid gap-3 sm:grid-cols-2">{sessions.map(s=>{const isThis=s.session_key===currentSessionKey;return <Card key={s.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ed-terracotta-soft,#eef2ff)] text-[var(--ed-terracotta-ink,#4338ca)]"><DeviceIcon type={s.device_type}/></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-sm font-black">{[s.manufacturer,s.device_model,s.device_name].filter(Boolean).join(' • ')||s.device_name||'Perangkat'}</div>
                {isThis&&<Badge tone="green">Perangkat ini</Badge>}
              </div>
              <div className="mt-1 text-xs text-slate-500">{[s.os,s.os_version].filter(Boolean).join(' ')} • {[s.browser,s.browser_version].filter(Boolean).join(' ')}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400"><Globe2 size={12}/>{s.ip_address||'IP tidak tersedia'} • Terakhir aktif {relativeTime(s.last_seen_at)}</div>
              {!isThis&&<Button variant="danger" size="sm" className="mt-3" loading={revokingId===s.id} icon={<LogOut size={13}/>} onClick={()=>void handleRevoke(s)}>Keluarkan perangkat ini</Button>}
            </div>
          </div>
        </Card>;})}</div>}
    </section>

    {/* History log, now filterable instead of an undifferentiated dump. */}
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-black uppercase tracking-[.12em] text-slate-500">Riwayat aktivitas</h2>
        <div className="flex flex-wrap gap-1.5">{EVENT_FILTERS.map(f=><button key={f} type="button" onClick={()=>{setFilter(f);setVisibleCount(20);}} className={`hub-chip rounded-lg border px-2.5 py-1 text-[11px] font-bold ${filter===f?'border-[var(--ed-terracotta,#4f46e5)] text-[var(--ed-terracotta-ink,#4338ca)]':'border-slate-200 text-slate-500'}`}>{f==='all'?'Semua':EVENT_LABELS[f]??f}</button>)}</div>
      </div>
      {error&&<div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {loading?<div className="space-y-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>
        :filteredRows.length===0?<Card className="p-6"><EmptyState title="Belum ada aktivitas" description="Aktivitas keamanan akan muncul setelah login atau perubahan sesi."/></Card>
        :<div className="space-y-3">
          {filteredRows.map(row=><Card key={row.id} className="p-4"><div className="flex items-start gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--ed-terracotta-soft,#eef2ff)] text-[var(--ed-terracotta-ink,#4338ca)]"><ShieldCheck size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><div className="text-sm font-black">{EVENT_LABELS[row.event_type]??row.event_type}</div><span className="text-[10px] text-slate-400">{formatDateTime(row.created_at)}</span></div><div className="mt-2 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3"><span><Smartphone size={13} className="mr-1 inline"/>{[row.manufacturer,row.device_model,row.device_name].filter(Boolean).join(' • ')||'Perangkat tidak dikenali'}</span><span>{[row.os,row.os_version].filter(Boolean).join(' ')||'OS tidak diketahui'} • {[row.browser,row.browser_version].filter(Boolean).join(' ')||'Browser tidak diketahui'}</span><span><Globe2 size={13} className="mr-1 inline"/>{row.ip_address||'IP tidak tersedia'}{row.client_timezone?` • ${row.client_timezone}`:''}</span></div></div></div></Card>)}
          {filteredTotal>visibleCount&&<div className="text-center"><Button variant="outline" size="sm" onClick={()=>setVisibleCount(v=>v+20)}>Muat lebih banyak ({filteredTotal-visibleCount} lagi)</Button></div>}
        </div>}
    </section>
  </div>;
}
