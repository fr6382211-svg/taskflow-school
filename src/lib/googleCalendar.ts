const GOOGLE_CALENDAR_API_KEY = ((import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY as string | undefined) || 'AIzaSyBVN13GvRSkHcPI-F2jFkigBkQ5lv-md-M').trim();
const DEFAULT_HOLIDAY_CALENDAR_ID = 'en.indonesian#holiday@group.v.calendar.google.com';
export const GOOGLE_HOLIDAY_CALENDAR_ID = ((import.meta.env.VITE_GOOGLE_HOLIDAY_CALENDAR_ID as string | undefined) || DEFAULT_HOLIDAY_CALENDAR_ID).trim();

export interface GoogleHolidayEvent {
  id: string;
  summary: string;
  description?: string;
  date: string;
  endDate: string;
  htmlLink?: string;
}

interface GoogleEventListResponse {
  items?: Array<{
    id?: string;
    summary?: string;
    description?: string;
    htmlLink?: string;
    start?: { date?: string; dateTime?: string };
    end?: { date?: string; dateTime?: string };
  }>;
}

function toDateOnly(value?: string) {
  if (!value) return '';
  return value.includes('T') ? value.slice(0, 10) : value;
}

export async function fetchIndonesianHolidays(from: Date, to: Date): Promise<GoogleHolidayEvent[]> {
  if (!GOOGLE_CALENDAR_API_KEY) return [];
  const timeMin = new Date(from);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(to);
  timeMax.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    key: GOOGLE_CALENDAR_API_KEY,
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: '2500',
  });
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(GOOGLE_HOLIDAY_CALENDAR_ID)}/events?${params.toString()}`);
  if (!response.ok) throw new Error(`Google Calendar request failed: ${response.status}`);
  const json = await response.json() as GoogleEventListResponse;
  return (json.items || [])
    .map((event) => ({
      id: event.id || crypto.randomUUID(),
      summary: event.summary || 'Hari Libur',
      description: event.description,
      date: toDateOnly(event.start?.date || event.start?.dateTime),
      endDate: toDateOnly(event.end?.date || event.end?.dateTime || event.start?.date || event.start?.dateTime),
      htmlLink: event.htmlLink,
    }))
    .filter((event) => event.date);
}

export function holidayMap(events: GoogleHolidayEvent[]) {
  const map = new Map<string, GoogleHolidayEvent[]>();
  const add = (key: string, event: GoogleHolidayEvent) => {
    const list = map.get(key) || [];
    list.push(event);
    map.set(key, list);
  };
  events.forEach((event) => {
    const [sy, sm, sd] = event.date.split('-').map(Number);
    const [ey, em, ed] = (event.endDate || event.date).split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    // Google all-day event end date is exclusive.
    for (const cursor = new Date(start); cursor < end; cursor.setDate(cursor.getDate() + 1)) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      add(key, event);
    }
    if (event.date === event.endDate || !event.endDate) add(event.date, event);
  });
  return map;
}
