"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationPicker } from "./LocationPicker";
import { GearPicker } from "./GearPicker";
import { useToast } from "@/components/ui/toast";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { MOCK_TARGETS } from "@/lib/mock/targets";

interface SessionFormProps {
  prefilledTargetId?: string;
}

export function SessionForm({ prefilledTargetId }: SessionFormProps) {
  const { toast } = useToast();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [locationId, setLocationId] = useState("loc1");
  const [gearId, setGearId] = useState("gear1");
  const [cloud, setCloud] = useState(10);
  const [seeing, setSeeing] = useState(3);
  const [wind, setWind] = useState(1);
  const [targetIds, setTargetIds] = useState<string[]>(
    prefilledTargetId ? [prefilledTargetId] : []
  );
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    toast("Saved (mock)", "success");
  };

  const toggleTarget = (id: string) => {
    setTargetIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Date & Time</h2>
        </CardHeader>
        <CardContent>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Location</h2>
          </CardHeader>
          <CardContent>
            <LocationPicker
              locations={MOCK_LOCATIONS}
              value={locationId}
              onValueChange={setLocationId}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Gear</h2>
          </CardHeader>
          <CardContent>
            <GearPicker gear={MOCK_GEAR} value={gearId} onValueChange={setGearId} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Conditions</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Cloud cover %</label>
            <Slider min={0} max={100} value={cloud} onValueChange={setCloud} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Seeing (1–5)</label>
            <Slider min={1} max={5} value={seeing} onValueChange={setSeeing} className="mt-1" step={0.5} />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Wind (0–3)</label>
            <Slider min={0} max={3} value={wind} onValueChange={setWind} className="mt-1" step={0.5} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Targets</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {MOCK_TARGETS.slice(0, 15).map((t) => (
              <label key={t.id} className="flex items-center gap-2 rounded border border-zinc-700 px-2 py-1 text-sm">
                <Checkbox
                  checked={targetIds.includes(t.id)}
                  onCheckedChange={() => toggleTarget(t.id)}
                />
                <span>{t.name.split(" ")[0]}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Success & Notes</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2">
            <Checkbox checked={success} onCheckedChange={setSuccess} />
            Session successful
          </label>
          <textarea
            className="w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
            placeholder="Notes..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </CardContent>
      </Card>

      <Button type="submit">Save session</Button>
    </form>
  );
}
