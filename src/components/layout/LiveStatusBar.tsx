import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock3, Sparkles } from 'lucide-react';
import { useSchedule, useScheduleHelpers } from '../../hooks/useSchedule';
import { useGoogleHolidays } from '../../hooks/useGoogleHolidays';
import { dateKey, jakartaParts, isWeekend } from '../../lib/schoolCalendar';

function minutesFromString(value: string) {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date);
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

export default function LiveStatusBar() {
  const { items } = useSchedule();
  const { current } = useScheduleHelpers(items);
  const { byDate: holidays } = useGoogleHolidays(new Date());
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const key = dateKey(now);
  const parts = jakartaParts(now);
  const holiday = holidays.get(key)?.[0];
  const weekend = isWeekend(key);

  const progress = useMemo(() => {
    if (!current || weekend || holiday) {
      return ((parts.minute + parts.second / 60) / 60) * 100;
    }
    const currentMinutes = parts.hour * 60 + parts.minute + parts.second / 60;
    const start = minutesFromString(current.startTime);
    const end = minutesFromString(current.endTime);
    if (currentMinutes < start || currentMinutes >= end) return 0;
    return Math.min(100, Math.max(0, ((currentMinutes - start) / Math.max(end - start, 1)) * 100));
  }, [current, parts.hour, parts.minute, parts.second, weekend, holiday]);

  const label = weekend
    ? 'Hari libur • akhir pekan'
    : holiday
      ? `Hari libur • ${holiday.summary}`
      : current
        ? `${current.subject} • ${current.startTime}–${current.endTime}`
        : 'Tidak ada sesi aktif';

  return (
    <div className="live-statusbar" aria-label="Status waktu dan jadwal realtime">
      <div className="live-statusbar__info">
        <span className="live-statusbar__pulse" />
        <CalendarDays size={13} />
        <span className="hidden sm:inline">{formatDay(now)}</span>
        <span className="sm:hidden">{parts.weekday}</span>
        <span className="live-statusbar__divider" />
        <Clock3 size={13} />
        <span className="font-mono">{formatClock(now)}</span>
        <span className="hidden md:inline text-slate-400">• {label}</span>
        {current && !weekend && !holiday && (
          <span className="live-statusbar__active"><Sparkles size={12} /> LIVE</span>
        )}
      </div>
      <div className="live-statusbar__track" aria-hidden="true">
        <div className="live-statusbar__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
