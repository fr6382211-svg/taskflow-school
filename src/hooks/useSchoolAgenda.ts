import { useMemo } from 'react';
import {
  dateKey,
  getNextSchoolAgenda,
  getSchoolDayName,
  nextSchoolDay,
  isSchoolDay,
  jakartaWeekday,
  type CalendarDay,
} from '../lib/schoolCalendar';
import type { WorkspaceId } from '../context/WorkspaceContext';
import type { GoogleHolidayEvent } from '../lib/googleCalendar';
import type { ScheduleItem, Task } from '../types';

const DAY_ORDER: CalendarDay[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
];

type Agenda = {
  key: string;
  daysFromToday: number;
  dayName: CalendarDay;
};

export type SchoolAgendaResult = {
  agenda: Agenda | null;
  activeKey: string;
  activeDay: CalendarDay | null;
  agendaTasks: Task[];
  agendaSchedule: ScheduleItem[];
};

function jakartaMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now).split(':').map(Number);

  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function parseTime(value: string): number {
  const normalized = value.trim().replace('.', ':');
  const [hours, minutes] = normalized.split(':').map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
}

function addDaysToKey(key: string, days: number): string {
  const [year, month, day] = key.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return key;

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function nextScheduledDay(
  now: Date,
  schedule: ScheduleItem[],
  holidays: Map<string, GoogleHolidayEvent[]>,
  workspaceId: WorkspaceId,
): Agenda | null {
  const todayKey = dateKey(now);
  const todayDay = jakartaWeekday(now);
  const todayIndex = DAY_ORDER.indexOf(todayDay);
  const currentMinutes = jakartaMinutes(now);

  for (let offset = 0; offset < DAY_ORDER.length; offset += 1) {
    const candidateDay = DAY_ORDER[(todayIndex + offset) % DAY_ORDER.length];
    const candidateKey = addDaysToKey(todayKey, offset);

    if (workspaceId === 'fathur' && !isSchoolDay(candidateKey, holidays)) {
      continue;
    }

    const items = schedule
      .filter(
        (item) =>
          item.active &&
          item.type === 'subject' &&
          item.day === candidateDay,
      )
      .slice()
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    if (!items.length) continue;

    if (offset === 0) {
      const hasRunningOrUpcoming = items.some((item) =>
        parseTime(item.endTime) > currentMinutes,
      );

      if (!hasRunningOrUpcoming) continue;
    }

    return {
      key: candidateKey,
      daysFromToday: offset,
      dayName: candidateDay,
    };
  }

  return null;
}

function selectAgenda(
  now: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
  tasks: Task[],
  schedule: ScheduleItem[],
  workspaceId: WorkspaceId,
): Agenda | null {
  if (workspaceId === 'mazet') {
    return nextScheduledDay(
      now,
      schedule,
      holidays,
      workspaceId,
    );
  }

  const todayKey = dateKey(now);
  const todayDay = getSchoolDayName(todayKey);

  if (todayDay && isSchoolDay(todayKey, holidays)) {
    const currentMinutes = jakartaMinutes(now);
    const todayItems = schedule
      .filter(
        (item) =>
          item.active &&
          item.type === 'subject' &&
          item.day === todayDay,
      )
      .slice()
      .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));

    const todayHasRemainingLesson = todayItems.some(
      (item) => parseTime(item.endTime) > currentMinutes,
    );

    if (todayHasRemainingLesson) {
      return {
        key: todayKey,
        daysFromToday: 0,
        dayName: todayDay,
      };
    }
  }

  const base = getNextSchoolAgenda(now, holidays);

  if (base?.dayName) {
    return {
      key: base.key,
      daysFromToday: base.daysFromToday,
      dayName: base.dayName,
    };
  }

  const next = nextSchoolDay(now, holidays, false);
  return next?.dayName
    ? {
        key: next.key,
        daysFromToday: next.daysFromToday,
        dayName: next.dayName,
      }
    : null;
}

export function useSchoolAgenda(
  now: Date,
  holidays: Map<string, GoogleHolidayEvent[]>,
  tasks: Task[] = [],
  schedule: ScheduleItem[] = [],
  workspaceId: WorkspaceId = 'fathur',
): SchoolAgendaResult {
  return useMemo(() => {
    const agenda = selectAgenda(
      now,
      holidays,
      tasks,
      schedule,
      workspaceId,
    );

    const activeKey = agenda?.key ?? dateKey(now);
    const activeDay = agenda?.dayName ?? getSchoolDayName(activeKey);

    const agendaTasks = tasks
      .filter(
        (task) =>
          task.status !== 'completed' &&
          task.dueDate === activeKey,
      )
      .slice()
      .sort((a, b) =>
        `${a.dueDate}T${a.dueTime || '23:59'}`.localeCompare(
          `${b.dueDate}T${b.dueTime || '23:59'}`,
        ),
      )
      .slice(0, 8);

    const agendaSchedule = activeDay
      ? schedule
          .filter(
            (item) =>
              item.active &&
              item.day === activeDay,
          )
          .slice()
          .sort(
            (a, b) =>
              parseTime(a.startTime) -
              parseTime(b.startTime),
          )
      : [];

    return {
      agenda,
      activeKey,
      activeDay,
      agendaTasks,
      agendaSchedule,
    };
  }, [now, holidays, tasks, schedule, workspaceId]);
}
