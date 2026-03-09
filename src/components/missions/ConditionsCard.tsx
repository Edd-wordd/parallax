"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/Tooltip";
import { forecastSeed } from "@/lib/mockForecast";
import { cn } from "@/lib/utils";
import type { ConditionsState, WindLevel } from "@/lib/missionUIStore";
import { Info } from "lucide-react";

interface ConditionsCardProps {
  conditions: ConditionsState;
  onChange: (c: Partial<ConditionsState>) => void;
  onReset?: () => void;
  onUpdatePlan?: () => void;
  className?: string;
}

const WIND_OPTIONS: WindLevel[] = ["low", "med", "high"];

const SEEING_HELP =
  "1 = Very poor (stars twinkling heavily)\n2 = Poor (unstable stars)\n3 = Average (typical)\n4 = Good (mostly steady)\n5 = Excellent (rare calm)";

const TRANSPARENCY_HELP =
  "1 = Very hazy\n2 = Hazy / thin cloud\n3 = Average clarity\n4 = Clear\n5 = Crystal clear";

const WIND_HELP =
  "Low = stable imaging\nMed = occasional vibration\nHigh = likely vibration / guiding issues";

const CLOUDS_HELP = "Estimated sky coverage";

const MOON_HELP =
  "Toggle if moonlight is reducing contrast in the field";

function LabelWithHelp({ label, help }: { label: string; help: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <label className="text-xs text-zinc-500">{label}</label>
      <Tooltip
        content={<pre className="whitespace-pre-wrap font-sans m-0">{help}</pre>}
        side="top"
      >
        <button
          type="button"
          className="inline-flex items-center justify-center w-4 h-4 rounded-full text-zinc-500 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          aria-label={`Help for ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </Tooltip>
    </div>
  );
}

export function ConditionsCard({
  conditions,
  onChange,
  onReset,
  onUpdatePlan,
  className,
}: ConditionsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wider">Field Conditions</h2>
        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-zinc-400 hover:text-cyan-400 h-7 px-2"
          >
            Reset to forecast
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-zinc-500">
          Adjust if actual conditions differ from forecast. These changes affect mission
          guidance only.
        </p>
        <p className="text-xs text-zinc-500 -mt-2">
          {forecastSeed.generatedAtLabel}
        </p>
        <div>
          <LabelWithHelp label="Seeing (1–5)" help={SEEING_HELP} />
          <div className="flex gap-1" role="group" aria-label="Seeing">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ seeing: v })}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                  conditions.seeing === v
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <LabelWithHelp label="Transparency (1–5)" help={TRANSPARENCY_HELP} />
          <div className="flex gap-1" role="group" aria-label="Transparency">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ transparency: v })}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                  conditions.transparency === v
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <LabelWithHelp label="Wind" help={WIND_HELP} />
          <div className="flex gap-1" role="group" aria-label="Wind">
            {WIND_OPTIONS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange({ wind: v })}
                className={cn(
                  "flex-1 rounded px-2 py-1 text-sm font-medium capitalize transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
                  conditions.wind === v
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <LabelWithHelp
            label={`Clouds (${conditions.clouds}%)`}
            help={CLOUDS_HELP}
          />
          <Slider
            min={0}
            max={100}
            value={[conditions.clouds]}
            onValueChange={([v]) => onChange({ clouds: v ?? 0 })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-zinc-400">Moon glare</span>
            <Tooltip content={MOON_HELP} side="top">
              <button
                type="button"
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-zinc-500 hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                aria-label="Help for Moon glare"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={conditions.moonGlare}
            onClick={() => onChange({ moonGlare: !conditions.moonGlare })}
            className={cn(
              "h-2 w-8 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50",
              conditions.moonGlare ? "bg-cyan-500" : "bg-zinc-600",
            )}
          />
        </div>
        {onUpdatePlan && (
          <div className="pt-3 border-t border-white/10">
            <Button
              variant="cta"
              size="sm"
              onClick={onUpdatePlan}
              className="w-full"
            >
              Update Mission Plan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
