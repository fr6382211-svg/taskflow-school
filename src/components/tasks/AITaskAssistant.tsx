import { useMemo, useState } from 'react';
import { Bot, CheckCircle2, Sparkles, WandSparkles } from 'lucide-react';
import type { ScheduleItem, Subject } from '../../types';
import { analyzeTaskWithAssistant, type AITaskDraft } from '../../services/aiTaskAssistantService';

export default function AITaskAssistant({
  subjects,
  schedule,
  onApply,
}: {
  subjects: Subject[];
  schedule: ScheduleItem[];
  onApply: (draft: AITaskDraft) => void;
}) {
  const [input, setInput] = useState('');
  const [draft, setDraft] = useState<AITaskDraft | null>(null);
  const [open, setOpen] = useState(false);

  const confidenceLabel = useMemo(() => {
    if (!draft) return '';
    if (draft.confidence >= 0.85) return 'Sangat yakin';
    if (draft.confidence >= 0.65) return 'Cukup yakin';
    return 'Perlu ditinjau';
  }, [draft]);

  function analyze() {
    if (!input.trim()) return;
    setDraft(analyzeTaskWithAssistant(input, subjects, schedule));
  }

  function applyDraft() {
    if (!draft) return;
    onApply(draft);
    setOpen(false);
  }

  return (
    <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4 shadow-sm transition-all duration-300 hover:shadow-md dark:border-violet-900/50 dark:from-violet-950/30 dark:via-slate-950 dark:to-blue-950/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 transition-transform duration-300 group-hover:scale-105">
            <WandSparkles size={18} />
          </span>
          <span>
            <span className="block text-sm font-black text-violet-950 dark:text-violet-100">
              ✨ Tambah Tugas dengan AI
            </span>
            <span className="mt-1 block text-[11px] text-violet-700/70 dark:text-violet-200/70">
              Tulis tugas dengan bahasa biasa. AI membantu mengisi mapel, deadline, dan prioritas.
            </span>
          </span>
        </span>
        <Sparkles size={18} className="text-violet-400 transition-transform duration-300 group-hover:rotate-12" />
      </button>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <textarea
            className="input min-h-24 resize-y py-3"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Contoh: "Tugas matematika halaman 120-125 dikumpulkan besok sebelum pelajaran."'
          />

          <button
            type="button"
            onClick={analyze}
            disabled={!input.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Bot size={15} />
            Analisis tugas
          </button>

          {draft && (
            <div className="rounded-2xl border border-violet-200 bg-white p-4 shadow-sm dark:border-violet-900/50 dark:bg-slate-950 animate-slide-up">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-500">
                    AI Draft
                  </div>
                  <div className="mt-1 text-sm font-black">
                    {draft.title}
                  </div>
                </div>
                <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {Math.round(draft.confidence * 100)}% • {confidenceLabel}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-[10px] font-semibold text-slate-400">Mapel</div>
                  <div className="mt-1 font-bold">{draft.subjectName || 'Belum terdeteksi'}</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="text-[10px] font-semibold text-slate-400">Deadline</div>
                  <div className="mt-1 font-bold">
                    {draft.dueDate && draft.dueTime
                      ? `${draft.dueDate} • ${draft.dueTime} WIB`
                      : 'Akan dihitung dari jadwal'}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyDraft}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  <CheckCircle2 size={15} />
                  Gunakan draft
                </button>
                <span className="text-[10px] text-slate-400">
                  Tetap tinjau sebelum menyimpan.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
