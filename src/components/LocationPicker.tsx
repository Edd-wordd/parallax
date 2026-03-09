"use client";

import { Select } from "@/components/ui/select";
import type { Location } from "@/lib/types";

interface LocationPickerProps {
  locations: Location[];
  value: string;
  onValueChange: (id: string) => void;
  placeholder?: string;
}

export function LocationPicker({
  locations,
  value,
  onValueChange,
  placeholder = "Select location",
}: LocationPickerProps) {
  const options = [
    { value: "", label: placeholder },
    ...locations.map((l) => ({
      value: l.id,
      label: `${l.name} (Bortle ${l.bortle})`,
    })),
  ];
  return (
    <Select
      options={options}
      value={value}
      onValueChange={onValueChange}
    />
  );
}
