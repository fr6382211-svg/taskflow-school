import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadFocusStreak, type FocusStreak } from '../services/focusService';

const EMPTY: FocusStreak = {
  currentStreak: 0,
  longestStreak: 0,
  todayMinutes: 0,
  activeDays: 0,
  totalMinutes: 0,
  sessions: 0,
  lastActiveDate: null,
};

export function useFocusStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<FocusStreak>(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setStreak(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const result = await loadFocusStreak(user.id);
      setStreak(result);
    } catch (error) {
      console.error('useFocusStreak load failed:', error);
      setStreak(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { streak, loading, refresh };
}
