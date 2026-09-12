import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, ListChecks, RefreshCw, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { errorMessage, formatDateTime } from '../../lib/utils';

type Subtask = { id: string; task_id: string; user_id: string; title: string; done: boolean; position: number; created_at: string };
type Comment = { id: string; task_id: string; user_id: string; user_name: string; body: string; created_at: string };

export default function AdminTaskWorkspace() {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [tab, setTab] = useState<'subtasks' | 'comments'>('subtasks');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    const [subtaskResult, commentResult] = await Promise.all([
      supabase.from('task_subtasks').select('id,task_id,user_id,title,done,position,created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('task_comments').select('id,task_id,user_id,user_name,body,created_at').order('created_at', { ascending: false }).limit(500),
    ]);
    if (subtaskResult.error || commentResult.error) {
      setError(errorMessage(subtaskResult.error ?? commentResult.error));
    }
    setSubtasks((subtaskResult.data ?? []) as Subtask[]);
    setComments((commentResult.data ?? []) as Comment[]);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const remove = async (table: 'task_subtasks' | 'task_comments', id: string) => {
    if (!window.confirm('Hapus item ini?')) return;
    const { error: removeError } = await supabase.from(table).delete().eq('id', id);
    if (removeError) { setError(errorMessage(removeError)); return; }
    if (table === 'task_subtasks') setSubtasks((rows) => rows.filter((r) => r.id !== id));
    else setComments((rows) => rows.filter((r) => r.id !== id));
  };

  const counts = useMemo(() => ({ subtasks: subtasks.length, comments: comments.length }), [subtasks, comments]);

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminHeader title="Task Workspace" description="Moderasi subtasks dan komentar tugas tanpa membuka database manual." />
        <Button variant="outline" onClick={() => void load()} loading={loading} icon={<RefreshCw size={15} />}>Refresh</Button>
      </div>
      {error && <Card className="border-rose-200 p-4 text-sm font-semibold text-rose-700">{error}</Card>}
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setTab('subtasks')} className={`rounded-2xl border p-4 text-left ${tab === 'subtasks' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800'}`}><ListChecks size={18}/><div className="mt-2 text-sm font-bold">Subtasks</div><div className="text-2xl font-black">{counts.subtasks}</div></button>
        <button type="button" onClick={() => setTab('comments')} className={`rounded-2xl border p-4 text-left ${tab === 'comments' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30' : 'border-slate-200 dark:border-slate-800'}`}><MessageSquare size={18}/><div className="mt-2 text-sm font-bold">Comments</div><div className="text-2xl font-black">{counts.comments}</div></button>
      </div>
      <Card className="overflow-hidden">
        {tab === 'subtasks' ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{subtasks.map((r) => <div key={r.id} className="flex gap-3 p-4"><div className="flex-1"><div className="text-sm font-bold">{r.title}</div><div className="mt-1 text-xs text-slate-500">Task {r.task_id} • User {r.user_id} • {r.done ? 'Selesai' : 'Belum selesai'}</div><div className="mt-1 text-[11px] text-slate-400">{formatDateTime(r.created_at)}</div></div><Button size="sm" variant="danger" onClick={() => void remove('task_subtasks', r.id)} icon={<Trash2 size={14}/>}>Hapus</Button></div>)}{subtasks.length===0&&<div className="p-10 text-center text-sm text-slate-500">Tidak ada subtask.</div>}</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">{comments.map((r) => <div key={r.id} className="flex gap-3 p-4"><div className="flex-1"><div className="text-sm font-bold">{r.user_name}</div><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{r.body}</p><div className="mt-1 text-[11px] text-slate-400">Task {r.task_id} • {formatDateTime(r.created_at)}</div></div><Button size="sm" variant="danger" onClick={() => void remove('task_comments', r.id)} icon={<Trash2 size={14}/>}>Hapus</Button></div>)}{comments.length===0&&<div className="p-10 text-center text-sm text-slate-500">Tidak ada komentar.</div>}</div>
        )}
      </Card>
    </div>
  );
}
