"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  time: string;
  altitude: number;
}

interface AltitudeChartProps {
  data: DataPoint[];
  className?: string;
}

export function AltitudeChart({ data, className }: AltitudeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        setReady(width > 0 && height > 0);
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
      style={{ height: 200, minHeight: 200 }}
    >
      {ready && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis dataKey="time" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `${v}°`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#27272a",
                border: "1px solid #52525b",
                borderRadius: "6px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value) => [`${value ?? 0}°`, "Altitude"]}
            />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ fill: "#22d3ee", r: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
