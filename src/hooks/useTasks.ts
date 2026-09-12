import { useEffect, useMemo, useState } from 'react';
import { subscribeAllTasks, subscribeUserTasks } from '../services/taskService';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { isOverdue } from '../lib/utils';
import type { Task } from '../types';

export function useTasks(admin = false) {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const onError = (e: unknown) => { setError(e); setLoading(false); };
    const unsubscribe = admin
      ? subscribeAllTasks(workspaceId, (next) => { setTasks(next); setLoading(false); }, onError)
      : subscribeUserTasks(user.id, workspaceId, (next) => { setTasks(next); setLoading(false); }, onError);
    return () => unsubscribe();
  }, [user?.id, admin, workspaceId]);

  const normalized = useMemo(
    () => tasks.map((task) => (isOverdue(task) && task.status !== 'overdue' ? { ...task, status: 'overdue' as const } : task)),
    [tasks],
  );
  return { tasks: normalized, loading, error };
}

export function useTaskStats(tasks: Task[]) {
  return useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    submitted: tasks.filter((t) => t.status === 'submitted').length,
    overdue: tasks.filter((t) => isOverdue(t)).length,
  }), [tasks]);
}
