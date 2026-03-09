"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/**
 * Applies global theme (Field Mode) to the document root.
 * When Field Mode is on, sets data-theme="field" on html for full app retheme.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isFieldMode = useAppStore((s) => s.isFieldMode);

  useEffect(() => {
    const el = document.documentElement;
    if (isFieldMode) {
      el.setAttribute("data-theme", "field");
      el.classList.add("field-mode");
    } else {
      el.removeAttribute("data-theme");
      el.classList.remove("field-mode");
    }
    return () => {
      el.removeAttribute("data-theme");
      el.classList.remove("field-mode");
    };
  }, [isFieldMode]);

  return <>{children}</>;
}
