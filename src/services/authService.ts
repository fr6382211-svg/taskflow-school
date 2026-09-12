import { supabase, APP_URL, setAuthPersistence } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';
import { recordLoginSession, recordLogoutSession } from './loginSessionService';
import { recordLoginActivity } from './loginActivityService';
import type { WorkspaceId } from '../context/WorkspaceContext';

export async function login(email: string, password: string, remember: boolean) {
  setAuthPersistence(remember);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (!data.user) {
    throw new Error('Akun tidak dapat dibuatkan sesi. Silakan coba lagi.');
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut({ scope: 'local' });
    const verificationError = new Error('Email akun ini belum diverifikasi. Buka email konfirmasi yang dikirimkan ke alamat Anda sebelum masuk.');
    verificationError.name = 'EmailNotVerifiedError';
    throw verificationError;
  }

  try {
    await recordLoginSession(data.user.id, remember);
    await recordLoginActivity('login', { workspace: data.user.user_metadata?.preferred_workspace ?? null });
  } catch (sessionError) {
    console.error('TASKFLOW login session tracking failed', sessionError);
  }

  await trackEvent('login');
  return data.user;
}

export async function register(
  name: string,
  email: string,
  password: string,
  workspace: WorkspaceId,
) {
  if (name.trim().length < 2) {
    throw new Error('Nama lengkap minimal 2 karakter.');
  }

  if (password.length < 8) {
    throw new Error('Password minimal 8 karakter.');
  }

  if (workspace !== 'fathur' && workspace !== 'mazet') {
    throw new Error('Workspace pendaftaran tidak valid.');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name.trim(),
        preferred_workspace: workspace,
      },
      emailRedirectTo: `${APP_URL}/auth/confirm`,
    },
  });

  if (error) throw error;

  /*
   * Do not manually create the user row here. The database trigger owns
   * account provisioning so the workspace remains attached to the auth
   * metadata even when email confirmation is required and session is null.
   */
  await trackEvent('sign_up');

  if (data.user && data.session) {
    // If Confirm Email is accidentally disabled, never silently sign the
    // user into the application. Keep the required verification gate.
    await supabase.auth.signOut({ scope: 'local' });
    throw new Error('Pendaftaran masuk tetapi konfirmasi email Supabase belum aktif. Aktifkan Confirm Email agar akun hanya aktif setelah email diverifikasi.');
  }

  if (!data.user) {
    throw new Error('Akun belum dapat dibuat. Silakan coba lagi.');
  }

  return data.user;
}

export async function resendConfirmationEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('Masukkan email akun terlebih dahulu.');
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: `${APP_URL}/auth/confirm`,
    },
  });

  if (error) throw error;
}

export async function confirmEmailFromToken(
  tokenHash: string,
) {
  if (!tokenHash) {
    throw new Error('Token verifikasi email tidak ditemukan.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'email',
  });

  if (error) throw error;

  if (!data.user?.email_confirmed_at) {
    throw new Error('Email belum terverifikasi. Silakan ulangi proses verifikasi.');
  }

  await supabase.auth.signOut({ scope: 'local' });
  return data.user;
}

export async function resetPassword(email: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('Masukkan email akun terlebih dahulu.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    cleanEmail,
    {
      redirectTo: `${APP_URL}/auth/reset-password`,
    },
  );

  if (error) throw error;
}

export async function logout() {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    try {
      await recordLogoutSession(data.user.id);
    } catch (sessionError) {
      console.error('TASKFLOW login session logout tracking failed', sessionError);
    }
  }

  await recordLoginActivity('logout');
  await trackEvent('logout');

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
