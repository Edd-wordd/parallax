"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => (
    <input
      ref={ref}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? 0}
      onChange={(e) => onValueChange?.(Number(e.target.value))}
      className={cn(
        "w-full h-2 appearance-none rounded-full bg-white/10 accent-teal-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition [&::-webkit-slider-thumb]:hover:bg-teal-400",
        className
      )}
      {...props}
    />
  )
);
Slider.displayName = "Slider";

export { Slider };
