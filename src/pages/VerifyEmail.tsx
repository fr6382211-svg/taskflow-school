import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/utils';
import { AuthLayout } from './Login';
import { confirmEmailFromToken, resendConfirmationEmail } from '../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const email = searchParams.get('email') ?? '';
  const tokenHash = searchParams.get('token_hash') ?? '';

  const title = useMemo(
    () => (tokenHash ? 'Konfirmasi email' : 'Verifikasi email kamu'),
    [tokenHash],
  );

  async function verify() {
    if (!tokenHash) {
      setError('Token verifikasi tidak tersedia. Buka link verifikasi terbaru dari email Anda.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await confirmEmailFromToken(tokenHash);
      await refreshProfile().catch(() => undefined);
      setSuccess(true);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) {
      setError('Masukkan email pada halaman pendaftaran atau tambahkan parameter email pada URL.');
      return;
    }

    setResending(true);
    setError('');
    try {
      await resendConfirmationEmail(email);
      setSuccess(false);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout eyebrow="Email verification">
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-xl">
          {success ? <CheckCircle2 size={23} /> : <Mail size={23} />}
        </div>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{success ? 'Email berhasil diverifikasi' : title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
          {success
            ? 'Verifikasi selesai. Akun tetap tidak otomatis masuk. Silakan kembali ke halaman login dan masuk dengan password Anda.'
            : email
              ? `Periksa ${email} dan gunakan link verifikasi yang dikirim oleh Fathur School Hub.`
              : 'Buka email konfirmasi dari Fathur School Hub untuk menyelesaikan aktivasi akun.'}
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/25">
            <div className="flex items-start gap-3"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" /><p className="text-sm font-semibold leading-6 text-emerald-800 dark:text-emerald-200">Akun sekarang aktif untuk login. Tidak ada auto-login setelah verifikasi.</p></div>
          </div>
          <Link to="/login" className="block"><Button className="h-12 w-full">Kembali ke login</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tokenHash ? (
            <Button loading={loading} onClick={() => void verify()} className="h-12 w-full" icon={<CheckCircle2 size={17} />}>Verifikasi email</Button>
          ) : (
            <Button loading={resending} onClick={() => void resend()} variant="outline" className="h-12 w-full" icon={<RefreshCw size={17} />}>Kirim ulang email verifikasi</Button>
          )}

          {email && !tokenHash && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="text-xs font-black">Email tujuan</div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-500">{email}</div>
            </div>
          )}

          {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold leading-6 text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300"><div className="flex items-start gap-3"><AlertCircle size={18} className="mt-0.5 shrink-0" />{error}</div></div>}

          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/login" className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300"><ArrowLeft size={15} /> Login</Link>
            <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-[11px] font-semibold text-slate-500 dark:border-slate-800"><ShieldCheck size={14} className="text-emerald-500" /> Akun belum aktif</div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
