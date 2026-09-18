import { BellRing, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { markNotificationRead } from '../services/notificationService';
import { formatDateTime } from '../lib/utils';
export default function Notifications(){const {notifications,unreadCount}=useNotifications();const nav=useNavigate();return <div className="mx-auto max-w-3xl space-y-5 fade-up"><div><h1 className="text-2xl font-extrabold">Notifikasi</h1><p className="mt-1 text-sm text-slate-500">{unreadCount} belum dibaca.</p></div><Card className="divide-y divide-slate-100 overflow-hidden">{notifications.length===0?<EmptyState title="Belum ada notifikasi" description="Deadline reminder, pengumuman, dan keamanan akan muncul di sini."/>:notifications.map(n=><div key={n.id} className={`flex gap-3 p-4 ${n.read?'bg-white':'bg-blue-50/40'}`}><div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><BellRing size={16}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{n.title}</h3>{!n.read&&<Badge tone="blue">Baru</Badge>}</div><p className="mt-1 text-sm leading-6 text-slate-500">{n.message}</p><div className="mt-2 text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</div></div><div className="flex shrink-0 flex-col gap-1">{n.actionUrl&&<Button size="sm" variant="ghost" icon={<ExternalLink size={14}/>} onClick={()=>nav(n.actionUrl!)}>Buka</Button>}{!n.read&&<Button size="sm" variant="ghost" icon={<Check size={14}/>} onClick={()=>markNotificationRead(n.id)}>Tandai dibaca</Button>}</div></div>)}</Card></div>}
