import type { GoogleHolidayEvent } from './googleCalendar';

export const SCHOOL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'] as const;
export type SchoolDay = (typeof SCHOOL_DAYS)[number];
export type CalendarDay = SchoolDay | 'Sabtu' | 'Minggu';

const ENGLISH_TO_DAY: Record<string, CalendarDay> = {
  Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu', Thursday: 'Kamis',
  Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu',
};

export function dateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

export function jakartaParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    weekday: 'long',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
    weekday: ENGLISH_TO_DAY[get('weekday')] ?? 'Senin',
  } as const;
}

export function jakartaWeekday(date: Date): CalendarDay {
  return jakartaParts(date).weekday;
}

export function getIndonesiaWeekday(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function getSchoolDayName(key: string): SchoolDay | null {
  const weekday = getIndonesiaWeekday(key);
  if (weekday < 1 || weekday > 5) return null;
  return SCHOOL_DAYS[weekday - 1] ?? null;
}

export function isWeekend(key: string): boolean {
  const weekday = getIndonesiaWeekday(key);
  return weekday === 0 || weekday === 6;
}

export function isHoliday(key: string, holidayMap: Map<string, GoogleHolidayEvent[]>): boolean {
  return (holidayMap.get(key)?.length ?? 0) > 0;
}

export function isSchoolDay(key: string, holidays: Map<string, GoogleHolidayEvent[]>): boolean {
  return !isWeekend(key) && !isHoliday(key, holidays);
}

function addCalendarDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
}

export function nextSchoolDay(
  from: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
  includeToday = false,
) {
  const start = dateKey(from);
  for (let offset = includeToday ? 0 : 1; offset < 370; offset += 1) {
    const key = addCalendarDays(start, offset);
    if (isSchoolDay(key, holidays)) {
      return {
        key,
        date: new Date(`${key}T12:00:00+07:00`),
        daysFromToday: offset,
        dayName: getSchoolDayName(key),
      };
    }
  }
  return null;
}

export function shouldAdvanceToNextSchoolDay(
  now: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
): boolean {
  const parts = jakartaParts(now);
  const key = dateKey(now);
  if (!isSchoolDay(key, holidays)) return true;
  return parts.hour >= 16;
}

export function getNextSchoolAgenda(
  now: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
) {
  const todayKey = dateKey(now);
  if (isSchoolDay(todayKey, holidays) && !shouldAdvanceToNextSchoolDay(now, holidays)) {
    return {
      key: todayKey,
      date: new Date(`${todayKey}T12:00:00+07:00`),
      daysFromToday: 0,
      dayName: getSchoolDayName(todayKey),
    };
  }

  return nextSchoolDay(now, holidays, false);
}

export function countdownToSchoolDay(
  now: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
) {
  const key = dateKey(now);
  if (isSchoolDay(key, holidays)) {
    const parts = jakartaParts(now);
    if (parts.hour < 16) {
      return { label: 'Masuk sekolah H-0 • hari ini', days: 0 };
    }
  }

  const next = nextSchoolDay(now, holidays, false);
  if (!next) return { label: 'Jadwal sekolah belum tersedia', days: null as number | null };
  return { label: `Masuk sekolah H-${next.daysFromToday}`, days: next.daysFromToday };
}
