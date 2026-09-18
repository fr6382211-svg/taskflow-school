import type { Task } from '../types';
import type { FocusStreak } from './focusService';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: AchievementTier;
  emoji: string;
  progress: number;
  target: number;
  unlocked: boolean;
}

export interface AchievementSummary {
  achievements: Achievement[];
  unlockedCount: number;
  totalCount: number;
  nextUp: Achievement | null;
}

function clampRatio(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(1, value / target));
}

export function computeAchievements(tasks: Task[], streak: FocusStreak): AchievementSummary {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const onTime = tasks.filter((t) => {
    if (t.status !== 'completed' || !t.completedAt) return false;
    const due = new Date(`${t.dueDate}T${t.dueTime || '23:59'}:00`).getTime();
    const done = new Date(t.completedAt).getTime();
    return Number.isFinite(due) && Number.isFinite(done) && done <= due;
  }).length;
  const overdueNow = tasks.filter((t) => t.status === 'overdue').length;

  const definitions: Achievement[] = [
    {
      id: 'first-task',
      title: 'Langkah Pertama',
      description: 'Selesaikan tugas pertamamu.',
      tier: 'bronze',
      emoji: '🌱',
      progress: Math.min(completed, 1),
      target: 1,
      unlocked: completed >= 1,
    },
    {
      id: 'task-master-10',
      title: 'Task Runner',
      description: 'Selesaikan 10 tugas.',
      tier: 'bronze',
      emoji: '🏃',
      progress: Math.min(completed, 10),
      target: 10,
      unlocked: completed >= 10,
    },
    {
      id: 'task-master-50',
      title: 'Task Master',
      description: 'Selesaikan 50 tugas.',
      tier: 'silver',
      emoji: '🎯',
      progress: Math.min(completed, 50),
      target: 50,
      unlocked: completed >= 50,
    },
    {
      id: 'task-master-100',
      title: 'Task Legend',
      description: 'Selesaikan 100 tugas.',
      tier: 'gold',
      emoji: '👑',
      progress: Math.min(completed, 100),
      target: 100,
      unlocked: completed >= 100,
    },
    {
      id: 'punctual-10',
      title: 'Tepat Waktu',
      description: 'Selesaikan 10 tugas sebelum deadline.',
      tier: 'silver',
      emoji: '⏱️',
      progress: Math.min(onTime, 10),
      target: 10,
      unlocked: onTime >= 10,
    },
    {
      id: 'streak-3',
      title: 'Momentum',
      description: 'Fokus belajar 3 hari berturut-turut.',
      tier: 'bronze',
      emoji: '🔥',
      progress: Math.min(streak.currentStreak, 3),
      target: 3,
      unlocked: streak.currentStreak >= 3,
    },
    {
      id: 'streak-7',
      title: 'Konsisten',
      description: 'Fokus belajar 7 hari berturut-turut.',
      tier: 'silver',
      emoji: '🔥',
      progress: Math.min(streak.currentStreak, 7),
      target: 7,
      unlocked: streak.currentStreak >= 7,
    },
    {
      id: 'streak-30',
      title: 'Unstoppable',
      description: 'Fokus belajar 30 hari berturut-turut.',
      tier: 'platinum',
      emoji: '⚡',
      progress: Math.min(streak.currentStreak, 30),
      target: 30,
      unlocked: streak.currentStreak >= 30,
    },
    {
      id: 'focus-300',
      title: 'Deep Work',
      description: 'Kumpulkan 300 menit sesi Focus.',
      tier: 'silver',
      emoji: '🧠',
      progress: Math.min(streak.totalMinutes, 300),
      target: 300,
      unlocked: streak.totalMinutes >= 300,
    },
    {
      id: 'focus-1000',
      title: 'Marathoner',
      description: 'Kumpulkan 1000 menit sesi Focus.',
      tier: 'gold',
      emoji: '🏆',
      progress: Math.min(streak.totalMinutes, 1000),
      target: 1000,
      unlocked: streak.totalMinutes >= 1000,
    },
    {
      id: 'clean-slate',
      title: 'Clean Slate',
      description: 'Tidak ada tugas terlambat saat ini.',
      tier: 'bronze',
      emoji: '✨',
      progress: overdueNow === 0 ? 1 : 0,
      target: 1,
      unlocked: overdueNow === 0 && tasks.length > 0,
    },
  ];

  const unlocked = definitions.filter((a) => a.unlocked);
  const locked = definitions
    .filter((a) => !a.unlocked)
    .sort((a, b) => clampRatio(b.progress, b.target) - clampRatio(a.progress, a.target));

  return {
    achievements: definitions,
    unlockedCount: unlocked.length,
    totalCount: definitions.length,
    nextUp: locked[0] ?? null,
  };
}
