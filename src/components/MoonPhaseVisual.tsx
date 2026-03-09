"use client";

/**
 * iPhone-inspired moon phase visual. Uses CSS masking to simulate illumination.
 * TODO: Replace mock data with real astronomical calculations (e.g., SunCalc, ephem).
 */

export interface MoonPhaseData {
  moonPhase: string;
  illumination: number; // 0–1
  moonset: string;
  altitude: string;
  moonAngle?: number;
}

interface MoonPhaseVisualProps {
  data: MoonPhaseData;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When true, renders only the graphic (no label or % text) */
  imageOnly?: boolean;
}

const SIZES = { sm: 64, md: 96, lg: 120 };

export function MoonPhaseVisual({ data, size = "lg", className, imageOnly }: MoonPhaseVisualProps) {
  const px = SIZES[size];
  const { illumination, moonPhase } = data;

  // Shadow overlay: for waxing (lit on right), shadow covers left. Left offset moves
  // shadow off-moon. illumination 1 = shadow fully left (no cover), 0 = full cover.
  const shadowLeft = -illumination * px;

  return (
    <div className={className}>
      <div
        className="relative rounded-full overflow-hidden"
        style={{ width: px, height: px }}
        aria-hidden
      >
        {/* Lit moon surface - cool gray with subtle warmth */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `
              radial-gradient(circle at 30% 30%,
                rgba(220, 225, 235, 0.95) 0%,
                rgba(180, 190, 205, 0.9) 40%,
                rgba(140, 150, 165, 0.85) 100%
              )
            `,
            boxShadow: "inset -2px -2px 8px rgba(0,0,0,0.15), 0 0 20px rgba(200,210,230,0.08)",
          }}
        />
        {/* Shadow overlay - unlit hemisphere (terminator) */}
        <div
          className="absolute top-0 rounded-full bg-[#080a0e]"
          style={{
            width: px,
            height: px,
            left: shadowLeft,
            boxShadow: "none",
          }}
        />
      </div>
      {!imageOnly && (
        <div className="mt-2 text-center">
          <p className="dash-section-title text-zinc-400">{moonPhase}</p>
          <p className="dash-metric text-[10px] text-zinc-500 mt-0.5">
            {Math.round(illumination * 100)}% illuminated
          </p>
        </div>
      )}
    </div>
  );
}
