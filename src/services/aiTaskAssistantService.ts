import type { ScheduleItem, Subject } from '../types';

export type AITaskDraft = {
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  teacherName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  dueTime: string;
  deadlineMode: 'auto' | 'manual';
  confidence: number;
  notes: string;
};

function jakartaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

function addDays(dateKey: string, amount: number) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const value = new Date(Date.UTC(y, m - 1, d));
  value.setUTCDate(value.getUTCDate() + amount);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
  }).format(value);
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function parseRelativeDate(text: string, now = new Date()): string | null {
  const lower = text.toLocaleLowerCase('id-ID');
  const today = jakartaDateKey(now);

  if (lower.includes('hari ini')) return today;
  if (lower.includes('besok')) return addDays(today, 1);
  if (lower.includes('lusa')) return addDays(today, 2);

  const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const currentDay = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  }).format(now).toLocaleLowerCase('id-ID');

  for (const target of days) {
    if (!lower.includes(target)) continue;
    const currentIndex = days.indexOf(currentDay);
    const targetIndex = days.indexOf(target);
    let delta = targetIndex - currentIndex;
    if (delta <= 0) delta += 7;
    return addDays(today, delta);
  }

  return null;
}

function parseTime(text: string): string | null {
  const match = text.match(/\b([01]?\d|2[0-3])(?:[.:]([0-5]\d))\b/);
  if (!match) return null;
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function cleanTitle(text: string) {
  const normalized = text
    .replace(/\b(dikumpulkan|dikumpul|deadline|besok|hari ini|lusa)\b/gi, '')
    .replace(/\b(jam|pukul)\s*\d{1,2}(?:[.:]\d{2})?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized.length >= 6) {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  return 'Tugas baru';
}

function normalizeSubjectName(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('id-ID');
}

function resolveSubject(
  text: string,
  subjects: Subject[],
  schedule: ScheduleItem[],
) {
  const lower = text.toLocaleLowerCase('id-ID');

  const candidates = [
    ...subjects.map((subject) => ({
      subjectId: subject.id,
      subjectName: subject.name,
      teacherName: subject.teacher ?? '',
    })),
    ...schedule
      .filter((item) => item.type === 'subject')
      .map((item) => ({
        subjectId: `schedule:${item.subject}`,
        subjectName: item.subject,
        teacherName: item.teacher ?? '',
      })),
  ];

  const unique = new Map<string, typeof candidates[number]>();
  for (const item of candidates) {
    unique.set(normalizeSubjectName(item.subjectName), item);
  }

  const matches = [...unique.values()]
    .filter((candidate) => {
      const name = normalizeSubjectName(candidate.subjectName);
      return lower.includes(name) || name.split(' ').some((part) => part.length >= 4 && lower.includes(part));
    })
    .sort((a, b) => b.subjectName.length - a.subjectName.length);

  return matches[0] ?? null;
}

function findSessionDeadline(
  subjectName: string,
  dueDate: string | null,
  schedule: ScheduleItem[],
) {
  if (!subjectName || !dueDate) return null;

  const lower = normalizeSubjectName(subjectName);
  const weekday = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  }).format(new Date(`${dueDate}T12:00:00+07:00`));

  const relevant = schedule
    .filter(
      (item) =>
        item.active &&
        item.type === 'subject' &&
        item.day.toLocaleLowerCase('id-ID') === weekday.toLocaleLowerCase('id-ID') &&
        normalizeSubjectName(item.subject) === lower,
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (!relevant.length) return null;

  const [h, m] = relevant[0].startTime.split(':').map(Number);
  const total = Math.max(0, h * 60 + m - 5);

  return {
    dueDate,
    dueTime: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`,
    session: relevant[0],
  };
}

export function analyzeTaskWithAssistant(
  input: string,
  subjects: Subject[],
  schedule: ScheduleItem[],
): AITaskDraft {
  const text = input.trim();
  const lower = text.toLocaleLowerCase('id-ID');

  const subject = resolveSubject(text, subjects, schedule);
  const explicitDate = parseRelativeDate(text);
  const explicitTime = parseTime(text);

  const priority =
    containsAny(lower, ['urgent', 'segera', 'penting sekali'])
      ? 'urgent'
      : containsAny(lower, ['penting', 'utama', 'prioritas tinggi'])
        ? 'high'
        : containsAny(lower, ['santai', 'tidak mendesak'])
          ? 'low'
          : 'medium';

  const deadlineSession = findSessionDeadline(
    subject?.subjectName ?? '',
    explicitDate,
    schedule,
  );

  const dueDate = explicitDate ?? '';
  const dueTime = explicitTime ?? deadlineSession?.dueTime ?? '';

  const confidence =
    (subject ? 0.35 : 0) +
    (explicitDate ? 0.25 : 0) +
    (dueTime ? 0.2 : 0) +
    (text.length >= 15 ? 0.2 : 0);

  return {
    title: cleanTitle(text),
    description: text,
    subjectId: subject?.subjectId ?? '',
    subjectName: subject?.subjectName ?? '',
    teacherName: subject?.teacherName ?? '',
    priority,
    dueDate,
    dueTime,
    deadlineMode: dueDate && dueTime ? 'manual' : 'auto',
    confidence: Math.min(1, confidence),
    notes: 'Draft dibuat oleh AI Task Assistant. Tinjau sebelum menyimpan.',
  };
}
