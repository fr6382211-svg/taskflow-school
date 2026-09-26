import type { ScheduleItem, Task } from '../types';
import type { FocusStreak } from './focusService';
import { isOverdue, timeToMinutes, relativeDeadline } from '../lib/utils';

export type RiskLevel = 'aman' | 'waspada' | 'kritis';

export interface AdvisorTaskRef {
  id: string;
  title: string;
  subjectName: string;
  dueLabel: string;
  priorityScore: number;
}

export interface FocusBlock {
  id: string;
  window: string;
  minutes: number;
  kind: 'deep' | 'review' | 'quick';
  taskTitle: string | null;
  taskId: string | null;
}

export interface SmartPlan {
  riskLevel: RiskLevel;
  headline: string;
  tip: string;
  focusNext: AdvisorTaskRef | null;
  queue: AdvisorTaskRef[];
  blocks: FocusBlock[];
  reasons: string[];
}

const PRIORITY_WEIGHT: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };

function jakartaWeekday(date: Date): ScheduleItem['day'] {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(date);
  const map: Record<string, ScheduleItem['day']> = {
    Sunday: 'Minggu', Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
    Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu',
  };
  return map[name] ?? 'Senin';
}

function jakartaNowMinutes(date: Date) {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date).split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function scoreTask(task: Task): number {
  const overdue = isOverdue(task);
  const dueMinutes = new Date(`${task.dueDate}T${task.dueTime || '23:59'}:00`).getTime();
  const hoursLeft = (dueMinutes - Date.now()) / 3_600_000;
  const urgency = overdue ? 100 : Math.max(0, 72 - Math.min(72, hoursLeft));
  const weight = PRIORITY_WEIGHT[task.priority] ?? 1;
  return urgency + weight * 6;
}

function minutesToClock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Builds today's free windows (WIB) by subtracting active "subject" schedule
 * items from a study day between 06:00 and 22:00.
 */
function freeWindowsToday(now: Date, schedule: ScheduleItem[]): Array<{ start: number; end: number }> {
  const today = jakartaWeekday(now);
  const nowMinutes = jakartaNowMinutes(now);
  const dayStart = Math.max(nowMinutes, 6 * 60);
  const dayEnd = 22 * 60;
  if (dayStart >= dayEnd) return [];

  const busy = schedule
    .filter((item) => item.day === today && item.active !== false && item.type === 'subject')
    .map((item) => ({ start: timeToMinutes(item.startTime), end: timeToMinutes(item.endTime) }))
    .filter((slot) => slot.end > dayStart && slot.start < dayEnd)
    .sort((a, b) => a.start - b.start);

  const free: Array<{ start: number; end: number }> = [];
  let cursor = dayStart;
  for (const slot of busy) {
    if (slot.start > cursor) free.push({ start: cursor, end: Math.min(slot.start, dayEnd) });
    cursor = Math.max(cursor, slot.end);
  }
  if (cursor < dayEnd) free.push({ start: cursor, end: dayEnd });

  return free.filter((slot) => slot.end - slot.start >= 20);
}

export function computeSmartPlan(now: Date, tasks: Task[], schedule: ScheduleItem[], streak: FocusStreak): SmartPlan {
  const pending = tasks.filter((t) => t.status !== 'completed');
  const overdueCount = pending.filter((t) => isOverdue(t)).length;
  const dueTodayCount = pending.filter((t) => {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now);
    return t.dueDate === today;
  }).length;

  const ranked = [...pending].sort((a, b) => scoreTask(b) - scoreTask(a));
  const queue: AdvisorTaskRef[] = ranked.slice(0, 5).map((t) => ({
    id: t.id,
    title: t.title,
    subjectName: t.subjectName || 'Umum',
    dueLabel: relativeDeadline(t),
    priorityScore: Math.round(scoreTask(t)),
  }));

  const riskLevel: RiskLevel = overdueCount > 0 ? 'kritis' : dueTodayCount > 2 ? 'waspada' : 'aman';

  const reasons: string[] = [];
  if (overdueCount > 0) reasons.push(`${overdueCount} tugas sudah lewat deadline — prioritaskan ini dulu.`);
  if (dueTodayCount > 0) reasons.push(`${dueTodayCount} tugas jatuh tempo hari ini.`);
  if (streak.currentStreak >= 3) reasons.push(`Streak fokus ${streak.currentStreak} hari — jaga momentum ini.`);
  if (streak.currentStreak === 0 && streak.totalMinutes > 0) reasons.push('Streak fokusmu terputus — mulai sesi baru hari ini.');
  if (reasons.length === 0) reasons.push('Tidak ada tekanan deadline mendesak — waktu bagus untuk mencicil tugas berikutnya.');

  const headline =
    riskLevel === 'kritis'
      ? 'Ada tugas terlambat yang butuh perhatian segera.'
      : riskLevel === 'waspada'
        ? 'Beberapa tugas jatuh tempo hari ini.'
        : 'Semua terkendali — saatnya membangun momentum.';

  const tip =
    riskLevel === 'kritis'
      ? 'Kerjakan tugas paling lama terlambat lebih dulu dalam blok fokus 25 menit, lalu evaluasi sisanya.'
      : streak.currentStreak >= 3
        ? 'Pertahankan ritme: satu sesi fokus singkat sore ini sudah cukup menjaga streak.'
        : 'Coba mulai dengan sesi fokus 25 menit tanpa distraksi pada tugas prioritas tertinggi.';

  const windows = freeWindowsToday(now, schedule);
  const blocks: FocusBlock[] = [];
  let taskCursor = 0;
  for (const window of windows.slice(0, 3)) {
    const available = window.end - window.start;
    const minutes = available >= 55 ? 45 : available >= 35 ? 25 : 20;
    const assigned = queue[taskCursor] ?? null;
    blocks.push({
      id: `${window.start}-${window.end}`,
      window: `${minutesToClock(window.start)}–${minutesToClock(window.start + minutes)} WIB`,
      minutes,
      kind: minutes >= 45 ? 'deep' : minutes >= 25 ? 'review' : 'quick',
      taskTitle: assigned?.title ?? null,
      taskId: assigned?.id ?? null,
    });
    if (assigned) taskCursor += 1;
    if (blocks.length >= 3) break;
  }

  return {
    riskLevel,
    headline,
    tip,
    focusNext: queue[0] ?? null,
    queue,
    blocks,
    reasons,
  };
}
