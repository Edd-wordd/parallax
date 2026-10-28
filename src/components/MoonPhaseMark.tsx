import { cn } from "@/lib/utils";

interface MoonPhaseMarkProps {
  phaseFraction: number;
  elongationDeg: number;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Lit portion of the Moon. phaseFraction is illuminated fraction (0 new, 1 full).
 * Elongation under 180° is waxing, lit on the right.
 */
export function MoonPhaseMark({
  phaseFraction,
  elongationDeg,
  size = 16,
  className,
  title,
}: MoonPhaseMarkProps) {
  const f = Math.min(1, Math.max(0, phaseFraction));
  const elongation = ((elongationDeg % 360) + 360) % 360;
  const waxing = elongation < 180;
  const r = 10;
  const cx = 12;
  const cy = 12;
  const rx = Math.max(0.15, Math.abs(2 * f - 1) * r);
  const outerSweep = waxing ? 1 : 0;
  const termSweep = f > 0.5 ? outerSweep : 1 - outerSweep;
  const top = cy - r;
  const bot = cy + r;
  const crescent = `M ${cx} ${top} A ${r} ${r} 0 0 ${outerSweep} ${cx} ${bot} A ${rx} ${r} 0 0 ${termSweep} ${cx} ${top} Z`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("shrink-0 text-zinc-200", className)}
      role="img"
      aria-label={title ?? "Moon phase"}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="#121a20"
        stroke="currentColor"
        strokeWidth="1"
      />
      {f >= 0.985 ? (
        <circle cx={cx} cy={cy} r={r - 0.4} fill="currentColor" />
      ) : f > 0.02 ? (
        <path d={crescent} fill="currentColor" />
      ) : null}
    </svg>
  );
}
