import mazetSchedule from '../data/mazetSchedule.json';
import type { ScheduleItem, Subject } from '../types';
import type { WorkspaceId } from '../context/WorkspaceContext';
import { loadSchedule } from './scheduleService';
import { loadSubjectsWithScheduleFallback } from './subjectService';

type MazetRow = { waktu?: string; mata_kuliah?: string; dosen?: string; ruang?: string };
const DAY_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

function normalizeTime(value: string, part: 0 | 1) {
  const token = value.split('-')[part]?.trim() ?? '';
  return token.replace('.', ':').padStart(5, '0');
}

function mapMazetSchedule(): ScheduleItem[] {
  const output: ScheduleItem[] = [];
  for (const day of DAY_ORDER) {
    const rows = (mazetSchedule as Record<string, MazetRow[]>)[day] ?? [];
    rows.forEach((row, index) => {
      if (!row.waktu || !row.mata_kuliah) return;
      const [start, end] = row.waktu.split('-');
      if (!start || !end) return;
      output.push({
        id: `mazet-${day.toLowerCase()}-${index}`,
        day,
        startTime: normalizeTime(`${start}-${end}`, 0),
        endTime: normalizeTime(`${start}-${end}`, 1),
        subject: row.mata_kuliah,
        teacher: row.dosen,
        type: 'subject',
        active: true,
        location: row.ruang,
      });
    });
  }
  return output;
}

export async function loadWorkspaceSchedule(workspaceId: WorkspaceId): Promise<ScheduleItem[]> {
  return workspaceId === 'mazet' ? mapMazetSchedule() : loadSchedule();
}

export async function loadWorkspaceSubjects(workspaceId: WorkspaceId): Promise<Subject[]> {
  if (workspaceId === 'mazet') {
    const byName = new Map<string, Subject>();
    for (const row of mapMazetSchedule()) {
      const key = row.subject.trim().toLocaleLowerCase('id-ID');
      if (!key || byName.has(key)) continue;
      byName.set(key, {
        id: `mazet:${encodeURIComponent(row.subject)}`,
        name: row.subject,
        teacher: row.teacher,
        active: true,
      });
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'id-ID'));
  }
  return loadSubjectsWithScheduleFallback();
}

function dayIndex(day: ScheduleItem['day']) {
  return DAY_ORDER.indexOf(day);
}

function dateKeyInJakarta(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(date);
}

function jakartaWeekdayIndex(date: Date) {
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(date);
  const map: Record<string, number> = {
    Sunday: 6,
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
  };
  return map[day] ?? 0;
}

export function findNextScheduledDeadline(now: Date, schedule: ScheduleItem[], subjectName: string) {
  const target = subjectName.trim().toLocaleLowerCase('id-ID');
  if (!target) return null;
  const matches = schedule.filter(
    (item) => item.active && item.type === 'subject' && item.subject.trim().toLocaleLowerCase('id-ID') === target,
  );
  if (!matches.length) return null;

  const todayIndex = jakartaWeekdayIndex(now);
  const currentDateKey = dateKeyInJakarta(now);
  const jakartaTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  const currentMinutes = Number(jakartaTime.slice(0, 2)) * 60 + Number(jakartaTime.slice(3, 5));

  let best: { date: Date; item: ScheduleItem } | null = null;
  for (let offset = 0; offset <= 14; offset += 1) {
    const targetIndex = (todayIndex + offset) % 7;
    const dayItems = matches.filter((item) => dayIndex(item.day) === targetIndex).sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (const item of dayItems) {
      const itemMinutes = Number(item.startTime.slice(0, 2)) * 60 + Number(item.startTime.slice(3, 5));
      if (offset === 0 && itemMinutes <= currentMinutes) continue;
      const base = new Date(`${currentDateKey}T00:00:00+07:00`);
      base.setDate(base.getDate() + offset);
      best = { date: base, item };
      break;
    }
    if (best) break;
  }
  if (!best) return null;

  const dueDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(best.date);

  // Smart deadline follows the related class session instead of
  // falling back to 23:59. Keep a small preparation buffer so the
  // task is due shortly before the lesson begins.
  const startMinutes =
    Number(best.item.startTime.slice(0, 2)) * 60 +
    Number(best.item.startTime.slice(3, 5));

  const deadlineMinutes = Math.max(0, startMinutes - 5);
  const dueHour = Math.floor(deadlineMinutes / 60);
  const dueMinute = deadlineMinutes % 60;

  return {
    dueDate,
    dueTime: `${String(dueHour).padStart(2, '0')}:${String(dueMinute).padStart(2, '0')}`,
    scheduleItem: best.item,
  };
}
