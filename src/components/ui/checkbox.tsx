"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked ?? false}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-4 w-4 cursor-pointer rounded border-white/10 bg-white/5 text-teal-500 focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/40",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
