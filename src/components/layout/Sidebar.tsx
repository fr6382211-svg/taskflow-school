import { Heart, CalendarDays, ClipboardList, Gauge, LogOut, Bell, Users, BookOpen, Megaphone, ShieldCheck, UserRoundCog, PanelLeftClose, PanelLeftOpen, Clock3, TrendingUp, Settings, Brain, BarChart3, MonitorPlay, FolderOpen, Activity, Table2, Database, KeyRound, ListChecks, FileDown, QrCode, IdCard, Sparkles, NotebookPen } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace, WORKSPACES, type WorkspaceId } from '../../context/WorkspaceContext';
import { cn } from '../../lib/utils';

// `locationOnly: true` marks menu items that need GPS/location or physical
// attendance hardware. Mazet's workspace doesn't use location-based
// attendance, so those items are hidden for it (unless the user is an admin).
const base = [
  ['/','Dashboard',Gauge],
  ['/ai','FAZET AI',Sparkles],
  ['/schedule','Schedule & Calendar',CalendarDays],
  ['/tasks','Taskflow & Assignments',ClipboardList],
  ['/notes','Catatan',NotebookPen],
  ['https://fathur-rahman.vercel.app','TimeBox',Clock3],
  ['https://fathur-rahman.vercel.app','MediaBox',MonitorPlay],
  ['https://fathur-rahman.vercel.app','Watch Party',Users],
  ['/insights','Insights & Analytics',BarChart3],
  ['/activity','Activity & Security',Activity],
  ['/tasks/summary','Task PDF Summary',FileDown],
  ['/profile','Security & Device History',ShieldCheck],
  ['/settings','Settings',Settings],
  ['/my-minee','My Minee',Heart],
] as const;

const admin = [
  ['/admin','Operations Center',KeyRound],
  ['/admin/digital-cards','Kartu Digital',IdCard],
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
  const visibleItems = base;

  const linkClass = (isActive:boolean) => cn(
    'tf-nav-item focus-ring flex items-center gap-3 px-3 py-2 text-sm font-medium',
    isActive && 'is-active',
    collapsed && 'justify-center px-0',
  );

  const adminLinkClass = (isActive:boolean) => cn(
    'tf-nav-item focus-ring flex items-center gap-3 px-3 py-2 text-sm font-medium',
    isActive && 'is-active',
    collapsed && 'justify-center px-0',
  );

  return (
    <aside
      className={cn('tf-shell hidden h-[100dvh] shrink-0 lg:flex lg:flex-col', collapsed ? 'w-[76px]' : 'w-[256px]')}
      style={{ borderRight: '1px solid var(--tf-rule)', background: 'var(--tf-card)' }}
    >
      <div className="relative flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--tf-rule)' }}>
        <div className={cn('flex min-w-0 items-center gap-3', collapsed && 'mx-auto')}>
          <img src="/brand/fathur-school-hub-crest.png" alt="FAZET" className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight" style={{ fontFamily: 'var(--tf-font-display)', color: 'var(--tf-ink)' }}>FAZET</div>
              <div className="truncate text-[9px] font-medium uppercase tracking-[.18em]" style={{ color: 'var(--tf-ink-muted)' }}>Workspace // SMAN 2 Tuban</div>
            </div>
          )}
        </div>
        {!collapsed && <button className="tf-icon-btn focus-ring" aria-label="Ciutkan sidebar" onClick={()=>setCollapsed(!collapsed)}><PanelLeftClose size={17}/></button>}
        {collapsed && <button className="tf-icon-btn focus-ring absolute left-1/2 top-3 -translate-x-1/2" aria-label="Buka sidebar" onClick={()=>setCollapsed(!collapsed)}><PanelLeftOpen size={17}/></button>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 scrollbar-hide">
        {visibleItems.map(([to,label,Icon]) => {
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
          <div
            className={cn('my-4 flex items-center gap-2 pt-4 text-[9px] font-semibold uppercase tracking-[.18em]', collapsed && 'justify-center')}
            style={{ borderTop: '1px solid var(--tf-rule)', color: 'var(--tf-ink-muted)' }}
          >{collapsed ? 'ADM' : 'ADMIN'}</div>
          {admin.map(([to,label,Icon]) => <NavLink key={to} to={to} className={({isActive})=>adminLinkClass(isActive)} aria-label={label} title={collapsed ? label : undefined}><Icon size={17}/>{!collapsed&&<span className="truncate">{label}</span>}</NavLink>)}
        </>}
      </nav>

      <div className="mx-3 mb-1 rounded-none p-2" style={{ border: '1px solid var(--tf-rule)', background: 'var(--tf-sunken)' }}>
        {!collapsed && <div className="mb-2 px-1 text-[9px] font-bold uppercase tracking-[.16em]" style={{ color: 'var(--tf-ink-muted)' }}>Workspace</div>}
        {isAdmin ? (
          <div className={cn('grid gap-1', collapsed ? 'grid-cols-1' : 'grid-cols-2')}>
            {(Object.keys(WORKSPACES) as WorkspaceId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => switchWorkspace(id)}
                className="rounded-none px-2 py-2 text-[10px] font-bold transition"
                style={workspaceId === id
                  ? { background: 'var(--tf-accent-soft)', color: 'var(--tf-accent)', boxShadow: 'inset 0 0 0 1px var(--tf-accent)' }
                  : { color: 'var(--tf-ink-muted)' }}
                title={WORKSPACES[id].description}
              >
                {collapsed ? id[0].toUpperCase() : WORKSPACES[id].name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-none px-2 py-2" style={{ background: 'var(--tf-card)' }}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-none text-[10px] font-black" style={{ background: 'var(--tf-accent-soft)', color: 'var(--tf-accent)' }}>{workspaceId[0].toUpperCase()}</span>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[10px] font-bold" style={{ color: 'var(--tf-ink)' }}>{WORKSPACES[workspaceId].name}</div>
                <div className="truncate text-[9px]" style={{ color: 'var(--tf-ink-muted)' }}>Terkunci sesuai profil akun</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="m-3 p-3" style={{ borderTop: '1px solid var(--tf-rule)' }}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[9px] font-medium uppercase tracking-[.16em]" style={{ color: 'var(--tf-ink-muted)' }}>Active Session</span>
          <span className="rounded-none px-1.5 py-0.5 font-mono text-[9px]" style={{ background: 'var(--tf-accent-soft)', color: 'var(--tf-accent)' }}>Live</span>
        </div>
        {!collapsed && <>
          <p className="truncate text-xs font-medium" style={{ color: 'var(--tf-ink)' }}>FAZET • {WORKSPACES[workspaceId].name}</p>
          <div className="mt-2 flex items-center gap-1 pt-2 font-mono text-[9px]" style={{ borderTop: '1px solid var(--tf-rule)', color: 'var(--tf-ink-muted)' }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--tf-accent)' }} /> Synced
          </div>
        </>}
      </div>

      <div className="p-3" style={{ borderTop: '1px solid var(--tf-rule)' }}>
        <button
          onClick={()=>void logout()}
          className={cn('tf-btn-ghost focus-ring flex w-full items-center gap-3 px-3 py-2 text-sm', collapsed && 'justify-center px-0')}
          aria-label="Logout"
        >
          <LogOut size={17}/>{!collapsed&&'Sign out'}
        </button>
      </div>
    </aside>
  );
}
