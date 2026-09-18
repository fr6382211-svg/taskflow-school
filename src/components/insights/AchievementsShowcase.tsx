import { Trophy } from 'lucide-react';
import Reveal from '../ui/Reveal';
import type { Achievement, AchievementSummary } from '../../services/achievementService';

const TIER_TONE: Record<Achievement['tier'], string> = {
  bronze: 'border-amber-700/25 bg-amber-700/5',
  silver: 'border-slate-400/25 bg-slate-400/5',
  gold: 'border-amber-400/25 bg-amber-400/5',
  platinum: 'border-sky-300/25 bg-sky-300/5',
};

export default function AchievementsShowcase({ summary }: { summary: AchievementSummary }) {
  return (
    <section className="hub-surface rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Trophy size={17} className="text-amber-300" /> Achievements
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {summary.unlockedCount} dari {summary.totalCount} pencapaian terbuka.
          </p>
        </div>
        {summary.nextUp && (
          <div className="hidden text-right sm:block">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">Berikutnya</div>
            <div className="text-xs font-bold text-slate-200">{summary.nextUp.title}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {summary.achievements.map((achievement, index) => {
          const ratio = achievement.target > 0 ? Math.min(1, achievement.progress / achievement.target) : 0;
          return (
            <Reveal key={achievement.id} delay={index * 45}>
              <div
                className={`badge-tile ${achievement.unlocked ? 'badge-tile--unlocked' : 'badge-tile--locked'} rounded-xl border p-3 ${TIER_TONE[achievement.tier]}`}
              >
                <div className="text-2xl">{achievement.emoji}</div>
                <div className="mt-2 text-xs font-bold text-white">{achievement.title}</div>
                <div className="mt-0.5 text-[10px] leading-4 text-slate-500">{achievement.description}</div>
                <div className="hub-progress mt-2">
                  <span style={{ width: `${Math.max(4, ratio * 100)}%`, background: achievement.unlocked ? '#34d399' : '#64748b' }} />
                </div>
                <div className="mt-1 text-right text-[9px] font-mono text-slate-500">
                  {Math.min(achievement.progress, achievement.target)}/{achievement.target}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
