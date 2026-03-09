"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 64;

type SidebarContextValue = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  width: number;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const width = expanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded, width }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED };
