import type { ComponentType } from 'react';
import {
  Activity,
  ArrowRight,
  Database,
  Gauge,
  Heart,
  KeyRound,
  Megaphone,
  Server,
  Settings2,
  ShieldCheck,
  Smartphone,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

type IconType = ComponentType<{ size?: number; className?: string }>;
type Item = { to: string; label: string; Icon: IconType };
type Group = { title: string; items: Item[] };

const groups: Group[] = [
  {
    title: 'People & Security',
    items: [
      { to: '/admin/users', label: 'Users', Icon: Users },
      { to: '/admin/sessions', label: 'Sessions & Devices', Icon: Smartphone },
      { to: '/admin/audit-logs', label: 'Audit Logs', Icon: ShieldCheck },
    ],
  },
  {
    title: 'Academic & Content',
    items: [
      { to: '/admin/tasks', label: 'Tasks', Icon: Gauge },
      { to: '/admin/task-workspace', label: 'Task Workspace', Icon: Database },
      { to: '/admin/schedule', label: 'Schedule', Icon: Gauge },
      { to: '/admin/subjects', label: 'Subjects', Icon: Database },
      { to: '/admin/teachers', label: 'Teachers', Icon: Users },
      { to: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
      { to: '/admin/notifications', label: 'Notifications', Icon: Megaphone },
    ],
  },
  {
    title: 'My Minee & Product',
    items: [
      { to: '/admin/my-minee', label: 'My Minee Gallery', Icon: Heart },
      { to: '/admin/focus-sessions', label: 'Focus Sessions', Icon: Gauge },
      { to: '/admin/analytics', label: 'Analytics', Icon: Activity },
      { to: '/admin/broadcast', label: 'Broadcast Center', Icon: Megaphone },
      { to: '/admin/storage', label: 'Storage Manager', Icon: Database },
      { to: '/admin/health', label: 'System Health', Icon: Activity },
      { to: '/admin/data', label: 'Data Workspace', Icon: Database },
      { to: '/admin/settings', label: 'System Settings', Icon: Settings2 },
    ],
  },
];

export default function AdminOperations() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 fade-up">
      <AdminHeader
        title="Admin Operations Center"
        description={`Pusat kendali Fathur School Hub • ${user?.email ?? 'admin'}`}
      />

      <Card className="border-indigo-500/20 bg-indigo-50/60 p-5 dark:bg-indigo-950/20">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
            <KeyRound size={18} />
          </div>
          <div>
            <div className="text-sm font-black">Admin access aktif</div>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Seluruh operasi administratif yang tersedia untuk aplikasi dikumpulkan di sini.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title} className="p-5">
            <h2 className="font-black text-slate-900 dark:text-white">{group.title}</h2>
            <div className="mt-4 space-y-2">
              {group.items.map((item) => {
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-slate-800"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.label}</span>
                    <ArrowRight size={15} className="shrink-0 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold"><Server size={17} /> Backend</div>
          <div className="mt-2 text-xs text-slate-500">Supabase + Firebase integration</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold"><Database size={17} /> Data</div>
          <div className="mt-2 text-xs text-slate-500">Users, tasks, schedule, sessions, gallery, analytics</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-bold"><Activity size={17} /> Observability</div>
          <div className="mt-2 text-xs text-slate-500">Health, audit logs, sessions, broadcasts</div>
        </Card>
      </div>
    </div>
  );
}
