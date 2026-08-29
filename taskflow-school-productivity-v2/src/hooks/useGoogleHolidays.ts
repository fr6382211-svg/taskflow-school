import { useEffect, useMemo, useState } from 'react';
import { fetchIndonesianHolidays, holidayMap, type GoogleHolidayEvent } from '../lib/googleCalendar';

export function useGoogleHolidays(referenceDate: Date = new Date()) {
  const [events, setEvents] = useState<GoogleHolidayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const year = referenceDate.getFullYear();
  useEffect(() => {
    let active = true;
    setLoading(true);
    const from = new Date(year - 1, 0, 1);
    const to = new Date(year + 1, 11, 31);
    void fetchIndonesianHolidays(from, to)
      .then((items) => { if (active) setEvents(items); })
      .catch((e) => { if (active) setError(e); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [year]);
  const byDate = useMemo(() => holidayMap(events), [events]);
  return { events, byDate, loading, error };
}
