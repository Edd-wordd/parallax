"use client";

import { usePathname } from "next/navigation";
import { MapPin, Telescope, Moon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useMissionStore } from "@/lib/missionStore";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDate } from "@/lib/utils";

export function ContextChipsBar() {
  const pathname = usePathname();
  const { activeMissionId } = useMissionStore();
  const { activeLocationId, activeGearId, dateTime } = useAppStore();
  const hasMission = !!activeMissionId || pathname === "/missions/new";

  const activeLoc = MOCK_LOCATIONS.find((l) => l.id === activeLocationId);
  const activeGear = MOCK_GEAR.find((g) => g.id === activeGearId);
  const siteLabel = hasMission ? (activeLoc?.name ?? "—") : "No mission";
  const rigLabel = hasMission ? (activeGear?.name ?? "—") : "No mission";
  const isToday = (d: Date) =>
    d.getFullYear() === new Date().getFullYear() &&
    d.getMonth() === new Date().getMonth() &&
    d.getDate() === new Date().getDate();
  const dateLabel = hasMission
    ? isToday(new Date(dateTime))
      ? `Tonight (${formatDate(dateTime)})`
      : formatDate(dateTime)
    : "No mission";

  const chipBase = "inline-flex items-center gap-2 text-xs w-[200px] shrink-0";
  const iconClass = "size-[14px] shrink-0 text-zinc-300";

  return (
    <div className="flex items-center gap-10">
      <span className={chipBase}>
        <MapPin className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="text-zinc-300 font-semibold">Site</span>
          <span className="text-zinc-500 mx-1">·</span>
          <span className="text-zinc-400 truncate">{siteLabel}</span>
        </span>
      </span>
      <span className={chipBase}>
        <Telescope className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="text-zinc-300 font-semibold">Rig</span>
          <span className="text-zinc-500 mx-1">·</span>
          <span className="text-zinc-400 truncate">{rigLabel}</span>
        </span>
      </span>
      <span className={chipBase}>
        <Moon className={iconClass} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="text-zinc-300 font-semibold">Date</span>
          <span className="text-zinc-500 mx-1">·</span>
          <span className="text-zinc-400 truncate">{dateLabel}</span>
        </span>
      </span>
    </div>
  );
}
