"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

const RECOMMENDED_POSITIONS: { id: string; x: number; y: number }[] = [
  { id: "m31", x: 0.18, y: 0.25 },
  { id: "m42", x: 0.35, y: 0.45 },
  { id: "m45", x: 0.52, y: 0.3 },
  { id: "m13", x: 0.68, y: 0.35 },
  { id: "m51", x: 0.42, y: 0.55 },
];

const MOCK_CONSTELLATIONS = [
  { name: "Orion", points: [[0.2, 0.3], [0.25, 0.35], [0.3, 0.28], [0.35, 0.32], [0.4, 0.25]] },
  { name: "Ursa Major", points: [[0.5, 0.2], [0.55, 0.22], [0.6, 0.18], [0.58, 0.25], [0.65, 0.28]] },
  { name: "Cassiopeia", points: [[0.7, 0.15], [0.72, 0.2], [0.75, 0.18], [0.78, 0.22], [0.8, 0.2]] },
];

export default function SkymapPage() {
  const router = useRouter();
  const [time, setTime] = useState([12]);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showHorizon, setShowHorizon] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, w, h);

    if (showHorizon) {
      ctx.strokeStyle = "#3f3f46";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.9, w * 0.45, h * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (showGrid) {
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 0.5;
      for (let i = 0.2; i < 1; i += 0.2) {
        ctx.beginPath();
        ctx.moveTo(w * i, 0);
        ctx.lineTo(w * i, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, h * i);
        ctx.lineTo(w, h * i);
        ctx.stroke();
      }
    }

    if (showConstellations) {
      MOCK_CONSTELLATIONS.forEach((c) => {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        ctx.beginPath();
        c.points.forEach(([x, y], i) => {
          const px = w * x;
          const py = h * y;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
      });
    }

    RECOMMENDED_POSITIONS.forEach(({ id, x, y }) => {
      const px = w * x;
      const py = h * y;
      const isSelected = selectedTarget === id;
      ctx.fillStyle = isSelected ? "#22d3ee" : "#22d3ee";
      ctx.beginPath();
      ctx.arc(px, py, isSelected ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
    });

    return () => {};
  }, [time[0], showConstellations, showGrid, showHorizon, selectedTarget]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <h1 className="text-2xl font-bold">Sky Map</h1>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-400">Time</span>
          <Slider min={0} max={24} step={1} value={time[0]} onValueChange={(v) => setTime([v])} className="w-32" />
          <span className="text-sm text-zinc-500">{time[0]}:00</span>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showConstellations} onCheckedChange={(c) => setShowConstellations(!!c)} />
          Constellations
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showGrid} onCheckedChange={(c) => setShowGrid(!!c)} />
          Grid
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={showHorizon} onCheckedChange={(c) => setShowHorizon(!!c)} />
          Horizon
        </label>
      </div>
      <Card className="overflow-hidden p-0">
        <div
          className="aspect-[16/10] w-full cursor-crosshair relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const cx = (e.clientX - rect.left) / rect.width;
            const cy = (e.clientY - rect.top) / rect.height;
            for (const { id, x, y } of RECOMMENDED_POSITIONS) {
              const dist = Math.hypot(cx - x, cy - y);
              if (dist < 0.05) {
                setSelectedTarget(id);
                router.push(`/targets/${id}`);
                return;
              }
            }
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ width: "100%", height: "100%" }}
          />
          <div className="absolute top-4 left-4 rounded bg-zinc-900/90 px-3 py-1.5 text-sm text-zinc-400">
            Sky Map Placeholder
          </div>
        </div>
      </Card>
      <p className="text-sm text-zinc-500">
        Click on a target dot to open its detail. (Mock — no real astronomy math.)
      </p>
    </motion.div>
  );
}
