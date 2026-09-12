import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/utils';
import { AuthLayout } from './Login';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await resetPassword(cleanEmail);
      setMessage('Jika email tersebut terdaftar, instruksi pemulihan password sudah dikirim. Buka email dan lanjutkan melalui website Fathur School Hub.');
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout eyebrow="Account recovery">
      <div className="mb-8">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl">
          <Mail size={22} />
        </div>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Lupa password?</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Masukkan email akun. Kami akan mengirim link pemulihan yang kembali ke website produksi.</p>
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Email akun</span>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input h-12 pl-11" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required />
          </div>
        </label>

        {message && (
          <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200">
            <div className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /> <span>{message}</span></div>
          </div>
        )}

        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

        <Button loading={loading} type="submit" className="h-12 w-full">Kirim link pemulihan</Button>

        <Link to="/login" className="focus-ring flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <ArrowLeft size={15} /> Kembali ke login
        </Link>
      </form>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200"><ShieldCheck size={15} className="text-emerald-500" /> Pemulihan aman</div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">Link reset hanya berlaku melalui flow Supabase Auth dan diarahkan kembali ke domain produksi.</p>
      </div>
    </AuthLayout>
  );
}
