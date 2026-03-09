"use client";


/**
 * Altitude Curve - a compact sparkline-style visualization of relative altitude
 * across a capture window. Uses a deterministic bell-like curve for v1 (no backend).
 */

function parseHHMM(s: string): number {
  const parts = s.trim().split(/[:\s]+/);
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h * 60 + m;
}

function minutesInWindow(startMin: number, endMin: number): number {
  if (endMin >= startMin) return endMin - startMin;
  return 24 * 60 - startMin + endMin;
}

function isNowInWindow(nowMin: number, startMin: number, endMin: number): boolean {
  if (startMin <= endMin) return nowMin >= startMin && nowMin <= endMin;
  return nowMin >= startMin || nowMin <= endMin;
}

function tFromMinutes(min: number, startMin: number, duration: number, crossesMidnight: boolean): number {
  if (duration === 0) return 0;
  let offset: number;
  if (crossesMidnight) {
    if (min >= startMin) offset = min - startMin;
    else offset = 24 * 60 - startMin + min;
  } else {
    offset = min - startMin;
  }
  return Math.max(0, Math.min(1, offset / duration));
}

function nowMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

export interface AltitudeCurveProps {
  startTime: string;
  endTime: string;
  now?: Date;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function AltitudeCurve({
  startTime,
  endTime,
  now = new Date(),
  height = 42,
  showLabels = false,
  className = "",
}: AltitudeCurveProps) {
  const startMin = parseHHMM(startTime);
  const endMin = parseHHMM(endTime);
  const duration = minutesInWindow(startMin, endMin);
  const crossesMidnight = endMin < startMin;

  const N = 32;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const y = 0.15 + 0.85 * Math.pow(Math.sin(Math.PI * t), 1.2);
    points.push({ x: t * 100, y: (1 - y) * 100 });
  }
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const nowMin = nowMinutes(now);
  const inWindow = isNowInWindow(nowMin, startMin, endMin);
  const tNow = inWindow ? tFromMinutes(nowMin, startMin, duration, crossesMidnight) : -1;
  const yNow = tNow >= 0 ? 0.15 + 0.85 * Math.pow(Math.sin(Math.PI * tNow), 1.2) : 0;
  const cx = tNow * 100;
  const cy = (1 - yNow) * 100;

  const strokeWidth = showLabels ? 2.5 : 2;
  // Removed feGaussianBlur filter — was causing paint thrash on each render

  return (
    <div className={className}>
      {showLabels && (
        <div className="mb-1.5 flex items-baseline justify-between text-[10px] text-white/50">
          <span className="tabular-nums">{startTime}</span>
          <span className="text-white/40">Peak</span>
          <span className="tabular-nums">{endTime}</span>
        </div>
      )}
      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {showLabels && (
            <g stroke="currentColor" strokeOpacity={0.08} strokeWidth="0.5">
              <line x1="0" y1="25" x2="100" y2="25" />
              <line x1="0" y1="50" x2="100" y2="50" />
              <line x1="0" y1="75" x2="100" y2="75" />
            </g>
          )}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-400/70"
          />
          {inWindow && tNow >= 0 && (
            <circle cx={cx} cy={cy} r={3} fill="currentColor" className="text-indigo-400/70" />
          )}
        </svg>
      </div>
      {showLabels && inWindow && (
        <div className="mt-1 text-[10px] text-indigo-400/60 text-center">Now</div>
      )}
    </div>
  );
}
