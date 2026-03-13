"use client";

import { useAppStore } from "@/lib/store";
import { ContextChipsBar } from "@/components/ContextChipsBar";
import { FieldModePopover } from "@/components/missions/FieldModePopover";

export function TopBar() {
  const isFieldMode = useAppStore((s) => s.isFieldMode);
  const toggleFieldMode = useAppStore((s) => s.toggleFieldMode);
  const fieldModeOptions = useAppStore((s) => s.fieldModeOptions);
  const setFieldModeOptions = useAppStore((s) => s.setFieldModeOptions);

  return (
    <header className="theme-shell-header sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex flex-1 items-center">
        <ContextChipsBar />
      </div>
      <FieldModePopover
        isFieldMode={isFieldMode}
        options={fieldModeOptions}
        onToggle={toggleFieldMode}
        onOptionsChange={setFieldModeOptions}
      />
    </header>
  );
}
