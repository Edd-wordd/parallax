import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 focus-visible:border-teal-500/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
