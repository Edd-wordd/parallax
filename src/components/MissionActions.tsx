"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MissionActionsProps {
  missionId: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function MissionActions({ missionId, size = "default" }: MissionActionsProps) {
  return (
    <div className="flex gap-2">
      <Link href={`/missions/${missionId}`}>
        <Button variant="cta" size={size}>
          Open Mission
        </Button>
      </Link>
      <Link href={`/missions/${missionId}/log`}>
        <Button variant="ghost" size={size}>
          Log Results
        </Button>
      </Link>
    </div>
  );
}
