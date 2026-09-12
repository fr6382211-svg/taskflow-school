import { useEffect, useMemo, useState } from 'react';
import { loadFathurTutoringSchedule, type TutoringScheduleItem } from '../services/tutoringScheduleService';
import { useWorkspace } from '../context/WorkspaceContext';
import { errorMessage } from '../lib/utils';

function jakartaDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(key: string, amount: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + amount);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function useFathurTutoringSchedule(now: Date) {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<TutoringScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'supabase' | 'bundled-json' | null>(null);

  useEffect(() => {
    let alive = true;
    if (workspaceId !== 'fathur') {
      setItems([]);
      setLoading(false);
      setError(null);
      setSource(null);
      return () => { alive = false; };
    }

    setLoading(true);
    setError(null);
    void loadFathurTutoringSchedule()
      .then((next) => {
        if (!alive) return;
        setItems(next);
        setSource(next[0]?.source ?? 'bundled-json');
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(errorMessage(err));
        setSource(null);
        setLoading(false);
      });

    return () => { alive = false; };
  }, [workspaceId]);

  const todayKey = useMemo(() => jakartaDateKey(now), [now]);
  const tomorrowKey = useMemo(() => addDays(todayKey, 1), [todayKey]);

  const today = useMemo(
    () => items.filter((item) => item.scheduleDate === todayKey),
    [items, todayKey],
  );

  const tomorrow = useMemo(
    () => items.filter((item) => item.scheduleDate === tomorrowKey),
    [items, tomorrowKey],
  );

  const next = useMemo(() => {
    const upcoming = items
      .filter((item) => item.scheduleDate >= todayKey)
      .sort((a, b) => {
        const dateCompare = a.scheduleDate.localeCompare(b.scheduleDate);
        if (dateCompare !== 0) return dateCompare;

        const timeToMinutes = (value: string) => {
          const match = value.replace('.', ':').match(/^(\d{1,2}):(\d{2})/);
          if (!match) return Number.POSITIVE_INFINITY;
          return Number(match[1]) * 60 + Number(match[2]);
        };

        return timeToMinutes(a.startTimeLabel) - timeToMinutes(b.startTimeLabel);
      });

    return upcoming[0] ?? null;
  }, [items, todayKey]);

  return { items, today, tomorrow, next, loading, error, source, todayKey, tomorrowKey };
}
