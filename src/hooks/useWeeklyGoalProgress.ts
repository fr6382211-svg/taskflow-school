import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { countTasksCompletedThisWeek, loadWeeklyGoalProgress, type WeeklyGoalProgress } from '../services/goalService';
import type { Task } from '../types';

export function useWeeklyGoalProgress(tasks: Task[]) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WeeklyGoalProgress | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setProgress(null);
      return;
    }
    setLoading(true);
    try {
      const completed = countTasksCompletedThisWeek(tasks);
      setProgress(await loadWeeklyGoalProgress(user.id, completed));
    } catch (error) {
      console.error('Weekly goal progress failed:', error);
    } finally {
      setLoading(false);
    }
  }, [tasks, user?.id]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { progress, loading, refresh };
}
