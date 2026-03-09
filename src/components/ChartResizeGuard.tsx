"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ChartResizeGuardProps {
  children: ReactNode;
  /** Minimum height in px (default: 120) */
  minHeight?: number;
  /** Height in px (default: 200) */
  height?: number;
  className?: string;
}

/**
 * Wraps Recharts ResponsiveContainer so the chart only renders when the container
 * has non-zero dimensions. Prevents "width(-1) and height(-1)" errors when
 * charts are in hidden tabs or before layout.
 */
export function ChartResizeGuard({
  children,
  minHeight = 120,
  height = 200,
  className,
}: ChartResizeGuardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height: h } = e.contentRect;
        setReady(width > 0 && h > 0);
        break;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, minHeight }}
    >
      {ready ? children : null}
    </div>
  );
}
