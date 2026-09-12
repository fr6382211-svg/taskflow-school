import { ArrowLeft, CalendarDays, FileDown, Printer } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useWorkspace } from '../context/WorkspaceContext';
import { formatDate } from '../lib/utils';

function priorityLabel(value: string) {
  const map: Record<string, string> = {
    urgent: 'Sangat penting',
    high: 'Tinggi',
    medium: 'Sedang',
    low: 'Rendah',
  };
  return map[value.toLowerCase()] ?? value;
}

export default function TaskSummaryPdf() {
  const { workspace } = useWorkspace();
  const { tasks, loading } = useTasks();

  const sorted = useMemo(() => [...tasks].sort((a, b) => {
    const da = new Date(`${a.dueDate}T${a.dueTime || '23:59'}`).getTime();
    const db = new Date(`${b.dueDate}T${b.dueTime || '23:59'}`).getTime();
    return da - db;
  }), [tasks]);

  const activeCount = sorted.filter((task) => task.status !== 'completed').length;
  const completedCount = sorted.filter((task) => task.status === 'completed').length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 py-4 print:max-w-none print:py-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link to="/tasks" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
          <ArrowLeft size={16} /> Kembali ke Tugas
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-slate-200 bg-slate-950 p-6 text-white print:bg-white print:text-black print:p-0 print:pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300 print:text-slate-500">Fathur School Hub</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight">Ringkasan Semua Tugas</h1>
              <p className="mt-2 text-sm text-slate-300 print:text-slate-600">{workspace.schoolLabel} • {workspace.eyebrow}</p>
            </div>
            <FileDown className="no-print text-sky-300" size={28} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 print:text-black">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 print:border-slate-200 print:bg-white">
              <div className="text-xs text-slate-400 print:text-slate-500">Total</div>
              <div className="mt-1 text-xl font-black">{sorted.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 print:border-slate-200 print:bg-white">
              <div className="text-xs text-slate-400 print:text-slate-500">Aktif</div>
              <div className="mt-1 text-xl font-black">{activeCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3 print:border-slate-200 print:bg-white">
              <div className="text-xs text-slate-400 print:text-slate-500">Selesai</div>
              <div className="mt-1 text-xl font-black">{completedCount}</div>
            </div>
          </div>
        </header>

        <section className="p-6 print:p-0 print:pt-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-500">Menyiapkan ringkasan…</div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="text-base font-black">Belum ada tugas</div>
              <div className="mt-1 text-sm text-slate-500">Ringkasan ini akan otomatis terisi ketika tugas tersedia.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((task, index) => (
                <section key={task.id} className="break-inside-avoid rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">#{String(index + 1).padStart(2, '0')} • {task.subjectName || 'Tanpa mapel'}</div>
                      <h2 className="mt-1 text-base font-black text-slate-900">{task.title}</h2>
                      {task.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>}
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <div className="font-black text-slate-800">{formatDate(task.dueDate)}</div>
                      <div className="mt-1">{task.dueTime || '23:59'}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">Status: {task.status}</span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 font-bold text-sky-700">Prioritas: {priorityLabel(task.priority)}</span>
                    {task.teacherName && <span className="rounded-full bg-violet-50 px-2.5 py-1 font-bold text-violet-700">{task.teacherName}</span>}
                    {task.fileName && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">Lampiran: {task.fileName}</span>}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 px-6 py-4 text-xs text-slate-400 print:px-0">
          <div className="flex items-center gap-2"><CalendarDays size={13} /> Dibuat dari data tugas workspace saat dokumen dibuka • Waktu Indonesia Barat (WIB)</div>
        </footer>
      </article>
    </div>
  );
}
