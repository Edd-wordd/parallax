import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-1.5 py-0.5 font-display text-[10px] font-medium uppercase tracking-[0.08em]",
  {
    variants: {
      variant: {
        default: "bg-zinc-800/50 text-zinc-400",
        accent: "bg-indigo-500/10 text-indigo-400/90 border border-indigo-500/15",
        success: "bg-emerald-500/10 text-emerald-400/90",
        caution: "bg-amber-500/10 text-amber-400/90",
        danger: "bg-rose-500/10 text-rose-400/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
