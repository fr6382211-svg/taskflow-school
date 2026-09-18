import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CheckCircle2, Clock3, Mail, Save, ShieldCheck, Sparkles, UserCircle2, ClipboardList, CircleCheck, TimerReset, AlertTriangle, Copy, Smartphone, Monitor, Tablet, Globe2, LogIn, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile, updateUserWorkspace } from '../services/userService';
import { useWorkspace, WORKSPACES, type WorkspaceId } from '../context/WorkspaceContext';
import { uploadAvatar } from '../services/storageService';
import { errorMessage, formatDateTime } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { useTasks } from '../hooks/useTasks';
import { getRecentLoginSessions, type LoginSession } from '../services/loginSessionService';

export default function Profile() {
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const { workspaceId, setWorkspaceId } = useWorkspace();
  const { tasks } = useTasks();
  const { push } = useToast();
  const [name, setName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [profileWorkspace, setProfileWorkspace] = useState<WorkspaceId>('fathur');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(profile?.name || '');
    setPhotoURL(profile?.photoURL || '');
    setProfileWorkspace(profile?.workspaceId === 'mazet' ? 'mazet' : 'fathur');
  }, [profile]);

  async function loadLoginSessions() {
    if (!user?.id) return;
    setLoadingSessions(true);
    try {
      const sessions = await getRecentLoginSessions(user.id, 10);
      setLoginSessions(sessions);
    } catch (e) {
      console.error('TASKFLOW login sessions load failed', e);
      push({ tone: 'error', title: 'Riwayat login gagal dimuat', message: errorMessage(e) });
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    void loadLoginSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const initials = useMemo(() => (name || 'Pengguna').trim().split(/\s+/).slice(0, 2).map((v) => v[0]).join('').toUpperCase(), [name]);
  const accountAge = profile?.createdAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(profile.createdAt)) : 'Belum tersedia';
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'completed').length;
    const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
    const overdue = tasks.filter((task) => task.status === 'overdue' || (task.status !== 'completed' && task.dueAt && new Date(task.dueAt).getTime() < Date.now())).length;
    return { total, completed, inProgress, overdue, rate: total ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

  async function copyUserId() {
    if (!user?.id || !navigator.clipboard) return;
    await navigator.clipboard.writeText(user.id);
    push({ tone: 'success', title: 'User ID disalin', message: 'ID siap ditempel di kebutuhan administrasi.' });
  }


  async function handleAvatar(file?: File) {
    if (!file || !user) return;
    setAvatarUploading(true); setError('');
    try {
      const url = await uploadAvatar(user.id, file);
      setPhotoURL(url);
      await updateUserProfile(user.id, { name: name.trim() || profile?.name || 'Pengguna', photoURL: url });
      await refreshProfile();
      push({ tone: 'success', title: 'Foto profil diperbarui', message: 'Perubahan langsung tersinkron ke akunmu.' });
    } catch (e) {
      setError(errorMessage(e));
      push({ tone: 'error', title: 'Gagal mengubah foto', message: errorMessage(e) });
    } finally { setAvatarUploading(false); }
  }

  function sessionIcon(type: LoginSession['device_type']) {
    if (type === 'mobile') return Smartphone;
    if (type === 'tablet') return Tablet;
    return Monitor;
  }

  function sessionStatus(session: LoginSession) {
    if (session.is_current && !session.logout_at) return 'Perangkat ini';
    if (session.logout_at) return 'Keluar';
    return 'Sesi tersimpan';
  }

  function formatSessionDate(value?: string | null) {
    if (!value) return 'Belum tersedia';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  async function save() {
    if (!user) return;
    if (name.trim().length < 2) { setError('Nama minimal 2 karakter.'); return; }
    setSaving(true); setError('');
    try {
      await updateUserProfile(user.id, { name: name.trim(), photoURL: photoURL || undefined });
      if (isAdmin) {
        await updateUserWorkspace(user.id, profileWorkspace);
        setWorkspaceId(profileWorkspace);
      }
      await refreshProfile();
      push({ tone: 'success', title: 'Profil tersimpan', message: 'Nama dan identitasmu sudah diperbarui.' });
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 fade-up">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-500 to-violet-600 text-2xl font-black text-white shadow-xl shadow-blue-600/20">
                {photoURL ? <img src={photoURL} alt="Foto profil" className="h-full w-full object-cover" /> : initials || <UserCircle2 size={42} />}
              </div>
              <button type="button" onClick={() => inputRef.current?.click()} className="focus-ring absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-xl border-2 border-white bg-slate-900 text-white shadow-lg dark:border-slate-900" aria-label="Ganti foto profil">
                <Camera size={16} />
              </button>
              <input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void handleAvatar(e.target.files?.[0])} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{profile?.name || 'Pengguna'}</h1>
                <Badge tone={profile?.role === 'admin' ? 'purple' : 'blue'}>{profile?.role === 'admin' ? 'Administrator' : 'Siswa'}</Badge>
              </div>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Mail size={14} /> {profile?.email}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><Sparkles size={13} /> Profil cloud aktif</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 md:w-64">
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Akun dibuat</div><div className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{accountAge}</div></div>
            <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</div><div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 size={13}/> {profile?.status === 'disabled' ? 'Disabled' : 'Active'}</div></div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {([
          [ClipboardList, 'Total tugas', taskStats.total, 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'],
          [CircleCheck, 'Selesai', taskStats.completed, 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/25'],
          [TimerReset, 'Dikerjakan', taskStats.inProgress, 'text-violet-600 bg-violet-50 dark:bg-violet-950/25'],
          [AlertTriangle, 'Terlambat', taskStats.overdue, 'text-rose-600 bg-rose-50 dark:bg-rose-950/25'],
        ] as [LucideIcon, string, number, string][]).map(([Icon, label, value, tone]) => <Card key={label} className="p-4"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon size={17}/></div><div><div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div><div className="text-xl font-black text-slate-900 dark:text-white">{value}</div></div></div></Card>)}
      </div>
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Produktivitas</p><h2 className="mt-1 text-lg font-extrabold">Completion rate {taskStats.rate}%</h2><p className="mt-1 text-sm text-slate-500">Ringkasan tugas yang tersimpan di Supabase untuk akun ini.</p></div><div className="h-3 w-full max-w-sm overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-700" style={{ width: `${taskStats.rate}%` }} /></div></div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_.6fr]">
        <Card className="p-6">
          <div className="mb-5"><h2 className="text-lg font-extrabold">Identitas & profil</h2><p className="mt-1 text-sm text-slate-500">Perbarui informasi yang terlihat di workspace Taskflow.</p></div>
          <div className="grid gap-4">
            <label><span className="label">Nama lengkap</span><input className="input h-12" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /></label>
            <div>
              <span className="label">Workspace akun</span>
              {isAdmin ? (
                <select className="input h-12" value={profileWorkspace} onChange={(e) => setProfileWorkspace(e.target.value === 'mazet' ? 'mazet' : 'fathur')}>
                  <option value="fathur">Fathur</option>
                  <option value="mazet">Mazet</option>
                </select>
              ) : (
                <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200">{WORKSPACES[workspaceId].name} <span className="ml-2 text-xs font-medium text-slate-400">(ditetapkan saat daftar)</span></div>
              )}
            </div>
            <label><span className="label">Email akun</span><input className="input h-12 bg-slate-50 dark:bg-slate-800" value={profile?.email || ''} disabled /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><div className="label">Login terakhir</div><div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><Clock3 size={15} className="text-blue-500"/>{formatDateTime(profile?.lastLoginAt)}</div></div>
              <div><div className="label">Status akses</div><div className="text-sm font-semibold text-emerald-600">{profile?.status === 'disabled' ? 'Akses dinonaktifkan' : 'Akses aktif'}</div></div>
            </div>
            {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button loading={avatarUploading} variant="outline" onClick={() => inputRef.current?.click()} icon={<Camera size={16}/>}>Ganti foto</Button><Button loading={saving} onClick={save} icon={<Save size={16}/>}>Simpan perubahan</Button></div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-emerald-500" size={20}/><div><h3 className="font-bold">Keamanan akun</h3><p className="mt-1 text-sm leading-6 text-slate-500">Role, data, dan akses admin divalidasi melalui policy Supabase, bukan sekadar UI.</p></div></div></Card>
          <Card className="p-5"><div className="flex items-center justify-between gap-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">User ID</div><button type="button" onClick={() => void copyUserId()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-800" aria-label="Salin User ID"><Copy size={14}/></button></div><div className="mt-2 break-all font-mono text-xs text-slate-600 dark:text-slate-300">{user?.id}</div></Card>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-500" />
                <h2 className="text-lg font-extrabold">Aktivitas login & perangkat</h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">Setiap login dicatat agar kamu bisa mengetahui kapan akun digunakan dan dari perangkat apa.</p>
            </div>
            <Button variant="outline" loading={loadingSessions} onClick={() => void loadLoginSessions()} icon={<RefreshCw size={15} />}>Refresh</Button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loginSessions.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <LogIn size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Belum ada riwayat sesi yang tersimpan.</p>
              <p className="mt-1 text-xs text-slate-400">Login berikutnya akan otomatis masuk ke daftar perangkat.</p>
            </div>
          ) : loginSessions.map((session) => {
            const DeviceIcon = sessionIcon(session.device_type);
            return (
              <div key={session.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={session.is_current && !session.logout_at ? 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}>
                      <DeviceIcon size={19} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{session.device_name}</h3>
                        {session.is_current && !session.logout_at && <Badge tone="green">Aktif sekarang</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Globe2 size={12} /> {session.browser}</span>
                        <span>{session.os}</span>
                        <span>{session.device_type}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span>Login: {formatSessionDate(session.login_at)}</span>
                        <span>Aktivitas: {formatSessionDate(session.last_seen_at)}</span>
                        {session.logout_at && <span>Keluar: {formatSessionDate(session.logout_at)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 self-start rounded-full border border-slate-200 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {sessionStatus(session)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
