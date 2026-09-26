import { useEffect, useMemo, useState } from 'react';
import { subscribeSchedule } from '../services/scheduleService';
import { loadWorkspaceSchedule } from '../services/workspaceService';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ScheduleItem } from '../types';
import { dateKey, jakartaWeekday, type SchoolDay } from '../lib/schoolCalendar';

export function useSchedule() {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    if (workspaceId === 'mazet') {
      void loadWorkspaceSchedule('mazet')
        .then((nextItems) => { if (alive) { setItems(nextItems); setLoading(false); } })
        .catch((nextError) => { if (alive) { setError(nextError); setLoading(false); } });
      return () => { alive = false; };
    }

    const unsubscribe = subscribeSchedule(
      (nextItems) => { setItems(nextItems); setLoading(false); setError(null); },
      (nextError) => { setError(nextError); setLoading(false); },
    );
    return () => { alive = false; unsubscribe(); };
  }, [workspaceId]);

  return { items, loading, error };
}

function minutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}

export function useScheduleHelpers(
  items: ScheduleItem[],
) {
  const [nowTimestamp, setNowTimestamp] = useState(
    () => Date.now(),
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setNowTimestamp(Date.now()),
      30_000,
    );

    return () => window.clearInterval(id);
  }, []);

  const now = new Date(nowTimestamp);
  const jakartaDay = jakartaWeekday(now);
  const todayName: SchoolDay | null =
    jakartaDay === 'Sabtu' || jakartaDay === 'Minggu'
      ? null
      : jakartaDay;

  const today = useMemo(
    () =>
      todayName
        ? items
            .filter(
              (item) =>
                item.active &&
                item.day === todayName,
            )
            .sort((a, b) =>
              a.startTime.localeCompare(
                b.startTime,
              ),
            )
        : [],
    [items, todayName],
  );

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(now)
    .split(':')
    .map(Number);

  const totalCurrentMinutes =
    (parts[0] ?? 0) * 60 + (parts[1] ?? 0);

  const current = useMemo(
    () =>
      today.find((item) => {
        const start = minutes(item.startTime);
        const end = minutes(item.endTime);
        return (
          item.type === 'subject' &&
          totalCurrentMinutes >= start &&
          totalCurrentMinutes < end
        );
      }) ?? null,
    [today, totalCurrentMinutes],
  );

  const next = useMemo(
    () =>
      today.find(
        (item) =>
          minutes(item.startTime) >
          totalCurrentMinutes,
      ) ?? null,
    [today, totalCurrentMinutes],
  );

  return {
    todayName,
    today,
    current,
    next,
    now,
    nowKey: dateKey(now),
    currentMinutes: totalCurrentMinutes,
  };
}
