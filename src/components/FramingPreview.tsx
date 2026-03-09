"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { useAppStore } from "@/lib/store";

interface FramingPreviewProps {
  quality?: "excellent" | "good" | "poor";
  className?: string;
}

export function FramingPreview({ quality = "excellent", className }: FramingPreviewProps) {
  const { activeGearId } = useAppStore();
  const gear = MOCK_GEAR.find((g) => g.id === activeGearId);

  const qualityColor =
    quality === "excellent"
      ? "text-emerald-400"
      : quality === "good"
        ? "text-amber-400"
        : "text-red-400";

  return (
    <Card className={className}>
      <CardHeader>
        <h2 className="text-sm font-medium">Framing Preview</h2>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-zinc-500">Your Gear:</span>
          <div className="font-medium">
            {gear?.telescope_name ?? "—"} / {gear?.camera_name ?? "—"}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Framing Quality: </span>
          <span className={`font-medium capitalize ${qualityColor}`}>{quality}</span>
        </div>
      </CardContent>
    </Card>
  );
}
