import { useEffect, useState } from 'react';
import { IdCard, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyDigitalCard, subscribeMyDigitalCard, type DigitalIdCard } from '../../services/digitalCardService';

export default function DigitalIdCardBanner() {
  const { user } = useAuth();
  const [card, setCard] = useState<DigitalIdCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    getMyDigitalCard()
      .then((c) => { if (active) setCard(c); })
      .catch(() => { /* silent: banner just won't show */ })
      .finally(() => { if (active) setLoading(false); });
    const unsubscribe = subscribeMyDigitalCard(user.id, (c) => setCard(c));
    return () => { active = false; unsubscribe(); };
  }, [user?.id]);

  // No card issued yet (admin hasn't created one for this user) -> render nothing.
  if (loading || !card) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 sm:p-5 fade-up">
      <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/5">
            {card.photoUrl ? (
              <img src={card.photoUrl} alt={card.fullName} className="h-full w-full object-cover" />
            ) : (
              <UserRound size={26} className="text-white/70" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-indigo-300">
              <IdCard size={13} /> Kartu Digital
            </div>
            <div className="mt-1 truncate text-lg font-extrabold text-white">{card.fullName}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span>No. {card.cardNumber}</span>
              {card.idNumber && <span>• {card.idNumber}</span>}
              <span>• {card.roleLabel}</span>
              {card.classLabel && <span>• {card.classLabel}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 sm:self-center">
          <ShieldCheck size={15} /> Diterbitkan Admin • Permanen
        </div>
      </div>
    </section>
  );
}
