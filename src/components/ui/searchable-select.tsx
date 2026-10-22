"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SelectOption } from "@/components/ui/select";

type SearchableSelectProps = {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Shown in the closed trigger when value is empty */
  emptyLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Max visible rows in the list */
  maxListHeightClass?: string;
};

export function SearchableSelect({
  options,
  value = "",
  onValueChange,
  placeholder = "Search…",
  emptyLabel = "—",
  disabled = false,
  className,
  maxListHeightClass = "max-h-56",
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = useCallback(
    (next: string) => {
      onValueChange?.(next);
      setOpen(false);
      setQuery("");
    },
    [onValueChange],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) pick(opt.value);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5 text-left text-sm text-zinc-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className="min-w-0 flex-1 truncate">
          {selected ? selected.label : emptyLabel}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950 shadow-xl"
          role="presentation"
        >
          <div className="flex items-center gap-2 border-b border-zinc-800/60 px-2.5 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className={cn("overflow-y-auto py-1", maxListHeightClass)}
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-zinc-500">
                No matches — clear search or enter manually below.
              </li>
            ) : (
              filtered.map((opt, i) => {
                const active = opt.value === value;
                const hi = i === highlight;
                return (
                  <li key={opt.value || "__empty"}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={cn(
                        "flex w-full px-3 py-1.5 text-left text-sm",
                        hi
                          ? "bg-indigo-500/20 text-zinc-100"
                          : "text-zinc-300 hover:bg-zinc-800/60",
                        active && "font-medium text-indigo-300",
                      )}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => pick(opt.value)}
                    >
                      <span className="truncate">{opt.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
