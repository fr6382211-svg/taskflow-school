import { useEffect, useState } from 'react';
import { Clock3, RefreshCw, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { errorMessage, formatDateTime } from '../../lib/utils';

type Session = {
  id: string;
  user_id: string;
  task_id: string | null;
  minutes: number;
  started_at: string;
  ended_at: string;
};

export default function AdminFocusSessions() {
  const [rows, setRows] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('focus_sessions')
      .select('id,user_id,task_id,minutes,started_at,ended_at')
      .order('started_at', { ascending: false })
      .limit(500);
    if (queryError) {
      setError(errorMessage(queryError));
      setRows([]);
    } else {
      setRows((data ?? []) as Session[]);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Hapus focus session ini?')) return;
    const { error: removeError } = await supabase.from('focus_sessions').delete().eq('id', id);
    if (removeError) {
      setError(errorMessage(removeError));
      return;
    }
    setRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <AdminHeader title="Focus Sessions" description="Kelola sesi fokus pengguna dari satu tempat." />
        <Button variant="outline" onClick={() => void load()} loading={loading} icon={<RefreshCw size={15} />}>Refresh</Button>
      </div>
      {error && <Card className="border-rose-200 p-4 text-sm font-semibold text-rose-700">{error}</Card>}
      <Card className="overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading && <div className="p-8 text-center text-sm text-slate-500">Loading…</div>}
          {!loading && rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-300"><Clock3 size={18} /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold">{row.minutes} menit • User {row.user_id}</div>
                <div className="mt-1 text-xs text-slate-500">Mulai {formatDateTime(row.started_at)} • Selesai {formatDateTime(row.ended_at)}</div>
                {row.task_id && <div className="mt-1 text-[11px] text-slate-400">Task: {row.task_id}</div>}
              </div>
              <Button variant="danger" size="sm" onClick={() => void remove(row.id)} icon={<Trash2 size={14} />}>Hapus</Button>
            </div>
          ))}
          {!loading && rows.length === 0 && <div className="p-10 text-center text-sm text-slate-500">Belum ada focus session.</div>}
        </div>
      </Card>
    </div>
  );
}
