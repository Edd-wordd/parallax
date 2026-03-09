"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getTargetById } from "@/lib/mock/recommendations";
import { generateAltitudeSeries } from "@/lib/mock/altitude";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "@/components/ScoreBadge";
import { AltitudeChart } from "@/components/AltitudeChart";
import { PlaceholderPanel } from "@/components/PlaceholderPanel";
import { FramingPreview } from "@/components/FramingPreview";
import { formatAngularSize } from "@/lib/utils";

export default function TargetDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const target = getTargetById(id);

  if (!target) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400">Target not found</p>
        <Link href="/targets">
          <Button variant="link" className="mt-2">
            Back to targets
          </Button>
        </Link>
      </div>
    );
  }

  const score = 72;
  const altitudeData = generateAltitudeSeries();
  const bestWindow = "22:10 → 02:45";
  const peakAltitude = 68;
  const transitTime = "23:42";
  const riseSet = "19:12 / 04:18";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{target.name}</h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-zinc-400">
            <span className="capitalize">{target.type.replace("_", " ")}</span>
            <span>Mag {target.magnitude}</span>
            <span>{formatAngularSize(target.angular_size)}</span>
            <span>{target.constellation}</span>
            <ScoreBadge score={score} size="lg" className="ml-2" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button>Add to Tonight Plan</Button>
          <Link href={`/logs/new?target=${id}`}>
            <Button variant="outline">Log this target</Button>
          </Link>
        </div>
      </div>

      <PlaceholderPanel
        title="NASA Image Placeholder"
        note="Replace with NASA API"
        aspectRatio="aspect-video"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Visibility Chart</h2>
          </CardHeader>
          <CardContent>
            <AltitudeChart data={altitudeData} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                Best Shooting Window
              </div>
              <div className="font-mono text-lg mt-1">{bestWindow}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">
                Peak Altitude
              </div>
              <div className="font-mono text-lg mt-1">{peakAltitude}°</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Transit</div>
            <div className="font-medium">{transitTime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-zinc-500">Rise / Set</div>
            <div className="font-medium">{riseSet}</div>
          </CardContent>
        </Card>
      </div>

      <FramingPreview quality="excellent" />

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">AI Explanation</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-300">
            {target.name} is recommended tonight because it reaches high
            altitude and remains visible for several hours with minimal moon
            interference.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
