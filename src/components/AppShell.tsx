"use client";

import { LeftRail } from "./LeftRail";
import { TopBar } from "./TopBar";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";
import { SidebarProvider } from "@/lib/sidebarContext";
import { SIDEBAR_WIDTH_COLLAPSED } from "@/lib/sidebarContext";

function AppShellInner({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-zinc-100">
      <LeftRail />
      <div
        className="min-h-screen"
        style={{ marginLeft: SIDEBAR_WIDTH_COLLAPSED }}
      >
        <TopBar />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <SidebarProvider>
          <AppShellInner>{children}</AppShellInner>
        </SidebarProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
