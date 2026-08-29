import { supabase } from '../lib/supabase';

export interface FocusSessionInput {
  taskId?: string | null;
  minutes: number;
  startedAt: string;
  endedAt: string;
}

export async function saveFocusSession(userId: string, input: FocusSessionInput) {
  const { error } = await supabase.from('focus_sessions').insert({
    user_id: userId,
    task_id: input.taskId || null,
    minutes: input.minutes,
    started_at: input.startedAt,
    ended_at: input.endedAt,
  });
  if (error) throw error;
}

export async function loadFocusStats(userId: string) {
  const { data, error } = await supabase.from('focus_sessions').select('minutes,created_at,task_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  const rows: Array<{ minutes: number | null; created_at: string | null; task_id: string | null }> = (data || []) as Array<{ minutes: number | null; created_at: string | null; task_id: string | null }>;
  return {
    totalMinutes: rows.reduce((sum: number, r) => sum + Number(r.minutes || 0), 0),
    sessions: rows.length,
    recent: rows.slice(0, 10),
  };
}
