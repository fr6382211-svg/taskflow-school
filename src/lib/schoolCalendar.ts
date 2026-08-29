import type { GoogleHolidayEvent } from './googleCalendar';

export function dateKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

export function getIndonesiaWeekday(dateKeyValue: string) {
  const date = new Date(`${dateKeyValue}T12:00:00+07:00`);
  return date.getDay();
}

export function isWeekend(dateKeyValue: string) {
  const day = getIndonesiaWeekday(dateKeyValue);
  return day === 0 || day === 6;
}

export function isHoliday(dateKeyValue: string, holidayMap: Map<string, GoogleHolidayEvent[]>) {
  return (holidayMap.get(dateKeyValue)?.length || 0) > 0;
}

export function nextSchoolDay(from: Date, holidays: Map<string, GoogleHolidayEvent[]>) {
  const cursor = new Date(from);
  cursor.setHours(12, 0, 0, 0);
  for (let i = 0; i < 370; i += 1) {
    const key = dateKey(cursor);
    if (!isWeekend(key) && !isHoliday(key, holidays)) return { date: new Date(cursor), key, daysFromToday: i };
    cursor.setDate(cursor.getDate() + 1);
  }
  return null;
}

export function countdownToSchoolDay(from: Date, holidays: Map<string, GoogleHolidayEvent[]>) {
  const school = nextSchoolDay(from, holidays);
  if (!school) return { label: 'Jadwal sekolah belum tersedia', days: null as number | null };
  if (school.daysFromToday === 0) return { label: 'Masuk sekolah H-0 • hari ini', days: 0 };
  return { label: `Masuk sekolah H-${school.daysFromToday}`, days: school.daysFromToday };
}
