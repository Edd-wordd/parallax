"use client";

import { cn } from "@/lib/utils";

type BannerVariant = "better" | "worse";

interface SiteVerificationBannerProps {
  message: string;
  variant: BannerVariant;
  className?: string;
}

export function SiteVerificationBanner({
  message,
  variant,
  className,
}: SiteVerificationBannerProps) {
  const isBetter = variant === "better";
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-sm font-medium",
        isBetter
          ? "bg-teal-500/15 border border-teal-500/30 text-teal-200"
          : "bg-rose-500/10 border border-rose-500/25 text-rose-200",
        className
      )}
    >
      {message}
    </div>
  );
}
