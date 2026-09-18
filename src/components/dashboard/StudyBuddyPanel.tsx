import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Users, Zap } from 'lucide-react';
import { usePresence } from '../../hooks/usePresence';
import { useToast } from '../ui/Toast';

const ACTIVITY_LABEL: Record<string, string> = {
  dashboard: 'di Dashboard',
  tasks: 'mengerjakan tugas',
  schedule: 'melihat jadwal',
  focus: 'sedang Focus',
  media: 'di MediaBox',
  idle: 'online',
};

const CHEER_MESSAGES = ['Semangat! 🔥', 'Kamu pasti bisa! 💪', 'Tetap fokus! ✨', 'Gas terus! 🚀'];

export default function StudyBuddyPanel() {
  const { buddies, lastCheer, sendCheer, isOnline } = usePresence('dashboard');
  const { push } = useToast();
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!lastCheer) return;
    confetti({ particleCount: 60, spread: 65, origin: { x: 0.85, y: 0.15 }, colors: ['#818cf8', '#34d399', '#f472b6', '#fbbf24'] });
    push({ tone: 'success', title: `${lastCheer.fromName} mengirim semangat!`, message: lastCheer.message });
  }, [lastCheer, push]);

  const cheer = () => {
    if (sending) return;
    setSending(true);
    const message = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
    sendCheer(message);
    confetti({ particleCount: 40, spread: 55, origin: { x: 0.15, y: 0.15 } });
    push({ tone: 'info', title: 'Semangat terkirim!', message });
    window.setTimeout(() => setSending(false), 1500);
  };

  return (
    <section className="hub-surface hub-card-interactive rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Users size={16} className="text-indigo-300" /> Study Buddy
        </div>
        <span className={`hub-chip normal-case tracking-normal ${isOnline ? 'text-emerald-300' : ''}`}>
          {isOnline ? `${buddies.length} online` : 'Sendiri saat ini'}
        </span>
      </div>

      {buddies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-slate-600">
          Belum ada teman workspace yang online. Statusmu tetap terlihat secara real-time saat mereka membuka SchoolHub.
        </div>
      ) : (
        <div className="space-y-2">
          {buddies.map((buddy) => (
            <div key={buddy.userId} className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.025] p-2.5">
              <span className="buddy-dot" />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-200">{buddy.name}</div>
                <div className="text-[10px] text-slate-500">{ACTIVITY_LABEL[buddy.activity] ?? 'online'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={cheer}
        disabled={sending}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-2.5 text-xs font-bold text-indigo-200 transition hover:bg-indigo-400/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Zap size={14} /> Kirim semangat
      </button>
    </section>
  );
}
