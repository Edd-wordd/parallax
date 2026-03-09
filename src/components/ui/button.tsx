import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "h-9 bg-white/10 text-white hover:bg-white/15 border border-white/10",
        cta: "h-9 bg-indigo-500/70 text-white hover:bg-indigo-500/85 border border-indigo-500/30",
        destructive: "bg-red-900/80 text-red-100 hover:bg-red-800/80",
        outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
        secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
        ghost: "bg-transparent hover:bg-white/5 text-white",
        link: "text-indigo-400 underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
