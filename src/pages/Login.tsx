import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  Wifi,
  Sun,
  Moon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/utils';

function Field({ label, icon, hint, children }: { label: string; icon: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
        {hint && <span className="text-[10px] font-semibold text-slate-400">{hint}</span>}
      </div>
      <div className="auth-field relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

export function AuthLayout({ children, eyebrow }: { children: ReactNode; eyebrow: string }) {
  const [darkPreview, setDarkPreview] = useState(() => document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkPreview);
  }, [darkPreview]);

  return (
    <div className="auth-page min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <aside className="auth-visual relative hidden overflow-hidden p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="auth-grid" />
        <span className="auth-orb auth-orb--one" />
        <span className="auth-orb auth-orb--two" />
        <span className="auth-orb auth-orb--three" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white">
            <img src="/brand/fathur-school-hub-crest.png" alt="Fathur School Hub" className="h-11 w-11 rounded-xl object-cover" />
            <div>
              <div className="text-sm font-black tracking-tight">FATHUR <span className="text-indigo-300">SCHOOL HUB</span></div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">School productivity OS</div>
            </div>
          </div>

          <div className="mt-20 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-blue-200 backdrop-blur-md">
              <Sparkles size={13} /> {eyebrow}
            </div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-slate-300">Cloud synced</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-200"><span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />Realtime</span>
            </div>
            <h2 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.04em] text-white xl:text-6xl">
              Sekolah lebih <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">terarah.</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
              Kelola deadline, jadwal, kalender, file tugas, fokus belajar, insight produktivitas, dan aktivitas sekolah dalam satu workspace yang sinkron.
            </p>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {[
                ['24/7', 'Cloud workspace'],
                ['Realtime', 'Perubahan langsung'],
                ['Secure', 'RLS protected'],
              ].map(([value, label]) => (
                <div key={label} className="auth-stat-card rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
                  <div className="text-lg font-black text-white">{value}</div>
                  <div className="mt-1 text-[11px] font-semibold text-slate-400">{label}</div>
                </div>
              ))}
            </div>

            <div className="mt-7 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white"><CheckCircle2 size={18} className="text-emerald-300" /> Fokus pada tugas</div>
                <p className="text-xs leading-5 text-slate-400">Deadline, checklist, komentar, dan file tersimpan di satu tempat.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white"><ShieldCheck size={18} className="text-blue-300" /> Aman & terkontrol</div>
                <p className="text-xs leading-5 text-slate-400">Akses data tetap dibatasi oleh Supabase Auth dan Row Level Security.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs font-semibold text-slate-500"><Wifi size={14} /> Designed for students & school teams</div>
      </aside>

      <main className="auth-panel flex min-h-screen items-center bg-slate-50 p-4 dark:bg-slate-950 sm:p-6 md:p-8 xl:p-10">
        <div className="mx-auto w-full max-w-[470px] py-5 sm:py-8">
          <div className="mb-7 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-2.5">
              <img src="/brand/fathur-school-hub-crest.png" alt="Fathur School Hub" className="h-10 w-10 rounded-xl object-cover" />
              <div><div className="text-sm font-black">FATHUR SCHOOL HUB</div><div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Academic Velocity Workspace</div></div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setDarkPreview((value) => !value)} className="focus-ring grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200" aria-label="Ubah tema">
                {darkPreview ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Secure sign-in</div>
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | null)?.from || '/';
  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const passwordValid = password.length >= 8;
  const canSubmit = emailValid && passwordValid && !loading;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      await login(normalizedEmail, password, remember);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = errorMessage(err);
      if (err instanceof Error && err.name === 'EmailNotVerifiedError') {
        setError(`${message} Gunakan halaman verifikasi untuk mengirim ulang email.`);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout eyebrow="Welcome back">
      <div className="mb-8">
        <div className="mb-4 hidden h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-900/10 sm:grid lg:hidden"><KeyRound size={22} /></div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><Sparkles size={12} /> Secure workspace</div>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-4xl">Masuk ke Fathur School Hub</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Akun sudah terikat ke satu workspace sejak pendaftaran. Admin dapat mengubah workspace akun dari profil.</p>
      </div>

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email" hint="Gunakan email aktif" icon={<Mail size={17} />}>
          <input
            className="input h-12 pl-11 pr-3"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@sekolah.sch.id"
            aria-invalid={email.length > 0 && !emailValid}
            required
          />
        </Field>

        <Field label="Password" hint="Minimal 8 karakter" icon={<LockKeyhole size={17} />}>
          <input
            className="input h-12 px-11"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan password"
            minLength={8}
            aria-invalid={password.length > 0 && !passwordValid}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </Field>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
          <label className="flex min-w-0 cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="truncate">Ingat perangkat ini</span>
          </label>
          <Link className="shrink-0 text-sm font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" to="/forgot-password">Lupa password?</Link>
        </div>

        {error && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-5 text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">
            <div className="flex items-start gap-3"><LockKeyhole size={17} className="mt-0.5 shrink-0" /><span>{error}</span></div>
          </div>
        )}

        <div className="flex justify-end"><Link to={`/verify-email?email=${encodeURIComponent(normalizedEmail)}`} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">Belum verifikasi email?</Link></div>

        <Button type="submit" loading={loading} disabled={!canSubmit} className="h-12 w-full btn-glow" size="lg" icon={<ArrowRight size={17} />}>
          {loading ? 'Memeriksa akun...' : 'Masuk ke workspace'}
        </Button>

        <div className="flex items-center gap-3 py-1"><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">atau</span><div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" /></div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">Belum punya akun? <Link className="font-extrabold text-blue-600 dark:text-blue-400" to="/register">Buat akun siswa</Link></p>
      </form>

      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><ShieldCheck size={15} className="text-emerald-500" /> Data terproteksi</div><p className="mt-1 text-[11px] leading-5 text-slate-500">Akses dikontrol oleh Supabase Auth + RLS.</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><CheckCircle2 size={15} className="text-blue-500" /> Multi-device</div><p className="mt-1 text-[11px] leading-5 text-slate-500">Task, jadwal, dan profil tetap tersinkron.</p></div>
      </div>
    </AuthLayout>
  );
}
