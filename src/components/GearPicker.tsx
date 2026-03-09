"use client";

import { Select } from "@/components/ui/select";
import type { GearProfile } from "@/lib/types";

interface GearPickerProps {
  gear: GearProfile[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
}

export function GearPicker({
  gear,
  value,
  onValueChange,
  placeholder = "Select gear",
}: GearPickerProps) {
  const options = [
    { value: "", label: placeholder },
    ...gear.map((g) => ({ value: g.id, label: g.name })),
  ];
  return (
    <Select
      options={options}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
