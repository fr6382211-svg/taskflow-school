import { Check, GraduationCap, Heart } from 'lucide-react';
import type { WorkspaceId } from '../context/WorkspaceContext';
import { WORKSPACES } from '../context/WorkspaceContext';

export default function WorkspacePicker({ value, onChange }: { value: WorkspaceId; onChange: (value: WorkspaceId) => void }) {
  const icons = { fathur: GraduationCap, mazet: Heart } as const;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Masuk sebagai</span>
        <span className="text-[10px] font-semibold text-slate-400">Sistem terpisah</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(WORKSPACES) as WorkspaceId[]).map((id) => {
          const workspace = WORKSPACES[id];
          const Icon = icons[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative rounded-2xl border p-4 text-left transition ${selected ? 'border-indigo-400/60 bg-indigo-50 shadow-sm ring-2 ring-indigo-500/10 dark:border-indigo-400/50 dark:bg-indigo-950/25' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700'}`}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>
                  <Icon size={18} />
                </span>
                {selected && <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-600 text-white"><Check size={14} /></span>}
              </div>
              <div className="mt-3 text-sm font-black text-slate-950 dark:text-white">{workspace.name}</div>
              <div className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{workspace.description}</div>
              <div className="mt-3 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{workspace.schoolLabel}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
