import { supabase } from '../lib/supabase';
import type { Task } from '../types';

export interface WeeklyGoal {
  userId: string;
  target: number;
  updatedAt: string;
}

export interface WeeklyGoalProgress {
  target: number;
  completed: number;
  percent: number;
  weekStart: string;
  updatedAt: string | null;
}

const DEFAULT_TARGET = 10;
const TIME_ZONE = 'Asia/Jakarta';

function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function mondayKey(date = new Date()): string {
  const current = new Date(todayKey(date) + 'T12:00:00+07:00');
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
  }).format(current);
  const weekday = ({ Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 } as Record<string, number>)[weekdayName] ?? 1;
  const daysFromMonday = (weekday + 6) % 7;
  current.setUTCDate(current.getUTCDate() - daysFromMonday);
  return [current.getUTCFullYear(), String(current.getUTCMonth() + 1).padStart(2, '0'), String(current.getUTCDate()).padStart(2, '0')].join('-');
}

export async function loadWeeklyGoal(userId: string): Promise<WeeklyGoal> {
  if (!userId) return { userId, target: DEFAULT_TARGET, updatedAt: new Date().toISOString() };
  const weekStart = mondayKey();
  const { data, error } = await supabase
    .from('weekly_goals')
    .select('user_id,target,updated_at')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();
  if (error) throw error;
  return {
    userId,
    target: Number.isFinite(Number(data?.target)) && Number(data?.target) > 0 ? Math.min(200, Math.round(Number(data?.target))) : DEFAULT_TARGET,
    updatedAt: typeof data?.updated_at === 'string' ? data.updated_at : new Date().toISOString(),
  };
}

export async function saveWeeklyGoal(userId: string, target: number): Promise<WeeklyGoal> {
  const safeTarget = Math.max(1, Math.min(200, Math.round(target)));
  const weekStart = mondayKey();
  const { data, error } = await supabase
    .from('weekly_goals')
    .upsert({ user_id: userId, week_start: weekStart, target: safeTarget }, { onConflict: 'user_id,week_start' })
    .select('user_id,target,updated_at')
    .single();
  if (error) throw error;
  return {
    userId,
    target: Number(data?.target) || safeTarget,
    updatedAt: typeof data?.updated_at === 'string' ? data.updated_at : new Date().toISOString(),
  };
}

export function countTasksCompletedThisWeek(tasks: Array<Pick<Task, 'status' | 'completedAt'>>): number {
  const start = new Date(mondayKey() + 'T00:00:00+07:00').getTime();
  return tasks.filter((task) => {
    if (task.status !== 'completed' || !task.completedAt) return false;
    const completed = new Date(task.completedAt).getTime();
    return Number.isFinite(completed) && completed >= start;
  }).length;
}

export async function loadWeeklyGoalProgress(
  userId: string,
  completed: number,
): Promise<WeeklyGoalProgress> {
  const goal = await loadWeeklyGoal(userId);
  const percent = goal.target > 0 ? Math.round(Math.min(1, completed / goal.target) * 100) : 0;
  return {
    target: goal.target,
    completed,
    percent,
    weekStart: mondayKey(),
    updatedAt: goal.updatedAt,
  };
}
