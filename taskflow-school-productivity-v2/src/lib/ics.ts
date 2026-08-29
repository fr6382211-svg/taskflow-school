import type { ScheduleItem, Task } from '../types';

function stamp(date: string, time: string) {
  return `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;
}

function escape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function exportCalendarIcs(taskList: Task[], schedule: ScheduleItem[], monthDate = new Date()) {
  const y = monthDate.getFullYear();
  const m = String(monthDate.getMonth() + 1).padStart(2, '0');
  const last = new Date(y, monthDate.getMonth() + 1, 0).getDate();
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//TASKFLOW SCHOOL//ID', 'CALSCALE:GREGORIAN'];

  taskList.filter(t => t.dueDate.startsWith(`${y}-${m}`)).forEach(t => {
    lines.push('BEGIN:VEVENT', `UID:task-${t.id}@taskflow.school`, `DTSTART:${stamp(t.dueDate, t.dueTime)}`, `SUMMARY:${escape(t.title)}`, `DESCRIPTION:${escape(`${t.subjectName} • ${t.teacherName}`)}`, `STATUS:${t.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`, 'END:VEVENT');
  });

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  for (let d = 1; d <= last; d += 1) {
    const date = new Date(y, monthDate.getMonth(), d);
    const js = date.getDay();
    if (js < 1 || js > 5) continue;
    const dayName = days[js - 1];
    const dateKey = `${y}-${m}-${String(d).padStart(2, '0')}`;
    schedule.filter(s => s.day === dayName).forEach(s => lines.push('BEGIN:VEVENT', `UID:schedule-${s.id}-${dateKey}@taskflow.school`, `DTSTART:${stamp(dateKey, s.startTime)}`, `DTEND:${stamp(dateKey, s.endTime)}`, `SUMMARY:${escape(`Sekolah: ${s.subject}`)}`, `DESCRIPTION:${escape(s.teacher || s.type)}`, 'END:VEVENT'));
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `taskflow-${y}-${m}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
