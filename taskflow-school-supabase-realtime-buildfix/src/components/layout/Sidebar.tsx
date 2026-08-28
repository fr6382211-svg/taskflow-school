import { CalendarDays, ClipboardList, Gauge, GraduationCap, LogOut, Bell, UserCircle, Users, BookOpen, Megaphone, ShieldCheck, UserRoundCog, PanelLeftClose, PanelLeftOpen, Clock3, TrendingUp, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const base = [
  ['/dashboard','Dashboard',Gauge], ['/tasks','Tugas',ClipboardList], ['/schedule','Jadwal',Clock3],
  ['/calendar','Kalender',CalendarDays], ['/notifications','Notifikasi',Bell], ['/profile','Profil',UserCircle], ['/settings','Pengaturan',Settings]
] as const;
const admin = [
  ['/admin','Dashboard Admin',ShieldCheck], ['/admin/users','Users',Users], ['/admin/tasks','Tasks',ClipboardList],
  ['/admin/schedule','Schedule',Clock3], ['/admin/subjects','Subjects',BookOpen], ['/admin/teachers','Teachers',UserRoundCog], ['/admin/announcements','Announcements',Megaphone],
  ['/admin/notifications','Notifications',Bell], ['/admin/analytics','Analytics',TrendingUp], ['/admin/audit-logs','Audit Logs',ShieldCheck], ['/admin/settings','System Settings',Settings]
] as const;

export default function Sidebar({collapsed,setCollapsed}:{collapsed:boolean;setCollapsed:(v:boolean)=>void}) {
  const {isAdmin,logout} = useAuth();
  const linkClass = (isActive:boolean) => cn('focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50', collapsed && 'justify-center px-0');
  const adminLinkClass = (isActive:boolean) => cn('focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50', collapsed && 'justify-center px-0');
  return <aside className={cn('hidden border-r border-slate-200 bg-white/90 lg:flex lg:flex-col', collapsed ? 'w-[84px]' : 'w-[250px]')}>
    <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
      <div className={cn('flex items-center gap-2', collapsed && 'mx-auto')}>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm"><GraduationCap size={20}/></div>
        {!collapsed && <div><div className="text-sm font-extrabold tracking-tight">TASKFLOW</div><div className="text-[10px] font-semibold tracking-[.2em] text-slate-400">SCHOOL</div></div>}
      </div>
      <button className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label={collapsed?'Buka sidebar':'Ciutkan sidebar'} onClick={()=>setCollapsed(!collapsed)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</button>
    </div>
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
      {base.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive})=>linkClass(isActive)} aria-label={label}><Icon size={18}/>{!collapsed&&<span>{label}</span>}</NavLink>)}
      {isAdmin && <>
        <div className={cn('my-4 border-t border-slate-100 pt-4 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400', collapsed && 'text-center')}>{collapsed?'ADM':'ADMIN'}</div>
        {admin.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive})=>adminLinkClass(isActive)} aria-label={label}><Icon size={18}/>{!collapsed&&<span>{label}</span>}</NavLink>)}
      </>}
    </nav>
    <div className="border-t border-slate-100 p-3"><button onClick={()=>logout()} className={cn('focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-700', collapsed && 'justify-center px-0')} aria-label="Logout"><LogOut size={18}/>{!collapsed&&'Logout'}</button></div>
  </aside>;
}
