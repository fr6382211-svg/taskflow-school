import { CalendarClock, ChevronRight, FileText, PlayCircle, CheckCircle2, Tag, CircleAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../../types';
import { formatDate, relativeDeadline, errorMessage } from '../../lib/utils';
import { PriorityBadge, StatusBadge } from '../ui/StatusBadge';
import Card from '../ui/Card';
import { updateTask } from '../../services/taskService';
import { useState } from 'react';
import { useToast } from '../ui/Toast';

export default function TaskCard({ task }: { task: Task }) {
  const nav = useNavigate();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function quickStatus(e: React.MouseEvent, status: Task['status']) {
    e.stopPropagation();
    setBusy(true);
    try {
      await updateTask(task.id, {
        status,
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      });
      push({
        tone: 'success',
        title: status === 'completed' ? 'Tugas selesai' : 'Tugas dimulai',
        message: 'Status tersinkron ke Supabase.',
      });
    } catch (error) {
      push({ tone: 'error', title: 'Status gagal diubah', message: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  const isLate = relativeDeadline(task) === 'Terlambat';
  const hasTags = Boolean(task.tags?.length);

  return (
    <Card className="group p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">{task.subjectName || 'Mata Pelajaran'}</span>
            <PriorityBadge priority={task.priority} />
            {hasTags && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300"><Tag size={10}/>{task.tags?.length}</span>}
          </div>
          <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{task.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{task.description || 'Tidak ada deskripsi.'}</p>
        </div>
        <button onClick={() => nav(`/tasks/${task.id}`)} aria-label={`Lihat ${task.title}`} className="focus-ring rounded-xl p-2 text-slate-400 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-950/30"><ChevronRight size={18}/></button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5"><CalendarClock size={14}/>{formatDate(task.dueDate)} • {task.dueTime}</span>
        <span className={isLate ? 'inline-flex items-center gap-1 text-rose-600' : 'text-slate-500'}>{isLate && <CircleAlert size={13}/>} {relativeDeadline(task)}</span>
        {task.fileName && <span className="inline-flex max-w-48 items-center gap-1.5 truncate"><FileText size={14}/>{task.fileName}</span>}
        <span className="ml-auto flex items-center gap-1">
          <StatusBadge status={task.status}/>
          {task.status !== 'completed' && task.status !== 'submitted' && (
            <button disabled={busy} onClick={(e) => void quickStatus(e, task.status === 'pending' ? 'in_progress' : 'completed')} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 dark:hover:bg-blue-950/30" aria-label={task.status === 'pending' ? 'Mulai tugas' : 'Selesaikan tugas'}>
              {task.status === 'pending' ? <PlayCircle size={15}/> : <CheckCircle2 size={15}/>} 
            </button>
          )}
        </span>
      </div>
    </Card>
  );
}
