interface Props {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  tone?: string;
}

export default function GoalRing({ value, target, size = 108, strokeWidth = 10, label, sublabel, tone = '#34d399' }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  const offset = circumference * (1 - ratio);

  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="goal-ring__arc"
          style={{ filter: `drop-shadow(0 0 6px ${tone}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-lg font-black text-white tabular-nums">{label ?? `${value}/${target}`}</div>
          {sublabel ? <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{sublabel}</div> : null}
        </div>
      </div>
    </div>
  );
}
