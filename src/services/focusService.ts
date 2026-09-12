import { supabase } from '../lib/supabase';

export interface FocusSessionInput {
  taskId?: string | null;
  minutes: number;
  startedAt: string;
  endedAt: string;
}

export interface FocusSessionRow {
  minutes: number | null;
  created_at: string | null;
  task_id: string | null;
}

export interface FocusStats {
  totalMinutes: number;
  sessions: number;
  recent: FocusSessionRow[];
}

export interface FocusStreak {
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  activeDays: number;
  totalMinutes: number;
  sessions: number;
  lastActiveDate: string | null;
}

const TIME_ZONE = 'Asia/Jakarta';

const EMPTY_STATS: FocusStats = {
  totalMinutes: 0,
  sessions: 0,
  recent: [],
};

const EMPTY_STREAK: FocusStreak = {
  currentStreak: 0,
  longestStreak: 0,
  todayMinutes: 0,
  activeDays: 0,
  totalMinutes: 0,
  sessions: 0,
  lastActiveDate: null,
};

function normalizeMinutes(value: unknown): number {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
}

function dateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function shiftDate(key: string, amount: number): string {
  const [year, month, day] = key.split('-').map(Number);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return '';
  }

  const value = new Date(Date.UTC(year, month - 1, day));
  value.setUTCDate(value.getUTCDate() + amount);

  return [
    String(value.getUTCFullYear()).padStart(4, '0'),
    String(value.getUTCMonth() + 1).padStart(2, '0'),
    String(value.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

async function readFocusRows(userId: string): Promise<FocusSessionRow[]> {
  if (!userId.trim()) {
    return [];
  }

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('minutes,created_at,task_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((row) => ({
    minutes: row?.minutes == null ? null : Number(row.minutes),
    created_at: row?.created_at == null ? null : String(row.created_at),
    task_id: row?.task_id == null ? null : String(row.task_id),
  }));
}

export async function saveFocusSession(
  userId: string,
  input: FocusSessionInput,
): Promise<void> {
  if (!userId.trim()) {
    throw new Error('User ID tidak valid.');
  }

  const minutes = normalizeMinutes(input.minutes);

  if (minutes <= 0) {
    throw new Error('Durasi Focus harus lebih dari 0 menit.');
  }

  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    throw new Error('Waktu sesi Focus tidak valid.');
  }

  if (endedAt.getTime() < startedAt.getTime()) {
    throw new Error('Waktu selesai tidak boleh sebelum waktu mulai.');
  }

  const { error } = await supabase.from('focus_sessions').insert({
    user_id: userId,
    task_id: input.taskId?.trim() || null,
    minutes,
    started_at: startedAt.toISOString(),
    ended_at: endedAt.toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function loadFocusStats(userId: string): Promise<FocusStats> {
  if (!userId.trim()) {
    return EMPTY_STATS;
  }

  const rows = await readFocusRows(userId);

  const totalMinutes = rows.reduce(
    (total, row) => total + normalizeMinutes(row.minutes),
    0,
  );

  return {
    totalMinutes,
    sessions: rows.length,
    recent: rows.slice(0, 10),
  };
}

export async function loadFocusStreak(userId: string): Promise<FocusStreak> {
  if (!userId.trim()) {
    return EMPTY_STREAK;
  }

  const rows = await readFocusRows(userId);
  const minutesByDay = new Map<string, number>();

  for (const row of rows) {
    if (!row.created_at) {
      continue;
    }

    const key = dateKey(row.created_at);

    if (!key) {
      continue;
    }

    minutesByDay.set(
      key,
      (minutesByDay.get(key) ?? 0) + normalizeMinutes(row.minutes),
    );
  }

  const activeDates = Array.from(minutesByDay.keys()).sort();
  const totalMinutes = rows.reduce(
    (total, row) => total + normalizeMinutes(row.minutes),
    0,
  );
  const today = dateKey(new Date());
  const todayMinutes = minutesByDay.get(today) ?? 0;
  const lastActiveDate = activeDates.at(-1) ?? null;

  let longestStreak = 0;
  let chain = 0;
  let previous: string | null = null;

  for (const current of activeDates) {
    if (previous && shiftDate(previous, 1) === current) {
      chain += 1;
    } else {
      chain = 1;
    }

    longestStreak = Math.max(longestStreak, chain);
    previous = current;
  }

  const streakStart = minutesByDay.has(today) ? today : shiftDate(today, -1);
  let currentStreak = 0;

  if (streakStart && minutesByDay.has(streakStart)) {
    currentStreak = 1;
    let cursor = streakStart;

    while (true) {
      const previousDate = shiftDate(cursor, -1);

      if (!previousDate || !minutesByDay.has(previousDate)) {
        break;
      }

      currentStreak += 1;
      cursor = previousDate;
    }
  }

  return {
    currentStreak,
    longestStreak,
    todayMinutes,
    activeDays: activeDates.length,
    totalMinutes,
    sessions: rows.length,
    lastActiveDate,
  };
}
