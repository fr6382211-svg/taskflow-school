import { supabase } from '../lib/supabase';

export type UserSettingsPayload = {
  email_notifications?: boolean;
  deadline_reminder?: boolean;
  dark_mode?: boolean;
  compact_mode?: boolean;
  reduced_motion?: boolean;
  theme_mode?: 'system' | 'light' | 'dark';
  accent_color?: 'blue' | 'violet' | 'cyan' | 'emerald';
  density?: 'compact' | 'comfortable' | 'spacious';
  show_watermark?: boolean;
  week_starts_monday?: boolean;
  animations?: boolean;
  show_live_bar?: boolean;
};

export async function getSettings(userId: string) {
  if (!userId) throw new Error('ID pengguna tidak tersedia.');

  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal memuat pengaturan (${error.code}): ${error.message}`);
  }

  return data;
}

export async function saveSettings(userId: string, settings: UserSettingsPayload) {
  if (!userId) throw new Error('ID pengguna tidak tersedia.');

  const payload = {
    user_id: userId,
    ...settings,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('settings')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Gagal menyimpan pengaturan (${error.code}): ${error.message}`);
  }
}

export async function getSystemSettings() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveSystemSettings(settings: Record<string, unknown>) {
  const { error } = await supabase
    .from('system_settings')
    .upsert({ id: 1, ...settings }, { onConflict: 'id' });

  if (error) throw error;
}
