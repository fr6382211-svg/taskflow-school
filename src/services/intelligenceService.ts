import { supabase } from '../lib/supabase';
import type { RiskLevel, SmartPlan } from './smartAdvisorService';
import type { FocusStreak } from './focusService';

export interface InsightSnapshot {
  id?: string;
  userId: string;
  workspaceId: 'fathur' | 'mazet';
  riskLevel: RiskLevel;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  focusMinutes: number;
  currentStreak: number;
  plan: SmartPlan;
  createdAt?: string;
}

export async function saveInsightSnapshot(snapshot: InsightSnapshot): Promise<void> {
  const { error } = await supabase.from('insight_snapshots').insert({
    user_id: snapshot.userId,
    workspace_id: snapshot.workspaceId,
    risk_level: snapshot.riskLevel,
    total_tasks: snapshot.totalTasks,
    completed_tasks: snapshot.completedTasks,
    overdue_tasks: snapshot.overdueTasks,
    focus_minutes: snapshot.focusMinutes,
    current_streak: snapshot.currentStreak,
    plan: snapshot.plan,
  });
  if (error) throw error;
}

export async function loadLatestInsightSnapshot(userId: string): Promise<InsightSnapshot | null> {
  const { data, error } = await supabase
    .from('insight_snapshots')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    workspaceId: data.workspace_id,
    riskLevel: data.risk_level,
    totalTasks: Number(data.total_tasks ?? 0),
    completedTasks: Number(data.completed_tasks ?? 0),
    overdueTasks: Number(data.overdue_tasks ?? 0),
    focusMinutes: Number(data.focus_minutes ?? 0),
    currentStreak: Number(data.current_streak ?? 0),
    plan: data.plan as SmartPlan,
    createdAt: data.created_at,
  };
}

export function buildInsightSnapshot(args: {
  userId: string;
  workspaceId: 'fathur' | 'mazet';
  tasks: { status: string }[];
  streak: FocusStreak;
  plan: SmartPlan;
}): InsightSnapshot {
  return {
    userId: args.userId,
    workspaceId: args.workspaceId,
    riskLevel: args.plan.riskLevel,
    totalTasks: args.tasks.length,
    completedTasks: args.tasks.filter((task) => task.status === 'completed').length,
    overdueTasks: args.tasks.filter((task) => task.status === 'overdue').length,
    focusMinutes: args.streak.totalMinutes,
    currentStreak: args.streak.currentStreak,
    plan: args.plan,
  };
}
