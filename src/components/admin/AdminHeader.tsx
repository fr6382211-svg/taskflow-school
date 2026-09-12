import { ShieldCheck } from 'lucide-react';

export default function AdminHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-indigo-500">
        <ShieldCheck size={14} />
        Control Center
      </div>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
