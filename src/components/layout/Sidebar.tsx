import { Heart, CalendarDays, ClipboardList, Gauge, LogOut, Bell, Users, BookOpen, Megaphone, ShieldCheck, UserRoundCog, PanelLeftClose, PanelLeftOpen, Clock3, TrendingUp, Settings, Brain, BarChart3, MonitorPlay, FolderOpen, Activity, Table2, Database, KeyRound, ListChecks, MapPin, FileDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace, WORKSPACES, type WorkspaceId } from '../../context/WorkspaceContext';
import { cn } from '../../lib/utils';

const base = [
  ['/','Dashboard',Gauge],
  ['/schedule','Schedule & Calendar',CalendarDays],
  ['/tasks','Taskflow & Assignments',ClipboardList],
  ['https://fathur-rahman.vercel.app','TimeBox',Clock3],
  ['https://fathur-rahman.vercel.app','MediaBox',MonitorPlay],
  ['https://fathur-rahman.vercel.app','Watch Party',Users],
  ['/insights','Insights & Analytics',BarChart3],
  ['/location-intelligence','Location Intelligence',MapPin],
  ['/activity','Activity & Security',Activity],
  ['/tasks/summary','Task PDF Summary',FileDown],
  ['/profile','Security & Device History',ShieldCheck],
  ['/settings','Settings',Settings],
  ['/my-minee','My Minee',Heart],
] as const;

const admin = [
  ['/admin','Operations Center',KeyRound],
  ['/admin/users','Users',Users],
  ['/admin/tasks','Tasks',ClipboardList],
  ['/admin/task-workspace','Task Workspace',ListChecks],
  ['/admin/schedule','Schedule',Clock3],
  ['/admin/subjects','Subjects',BookOpen],
  ['/admin/teachers','Teachers',UserRoundCog],
  ['/admin/announcements','Announcements',Megaphone],
  ['/admin/notifications','Notifications',Bell],
  ['/admin/focus-sessions','Focus Sessions',Clock3],
  ['/admin/analytics','Analytics',TrendingUp],
  ['/admin/audit-logs','Audit Logs',ShieldCheck],
  ['/admin/sessions','Sessions & Devices',MonitorPlay],
  ['/admin/broadcast','Broadcast Center',Megaphone],
  ['/admin/storage','Storage Manager',FolderOpen],
  ['/admin/data','Data Workspace',Table2],
  ['/admin/health','System Health',Activity],
  ['/admin/settings','System Settings',Settings],
  ['/admin/my-minee','My Minee Gallery',Heart],
] as const;

export default function Sidebar({collapsed,setCollapsed}:{collapsed:boolean;setCollapsed:(v:boolean)=>void}) {
  const {isAdmin, user, logout} = useAuth();
  const { workspaceId, switchWorkspace } = useWorkspace();
  const showAdmin = isAdmin || user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  const linkClass = (isActive:boolean) => cn(
    'focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
    isActive ? 'stitch-nav-active text-white' : 'text-slate-400 hover:bg-white/[.04] hover:text-white',
    collapsed && 'justify-center px-0',
  );

  const adminLinkClass = (isActive:boolean) => cn(
    'focus-ring flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
    isActive ? 'stitch-nav-active text-white' : 'text-slate-400 hover:bg-white/[.04] hover:text-white',
    collapsed && 'justify-center px-0',
  );

  return (
    <aside className={cn('stitch-sidebar hidden h-[100dvh] shrink-0 lg:flex lg:flex-col', collapsed ? 'w-[76px]' : 'w-[256px]')}>
      <div className="stitch-sidebar__brand flex items-center justify-between px-4">
        <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'mx-auto')}>
          <img src="/brand/fathur-school-hub-crest.png" alt="Fathur School Hub" className="shrink-0" />
          {!collapsed && <div className="min-w-0"><div className="truncate text-sm font-semibold tracking-tight text-white">Fathur School Hub</div><div className="truncate text-[9px] font-medium uppercase tracking-[.18em] text-slate-500">Workspace // SMAN 2 Tuban</div></div>}
        </div>
        {!collapsed && <button className="focus-ring rounded-lg p-1.5 text-slate-500 hover:bg-white/[.04] hover:text-white" aria-label="Ciutkan sidebar" onClick={()=>setCollapsed(!collapsed)}><PanelLeftClose size={17}/></button>}
        {collapsed && <button className="focus-ring absolute left-1/2 top-3 -translate-x-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-white/[.04] hover:text-white" aria-label="Buka sidebar" onClick={()=>setCollapsed(!collapsed)}><PanelLeftOpen size={17}/></button>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 scrollbar-hide">
        {base.map(([to,label,Icon]) => {
          const external = to.startsWith('http');
          const content = <>
            <Icon size={17}/>{!collapsed&&<span className="truncate">{label}</span>}
          </>;
          if (external) {
            return <a key={`${label}-${to}`} href={to} className={linkClass(false)} aria-label={label} title={collapsed ? label : undefined}>{content}</a>;
          }
          return <NavLink key={`${label}-${to}`} to={to} className={({isActive})=>linkClass(isActive)} aria-label={label} title={collapsed ? label : undefined}>{content}</NavLink>;
        })}

        {showAdmin && <>
          <div className={cn('my-4 flex items-center gap-2 border-t border-white/[.06] pt-4 text-[9px] font-semibold uppercase tracking-[.18em] text-slate-600', collapsed && 'justify-center')}>{collapsed ? 'ADM' : 'ADMIN'}</div>
          {admin.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive})=>adminLinkClass(isActive)} aria-label={label} title={collapsed ? label : undefined}><Icon size={17}/>{!collapsed&&<span className="truncate">{label}</span>}</NavLink>)}
        </>}
      </nav>

      <div className="mx-3 mb-1 rounded-xl border border-white/[.06] bg-white/[.025] p-2">
        {!collapsed && <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-600">Workspace</div>}
        {isAdmin ? (
          <div className={cn('grid gap-1', collapsed ? 'grid-cols-1' : 'grid-cols-2')}>
            {(Object.keys(WORKSPACES) as WorkspaceId[]).map((id) => (
              <button key={id} type="button" onClick={() => switchWorkspace(id)} className={cn('rounded-lg px-2 py-2 text-[10px] font-bold transition', workspaceId === id ? 'bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/20' : 'text-slate-500 hover:bg-white/[.04] hover:text-slate-200')} title={WORKSPACES[id].description}>
                {collapsed ? id[0].toUpperCase() : WORKSPACES[id].name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-white/[.03] px-2 py-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-500/15 text-[10px] font-black text-indigo-200">{workspaceId[0].toUpperCase()}</span>
            {!collapsed && <div className="min-w-0"><div className="truncate text-[10px] font-bold text-slate-200">{WORKSPACES[workspaceId].name}</div><div className="truncate text-[9px] text-slate-500">Terkunci sesuai profil akun</div></div>}
          </div>
        )}
      </div>

      <div className="stitch-sidebar__session m-3 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[9px] font-medium uppercase tracking-[.16em] text-slate-600">Active Session</span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">Live</span>
        </div>
        {!collapsed && <>
          <p className="truncate text-xs font-medium text-slate-200">{WORKSPACES[workspaceId].name} • School Hub</p>
          <div className="mt-2 flex items-center gap-1 border-t border-white/[.06] pt-2 font-mono text-[9px] text-slate-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Synced</div>
        </>}
      </div>

      <div className="border-t border-white/[.06] p-3">
        <button onClick={()=>void logout()} className={cn('focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300', collapsed && 'justify-center px-0')} aria-label="Logout">
          <LogOut size={17}/>{!collapsed&&'Sign out'}
        </button>
      </div>
    </aside>
  );
}
