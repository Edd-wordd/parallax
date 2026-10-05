"use client";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";

interface TargetFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  types: Record<string, boolean>;
  onTypeChange: (key: string, checked: boolean) => void;
  visibleTonight: boolean;
  onVisibleTonightChange: (v: boolean) => void;
  /** Label: Visible tonight | Visible this session */
  visibleFilterLabel: string;
  brightAndLarge: boolean;
  onBrightAndLargeChange: (v: boolean) => void;
  gridView: boolean;
  onGridViewChange: (v: boolean) => void;
}

const TARGET_TYPES = [
  "galaxy",
  "nebula",
  "open_cluster",
  "globular_cluster",
];

export function TargetFilters({
  search,
  onSearchChange,
  types,
  onTypeChange,
  visibleTonight,
  onVisibleTonightChange,
  visibleFilterLabel,
  brightAndLarge,
  onBrightAndLargeChange,
  gridView,
  onGridViewChange,
}: TargetFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Search targets..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-64"
      />
      <div className="flex flex-wrap items-center gap-4">
        {TARGET_TYPES.map((t) => (
          <label key={t} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={types[t] ?? false}
              onCheckedChange={(c) => onTypeChange(t, !!c)}
            />
            <span className="capitalize">{t.replace("_", " ")}</span>
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={visibleTonight}
          onCheckedChange={onVisibleTonightChange}
        />
        {visibleFilterLabel}
      </label>
      <label
        className="flex items-center gap-2 text-sm"
        title="Magnitude ≤ 8 and major size ≥ 15′"
      >
        <Checkbox
          checked={brightAndLarge}
          onCheckedChange={onBrightAndLargeChange}
        />
        Bright &amp; large
      </label>
      <div className="ml-auto flex gap-1">
        <Button
          variant={gridView ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onGridViewChange(true)}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button
          variant={!gridView ? "secondary" : "ghost"}
          size="icon"
          onClick={() => onGridViewChange(false)}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
