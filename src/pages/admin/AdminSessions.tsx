import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Globe2,
  LogOut,
  Monitor,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Tablet,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import { errorMessage, formatDateTime } from '../../lib/utils';

type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'laptop' | 'unknown';

type SessionRow = {
  id: string;
  user_id: string;
  session_key: string;
  login_at: string;
  last_seen_at: string;
  logout_at: string | null;
  is_current: boolean;
  device_type: DeviceType;
  device_name: string;
  device_name_exact: string | null;
  manufacturer: string | null;
  device_model: string | null;
  os: string;
  os_version: string | null;
  browser: string;
  browser_version: string | null;
  ip_address: string | null;
  client_timezone: string | null;
  screen_width: number | null;
  screen_height: number | null;
  user_agent: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
};

type UserRow = { id: string; name: string; email: string };
type JoinedSession = SessionRow & { user: UserRow | null };

function DeviceIcon({ type }: { type: DeviceType }) {
  if (type === 'mobile') return <Smartphone size={18} />;
  if (type === 'tablet') return <Tablet size={18} />;
  return <Monitor size={18} />;
}

function isRecentlyActive(lastSeenAt: string): boolean {
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff < 15 * 60 * 1000;
}

export default function AdminSessions() {
  const [sessions, setSessions] = useState<JoinedSession[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');

    const { data, error: sessionError } = await supabase
      .from('login_sessions')
      .select([
        'id',
        'user_id',
        'session_key',
        'login_at',
        'last_seen_at',
        'logout_at',
        'is_current',
        'device_type',
        'device_name',
        'device_name_exact',
        'manufacturer',
        'device_model',
        'os',
        'os_version',
        'browser',
        'browser_version',
        'ip_address',
        'client_timezone',
        'screen_width',
        'screen_height',
        'user_agent',
        'revoked_at',
        'revoked_reason',
      ].join(','))
      .order('login_at', { ascending: false })
      .limit(500);

    if (sessionError) {
      setError(errorMessage(sessionError));
      setSessions([]);
      return;
    }

    const rows = (data ?? []) as unknown as SessionRow[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];

    if (userIds.length === 0) {
      setSessions([]);
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id,name,email')
      .in('id', userIds);

    if (usersError) {
      setError(errorMessage(usersError));
      setSessions(rows.map((row) => ({ ...row, user: null })));
      return;
    }

    const userMap = new Map<string, UserRow>(
      (users ?? []).map((user) => [user.id, user as UserRow]),
    );

    setSessions(rows.map((row) => ({ ...row, user: userMap.get(row.user_id) ?? null })));
  };

  useEffect(() => {
    let alive = true;
    void load().finally(() => {
      if (alive) setLoading(false);
    });

    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sessions;

    return sessions.filter((session) => {
      const haystack = [
        session.user?.name,
        session.user?.email,
        session.device_name,
        session.device_name_exact,
        session.manufacturer,
        session.device_model,
        session.os,
        session.os_version,
        session.browser,
        session.browser_version,
        session.ip_address,
        session.client_timezone,
        session.device_type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [query, sessions]);

  const activeCount = sessions.filter(
    (session) =>
      session.is_current &&
      !session.logout_at &&
      !session.revoked_at &&
      isRecentlyActive(session.last_seen_at),
  ).length;

  const mobileCount = sessions.filter((session) => session.device_type === 'mobile').length;
  const desktopCount = sessions.filter(
    (session) => session.device_type === 'desktop' || session.device_type === 'laptop',
  ).length;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const revoke = async (session: JoinedSession) => {
    setError('');
    const now = new Date().toISOString();

    const { error: revokeError } = await supabase
      .from('login_sessions')
      .update({
        logout_at: now,
        last_seen_at: now,
        is_current: false,
        revoked_at: now,
        revoked_reason: 'admin_revoked',
      })
      .eq('id', session.id);

    if (revokeError) {
      setError(errorMessage(revokeError));
      return;
    }

    await load();
  };

  return (
    <div className="space-y-6 fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminHeader
          title="Sessions & Devices"
          description="Pantau aktivitas login lintas perangkat dari data Supabase."
        />
        <Button
          variant="outline"
          onClick={() => void refresh()}
          loading={refreshing}
          icon={<RefreshCw size={15} />}
        >
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500">Total Sesi</div>
          <div className="mt-2 text-2xl font-black">{sessions.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500">Aktif Sekarang</div>
          <div className="mt-2 flex items-center gap-2 text-2xl font-black">
            {activeCount}
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500">Mobile</div>
          <div className="mt-2 text-2xl font-black">{mobileCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs font-semibold text-slate-500">Desktop</div>
          <div className="mt-2 text-2xl font-black">{desktopCount}</div>
        </Card>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="relative max-w-xl">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari user, perangkat, model, OS, browser, IP..."
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Belum ada sesi"
              description="Belum ada riwayat login yang cocok dengan filter saat ini."
            />
          </div>
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((session) => {
              const active =
                session.is_current &&
                !session.logout_at &&
                !session.revoked_at &&
                isRecentlyActive(session.last_seen_at);

              const displayDevice = session.device_name_exact || session.device_name;
              const manufacturerModel = [session.manufacturer, session.device_model]
                .filter(Boolean)
                .join(' • ');
              const osText = [session.os, session.os_version].filter(Boolean).join(' ');
              const browserText = [session.browser, session.browser_version].filter(Boolean).join(' ');

              return (
                <div
                  key={session.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                      <DeviceIcon type={session.device_type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="truncate text-sm font-black">
                          {session.user?.name || 'Unknown user'}
                        </div>
                        {active && <Badge tone="green">Active</Badge>}
                        {session.revoked_at && <Badge tone="red">Revoked</Badge>}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {session.user?.email || session.user_id}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                      <span className="break-words font-semibold text-slate-700 dark:text-slate-200">
                        {displayDevice}
                      </span>
                    </div>

                    {manufacturerModel && (
                      <div className="flex items-start gap-2">
                        <DeviceIcon type={session.device_type} />
                        <span>{manufacturerModel}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Activity size={14} className="mt-0.5 shrink-0" />
                      <span>{osText}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Globe2 size={14} className="mt-0.5 shrink-0" />
                      <span>{browserText}</span>
                    </div>

                    {session.ip_address && (
                      <div className="flex items-start gap-2">
                        <Globe2 size={14} className="mt-0.5 shrink-0" />
                        <span className="break-all font-mono">IP {session.ip_address}</span>
                      </div>
                    )}

                    {session.client_timezone && (
                      <div className="flex items-start gap-2">
                        <Activity size={14} className="mt-0.5 shrink-0" />
                        <span>{session.client_timezone}</span>
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Activity size={14} className="mt-0.5 shrink-0" />
                      <span>Login {formatDateTime(session.login_at)}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <Activity size={14} className="mt-0.5 shrink-0" />
                      <span>Aktif terakhir {formatDateTime(session.last_seen_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {session.revoked_at
                        ? `Revoked ${formatDateTime(session.revoked_at)}`
                        : session.logout_at
                          ? `Logout ${formatDateTime(session.logout_at)}`
                          : active
                            ? 'Sesi aktif'
                            : 'Tidak aktif'}
                    </span>

                    {!session.logout_at && !session.revoked_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Putuskan sesi"
                        onClick={() => void revoke(session)}
                        icon={<LogOut size={14} />}
                      >
                        Putuskan
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
