"use client";

import { cn } from "@/lib/utils";

interface CelestialOrbProps {
  /** Size in pixels */
  size?: number;
  /** Placement for layout - inline vs absolute background */
  variant?: "inline" | "background";
  className?: string;
}

/**
 * Premium celestial orb - atmospheric anchor for observatory/astronomy identity.
 * Subtle glow, indigo/purple palette, not dominating.
 */
export function CelestialOrb({
  size = 80,
  variant = "inline",
  className,
}: CelestialOrbProps) {
  const orb = (
    <div
      aria-hidden
      className={cn(
        "rounded-full shrink-0",
        variant === "background" && "absolute pointer-events-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        ...(variant === "background" && {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }),
        background: `
          radial-gradient(ellipse 100% 100% at 50% 50%,
            rgba(99, 102, 241, 0.12) 0%,
            rgba(79, 70, 229, 0.06) 35%,
            rgba(67, 56, 202, 0.03) 55%,
            transparent 70%
          ),
          radial-gradient(ellipse 70% 70% at 35% 35%,
            rgba(129, 140, 248, 0.08) 0%,
            transparent 50%
          )
        `,
        boxShadow: `
          0 0 ${size}px rgba(99, 102, 241, 0.06),
          inset 0 0 ${size * 0.5}px rgba(129, 140, 248, 0.04)
        `,
      }}
    />
  );

  if (variant === "background") {
    return (
      <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
        {orb}
      </div>
    );
  }

  return orb;
}
