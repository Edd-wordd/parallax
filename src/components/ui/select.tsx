"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, value, onValueChange, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        value={value ?? ""}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          "flex h-9 w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-white/5 pl-3 pr-8 py-1.5 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500/40 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
export type { SelectOption };
