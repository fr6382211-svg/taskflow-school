import { useMemo, useState } from 'react';
import { ArrowRight, Check, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/utils';
import { AuthLayout } from './Login';
import WorkspacePicker from '../components/WorkspacePicker';
import type { WorkspaceId } from '../context/WorkspaceContext';

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );
}

export default function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<WorkspaceId>('fathur');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const strongEnough = password.length >= 8;
  const passwordsMatch = password.length > 0 && password === confirm;
  const canSubmit = name.trim().length >= 2 && emailValid && strongEnough && passwordsMatch && !loading;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      await register(name.trim(), normalizedEmail, password, workspaceId);
      setRegisteredEmail(normalizedEmail);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return (
      <AuthLayout eyebrow="Verify your email">
        <div className="mb-7">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-xl">
            <Mail size={23} />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check size={12} /> Pendaftaran berhasil
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Periksa emailmu</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Kami sudah mengirim link verifikasi ke <strong className="text-slate-800 dark:text-slate-200">{registeredEmail}</strong>. Akun belum aktif dan kamu belum bisa masuk sebelum email selesai diverifikasi.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {[
            ['1', 'Buka email konfirmasi dari Supabase.'],
            ['2', 'Klik tombol verifikasi email.'],
            ['3', 'Selesaikan verifikasi di website Fathur School Hub.'],
            ['4', 'Setelah sukses, kembali ke halaman login dan masuk.'],
          ].map(([number, text]) => (
            <div key={number} className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[11px] font-black text-white">{number}</span>
              <p className="pt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
          Belum menerima email? Periksa folder spam/promosi. Kamu dapat meminta pengiriman ulang setelah masuk ke halaman verifikasi.
        </div>

        <Link to={`/verify-email?email=${encodeURIComponent(registeredEmail)}`} className="mt-5 block">
          <Button type="button" className="h-12 w-full" icon={<ArrowRight size={17} />}>Buka halaman verifikasi</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Create your workspace">
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl shadow-blue-900/10">
          <GraduationCap size={23} />
        </div>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Buat akun siswa</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Workspace dipilih satu kali saat pendaftaran dan menjadi identitas akunmu.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <WorkspacePicker value={workspaceId} onChange={setWorkspaceId} />
        <Field label="Nama lengkap" icon={<User size={17} />}><input className="input h-12 pl-11" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required /></Field>
        <Field label="Email" icon={<Mail size={17} />}><input className="input h-12 pl-11" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@sekolah.sch.id" required /></Field>

        <Field label="Password" icon={<LockKeyhole size={17} />}>
          <div className="relative">
            <input className="input h-12 px-11" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <Field label="Konfirmasi password" icon={<LockKeyhole size={17} />}>
          <div className="relative">
            <input className="input h-12 px-11" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Ulangi password" required />
            <button type="button" onClick={() => setShowConfirm((value) => !value)} className="focus-ring absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400" aria-label={showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}>
              {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 text-xs font-semibold ${strongEnough ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900'}`}>
            <div className="flex items-center gap-2"><Check size={14} /> Minimal 8 karakter</div>
          </div>
          <div className={`rounded-xl border p-3 text-xs font-semibold ${passwordsMatch ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-800 dark:bg-slate-900'}`}>
            <div className="flex items-center gap-2"><Check size={14} /> Password cocok</div>
          </div>
        </div>

        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-5 text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

        <Button type="submit" loading={loading} disabled={!canSubmit} className="h-12 w-full btn-glow" size="lg" icon={<ArrowRight size={17} />}>
          {loading ? 'Membuat akun...' : 'Buat akun & kirim verifikasi'}
        </Button>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">Sudah punya akun? <Link className="font-extrabold text-blue-600 dark:text-blue-400" to="/login">Masuk</Link></p>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><ShieldCheck size={15} className="text-emerald-500" /> Verifikasi email wajib</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">Akun tidak boleh masuk sebelum alamat email dikonfirmasi.</p>
      </div>
    </AuthLayout>
  );
}
