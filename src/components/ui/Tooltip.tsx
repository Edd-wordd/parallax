"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({ content, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId().replace(/:/g, "-");

  const trigger = React.cloneElement(children, {
    "aria-describedby": open ? id : undefined,
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onPointerEnter: () => setOpen(true),
    onPointerLeave: () => setOpen(false),
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "absolute z-50 max-w-[240px] rounded border border-zinc-600 bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 shadow-lg",
            side === "top" && "bottom-full left-1/2 mb-1 -translate-x-1/2",
            side === "bottom" && "top-full left-1/2 mt-1 -translate-x-1/2",
            side === "left" && "right-full top-1/2 mr-1 -translate-y-1/2",
            side === "right" && "left-full top-1/2 ml-1 -translate-y-1/2"
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
