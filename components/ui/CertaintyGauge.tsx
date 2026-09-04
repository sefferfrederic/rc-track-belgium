import clsx from "clsx";
import type { CertaintyLevel } from "@/types";

interface CertaintyGaugeProps {
  value: CertaintyLevel;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Ticks façon compte-tours: repères à 0/25/50/75/100, gap en bas (270° de course)
const START_ANGLE = 135;
const SWEEP = 270;

function polar(angleDeg: number, r: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

export default function CertaintyGauge({ value, size = 56, showLabel = true, className }: CertaintyGaugeProps) {
  const fraction = value / 100;
  const dash = (SWEEP / 360) * CIRCUMFERENCE * fraction;
  const gap = CIRCUMFERENCE - dash;
  const rotation = START_ANGLE - 90; // stroke-dasharray démarre à 3h (angle 0), on recale

  return (
    <div className={clsx("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-0">
        <defs>
          <linearGradient id={`flagGrad-${value}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFC700" />
            <stop offset="55%" stopColor="#FF6A00" />
            <stop offset="100%" stopColor="#E8102B" />
          </linearGradient>
        </defs>

        {/* piste de fond */}
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="#28282E"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(SWEEP / 360) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform={`rotate(${rotation} 50 50)`}
        />

        {/* arc de certitude */}
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={`url(#flagGrad-${value})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          transform={`rotate(${rotation} 50 50)`}
        />

        {/* repères façon compte-tours à 0/25/50/75/100% */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = START_ANGLE + (SWEEP * tick) / 100;
          const outer = polar(angle, 46);
          const inner = polar(angle, 40.5);
          return (
            <line
              key={tick}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="#0A0A0C"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      {showLabel && (
        <span className="absolute font-mono text-[0.7em] font-medium tabular-nums text-track-white">
          {value}%
        </span>
      )}
    </div>
  );
}
