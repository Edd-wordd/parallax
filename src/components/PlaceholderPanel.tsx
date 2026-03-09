import { cn } from "@/lib/utils";

interface PlaceholderPanelProps {
  title: string;
  note?: string;
  children?: React.ReactNode;
  className?: string;
  aspectRatio?: string;
}

export function PlaceholderPanel({
  title,
  note,
  children,
  className,
  aspectRatio = "aspect-video",
}: PlaceholderPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center",
        aspectRatio,
        className
      )}
    >
      <div className="text-sm font-medium text-zinc-400">{title}</div>
      {note && <div className="mt-1 text-xs text-zinc-500">{note}</div>}
      {children}
    </div>
  );
}
