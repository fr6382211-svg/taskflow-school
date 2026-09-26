import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, CheckSquare, Home, MoreHorizontal, Brain, Bell, MessageSquare, Search, Settings, UserRound, Heart, MonitorPlay, Users, Activity, QrCode, IdCard, NotebookPen } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hapticTap } from '../../lib/native';

const primary = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/notes', label: 'Catatan', icon: NotebookPen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/focus', label: 'Focus', icon: Brain },
] as const;

const more = [
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/my-minee', label: 'My Minee', icon: Heart },
  { to: '/activity', label: 'Activity', icon: Activity },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const extra = useMemo(() => isAdmin ? [...more, { to: '/admin', label: 'Admin Center', icon: Users }, { to: '/admin/digital-cards', label: 'Kartu Digital', icon: IdCard }] : more, [isAdmin]);
  const isMoreActive = extra.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
  return <>
    <nav className="mobile-nav safe-bottom" aria-label="Navigasi utama seluler">
      {primary.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} onClick={() => void hapticTap()} className={({isActive}) => `mobile-nav__item ${isActive ? 'is-active' : ''}`}>
        <Icon size={19}/><span>{label}</span>
      </NavLink>)}
      <button type="button" className={`mobile-nav__item ${isMoreActive || open ? 'is-active' : ''}`} onClick={() => { void hapticTap(); setOpen((v) => !v); }} aria-expanded={open} aria-haspopup="menu">
        <MoreHorizontal size={20}/><span>More</span>
      </button>
    </nav>
    {open && <div className="fixed inset-0 z-[70] bg-slate-950/40 backdrop-blur-sm lg:hidden" onMouseDown={(e) => { if (e.currentTarget === e.target) setOpen(false); }}>
      <div className="absolute inset-x-3 bottom-[calc(68px+env(safe-area-inset-bottom))] max-h-[70dvh] overflow-auto rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-950" role="menu">
        <div className="mb-2 px-2 py-1 text-[10px] font-black uppercase tracking-[.18em] text-slate-400">More</div>
        <div className="grid grid-cols-2 gap-2">
          {extra.map(({to,label,icon:Icon}) => <button key={to} type="button" onClick={() => { setOpen(false); navigate(to); }} className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900" role="menuitem">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300"><Icon size={17}/></span><span>{label}</span>
          </button>)}
          <a href="https://fathur-rahman.vercel.app" className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300"><MonitorPlay size={17}/></span><span>TimeBox / Media</span></a>
        </div>
      </div>
    </div>}
  </>;
}
