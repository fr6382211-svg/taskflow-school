import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { AuthLayout } from './Login';
import { supabase } from '../lib/supabase';
import { errorMessage } from '../lib/utils';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const inspect = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setReady(Boolean(data.session));
      } catch (err) {
        if (active) setError(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    void inspect();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setReady(Boolean(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      await supabase.auth.signOut({ scope: 'local' });
      setSuccess(true);
    } catch (err: unknown) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthLayout eyebrow="Password recovery">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Memeriksa link pemulihan...</p>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout eyebrow="Password recovery">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 size={25} /></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Password berhasil diubah</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Demi keamanan, sesi recovery sudah ditutup. Silakan login kembali dengan password baru.</p>
        </div>
        <Link to="/login" className="block"><Button className="h-12 w-full">Kembali ke login</Button></Link>
      </AuthLayout>
    );
  }

  if (!ready) {
    return (
      <AuthLayout eyebrow="Password recovery">
        <div className="mb-7">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><KeyRound size={22} /></div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Link pemulihan tidak siap</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Buka link reset password dari email terbaru. Jangan menggunakan link lama yang sudah kedaluwarsa.</p>
        </div>
        {error && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
        <Link to="/forgot-password" className="block"><Button className="h-12 w-full">Kirim link baru</Button></Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Password recovery">
      <div className="mb-7">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><LockKeyhole size={22} /></div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Buat password baru</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Gunakan password baru minimal 8 karakter. Setelah disimpan, Anda harus login lagi secara normal.</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Password baru</span>
          <div className="relative"><input className="input h-12 px-11" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required /><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Konfirmasi password</span>
          <div className="relative"><input className="input h-12 px-11" type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required /><LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400">{showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        </label>

        {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-950 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}

        <Button type="submit" loading={saving} className="h-12 w-full">Simpan password baru</Button>
      </form>
    </AuthLayout>
  );
}
