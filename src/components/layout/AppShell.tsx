import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  Brain,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  Clock3,
  Home,
  LogOut,
  Menu,
  MonitorPlay,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
  Megaphone,
  FolderOpen,
  Activity,
  Table2,
  Heart,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { getSettings, saveSettings } from '../../services/settingsService';
import { cn } from '../../lib/utils';

import Sidebar from './Sidebar';
import LiveStatusBar from './LiveStatusBar';
import Watermark from './Watermark';

type AppShellProps = {
  children: ReactNode;
};

type MenuItem = {
  label: string;
  to: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
  external?: boolean;
};

const TIMEBOX_URL = 'https://fathur-rahman.vercel.app';

const mainMenu: MenuItem[] = [
  { label: 'Dashboard', to: '/dashboard', Icon: Home },
  { label: 'Schedule & Calendar', to: '/schedule', Icon: CalendarDays },
  { label: 'Taskflow & Assignments', to: '/tasks', Icon: CheckSquare },
  { label: 'TimeBox', to: TIMEBOX_URL, Icon: Clock3, external: true },
  { label: 'MediaBox', to: TIMEBOX_URL, Icon: MonitorPlay, external: true },
  { label: 'Watch Party', to: TIMEBOX_URL, Icon: Users, external: true },
  { label: 'Focus Mode', to: '/focus', Icon: Brain },
  { label: 'Insights & Analytics', to: '/insights', Icon: BarChart3 },
  { label: 'Location Intelligence', to: '/location-intelligence', Icon: Activity },
  { label: 'Activity & Security', to: '/activity', Icon: ShieldCheck },
  { label: 'Task PDF Summary', to: '/tasks/summary', Icon: CheckSquare },
  { label: 'Notifications', to: '/notifications', Icon: Bell },
  { label: 'My Minee', to: '/my-minee', Icon: Heart },
  { label: 'Security & Device History', to: '/profile', Icon: ShieldCheck },
  { label: 'Settings', to: '/settings', Icon: Settings },
];

const adminMenu: MenuItem[] = [
  { label: 'Admin Dashboard', to: '/admin', Icon: ShieldCheck },
  { label: 'Users', to: '/admin/users', Icon: Users },
  { label: 'Tasks', to: '/admin/tasks', Icon: CheckSquare },
  { label: 'Schedule', to: '/admin/schedule', Icon: Clock3 },
  { label: 'Subjects', to: '/admin/subjects', Icon: CalendarDays },
  { label: 'Teachers', to: '/admin/teachers', Icon: UserRound },
  { label: 'Announcements', to: '/admin/announcements', Icon: Sparkles },
  { label: 'Notifications', to: '/admin/notifications', Icon: Bell },
  { label: 'Analytics', to: '/admin/analytics', Icon: BarChart3 },
  { label: 'Audit Logs', to: '/admin/audit-logs', Icon: ShieldCheck },
  { label: 'Sessions & Devices', to: '/admin/sessions', Icon: MonitorPlay },
  { label: 'System Settings', to: '/admin/settings', Icon: Settings },
  { label: 'Broadcast Center', to: '/admin/broadcast', Icon: Megaphone },
  { label: 'Storage Manager', to: '/admin/storage', Icon: FolderOpen },
  { label: 'System Health', to: '/admin/health', Icon: Activity },
  { label: 'Data Workspace', to: '/admin/data', Icon: Table2 },
  { label: 'My Minee Gallery', to: '/admin/my-minee', Icon: Heart },
];

function pageTitleFromPath(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'admin') {
    if (!parts[1]) return 'Admin Dashboard';
    const item = adminMenu.find((menu) => menu.to === pathname);
    return item?.label ?? `Admin • ${parts[1].replace(/-/g, ' ')}`;
  }

  const item = mainMenu.find((menu) => !menu.external && menu.to === pathname);
  if (item) return item.label;
  if (!parts[0]) return 'Dashboard';
  return parts[0].replace(/-/g, ' ');
}

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark'),
  );
  const [showLiveBar, setShowLiveBar] = useState(true);

  const { profile, user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const showAdmin =
    isAdmin ||
    user?.app_metadata?.role === 'admin' ||
    user?.user_metadata?.role === 'admin';

  const allSearchItems = useMemo(
    () => (showAdmin ? [...mainMenu, ...adminMenu] : mainMenu),
    [showAdmin],
  );

  const filteredSearchItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return allSearchItems;
    return allSearchItems.filter((item) =>
      item.label.toLowerCase().includes(search),
    );
  }, [allSearchItems, query]);

  useEffect(() => {
    if (!user?.id) return;

    const userId = user.id;
    let active = true;

    const loadSettings = async () => {
      try {
        const settings = await getSettings(userId);
        if (!active || !settings) return;

        const themeMode = String(
          settings.theme_mode ??
            (settings.dark_mode ? 'dark' : 'system'),
        );
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)',
        ).matches;
        const enabled =
          themeMode === 'dark' ||
          (themeMode === 'system' && prefersDark);

        document.documentElement.classList.toggle('dark', enabled);
        document.body.classList.toggle(
          'compact-mode',
          settings.density === 'compact',
        );
        document.documentElement.classList.toggle(
          'reduce-motion',
          Boolean(settings.reduced_motion) ||
            settings.animations === false,
        );

        if (settings.accent_color != null) {
          document.documentElement.dataset.tfAccent = String(
            settings.accent_color,
          );
        }
        if (settings.density != null) {
          document.documentElement.dataset.tfDensity = String(
            settings.density,
          );
        }

        setDarkMode(enabled);
        setShowLiveBar(settings.show_live_bar ?? true);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    const handleThemeChanged = () => {
      setDarkMode(document.documentElement.classList.contains('dark'));
    };

    const handleSettingsChanged = async () => {
      const currentUser = user;
      if (!currentUser?.id) return;

      try {
        const settings = await getSettings(currentUser.id);
        if (settings) {
          setShowLiveBar(settings.show_live_bar ?? true);
        }
      } catch (error) {
        console.error('Failed to refresh settings:', error);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        setMobileOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener('taskflow:theme-changed', handleThemeChanged);
    window.addEventListener('taskflow:settings-changed', handleSettingsChanged);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('taskflow:theme-changed', handleThemeChanged);
      window.removeEventListener('taskflow:settings-changed', handleSettingsChanged);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user]);

  const go = (to: string) => {
    setPaletteOpen(false);
    setMobileOpen(false);
    setProfileOpen(false);
    setQuery('');
    navigate(to);
  };

  const openMenuItem = (item: MenuItem) => {
    if (item.external) {
      window.location.assign(item.to);
      return;
    }
    go(item.to);
  };

  const toggleTheme = async () => {
    if (!user?.id) return;

    const previous = darkMode;
    const next = !darkMode;
    document.documentElement.classList.toggle('dark', next);
    setDarkMode(next);

    try {
      await saveSettings(user.id, {
        dark_mode: next,
        theme_mode: next ? 'dark' : 'light',
      });
      window.dispatchEvent(new Event('taskflow:theme-changed'));
      window.dispatchEvent(new Event('taskflow:settings-changed'));
    } catch (error) {
      console.error('Failed to save theme:', error);
      document.documentElement.classList.toggle('dark', previous);
      setDarkMode(previous);
    }
  };

  const profileInitials =
    profile?.name?.trim()?.slice(0, 2).toUpperCase() || 'U';

  const pageTitle = pageTitleFromPath(location.pathname);

  return (
    <div className="app-shell editorial-theme flex min-h-dvh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex min-h-16 items-center gap-2 px-3 sm:px-4 md:gap-3 md:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Buka navigasi"
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Fathur School Hub
              </div>
              <h1 className="truncate text-sm font-black text-slate-900 dark:text-white">
                {pageTitle}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden min-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-500 shadow-sm md:flex dark:border-slate-700 dark:bg-slate-900"
            >
              <Search size={15} />
              <span className="flex-1 text-left">Cari halaman atau fitur...</span>
              <kbd className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800">
                Ctrl K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => void toggleTheme()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label={darkMode ? 'Gunakan mode terang' : 'Gunakan mode gelap'}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              type="button"
              onClick={() => go('/notifications')}
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Notifikasi"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-indigo-600 px-1 text-[9px] font-black text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-1.5 pr-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-xl bg-indigo-600 text-xs font-black text-white">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    profileInitials
                  )}
                </span>
                <span className="hidden max-w-32 truncate text-xs font-bold sm:block">
                  {profile?.name || 'Pengguna'}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-1 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                    <div className="flex items-center gap-2 text-xs font-black">
                      {showAdmin ? (
                        <ShieldCheck size={14} className="text-violet-500" />
                      ) : (
                        <Sparkles size={14} className="text-indigo-500" />
                      )}
                      {showAdmin ? 'Administrator' : 'Workspace siswa'}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-slate-500">
                      {profile?.email || 'Email tidak tersedia'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => go('/profile')}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => go('/settings')}
                    className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Pengaturan
                  </button>
                  {showAdmin && (
                    <button
                      type="button"
                      onClick={() => go('/admin')}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30"
                    >
                      <span>Admin Center</span>
                      <ChevronRight size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut size={15} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] min-w-0 overflow-x-clip px-3 py-4 pb-24 sm:px-5 md:py-6 lg:px-7 lg:pb-8">
          {children}
        </main>

        {showLiveBar ? <LiveStatusBar /> : null}
        <Watermark />


      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setMobileOpen(false);
            }
          }}
        >
          <aside className="flex h-full w-[min(90vw,360px)] flex-col bg-white p-4 shadow-2xl dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-lg font-black tracking-tight">FATHUR</div>
                <div className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
                  SCHOOL HUB
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup menu"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
              {mainMenu.map((item) => {
                const Icon = item.Icon;
                const active = !item.external && location.pathname === item.to;

                if (item.external) {
                  return (
                    <a
                      key={`${item.label}-${item.to}`}
                      href={item.to}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </a>
                  );
                }

                return (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => go(item.to)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition',
                      active
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900',
                    )}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {showAdmin && (
                <>
                  <div className="my-3 border-t border-slate-100 pt-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 dark:border-slate-800 dark:text-slate-600">
                    Admin Center
                  </div>
                  {adminMenu.map((item) => {
                    const Icon = item.Icon;
                    const active = location.pathname === item.to;
                    return (
                      <button
                        key={item.to}
                        type="button"
                        onClick={() => go(item.to)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition',
                          active
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/35 dark:text-violet-200'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900',
                        )}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </nav>

            <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <LogOut size={18} />
                Keluar dari akun
              </button>
            </div>
          </aside>
        </div>
      )}

      {paletteOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/50 p-4 backdrop-blur-sm sm:p-8"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setPaletteOpen(false);
            }
          }}
        >
          <div className="mx-auto mt-[8vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <Search size={18} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                placeholder="Cari halaman atau fitur..."
              />
              <button
                type="button"
                onClick={() => setPaletteOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Tutup pencarian"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => {
                  const Icon = item.Icon;
                  if (item.external) {
                    return (
                      <a
                        key={`${item.label}-${item.to}`}
                        href={item.to}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                          <Icon size={17} />
                        </span>
                        <span>{item.label}</span>
                      </a>
                    );
                  }

                  return (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => go(item.to)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        <Icon size={17} />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Tidak ada fitur yang cocok.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
