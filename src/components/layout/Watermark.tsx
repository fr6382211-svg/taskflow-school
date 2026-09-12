import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getSettings } from '../../services/settingsService';

export default function Watermark() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      const compact = document.body.classList.contains('compact-mode');
      if (!user) {
        if (alive) setVisible(!compact);
        return;
      }
      try {
        const settings = await getSettings(user.id);
        if (alive) setVisible((settings?.show_watermark ?? true) && !compact);
      } catch {
        if (alive) setVisible(!compact);
      }
    }
    void load();
    const handler = () => { void load(); };
    window.addEventListener('taskflow:theme-changed', handler);
    return () => { alive = false; window.removeEventListener('taskflow:theme-changed', handler); };
  }, [user]);

  if (!visible) return null;

  return (
    <div
      className="taskflow-watermark pointer-events-none fixed bottom-10 right-3 z-[70] select-none sm:bottom-11 sm:right-5"
      aria-hidden="true"
    >
      <div className="rounded-full border border-white/40 bg-white/55 px-2.5 py-1 text-[9px] font-black tracking-[0.16em] text-slate-500 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
        @FATHURR
      </div>
    </div>
  );
}
