"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Crosshair,
  Map,
  Calendar,
  Settings,
  HelpCircle,
  BarChart3,
  Telescope,
  MapPin,
  Rocket,
  History,
  Bell,
  User,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebarContext";

const mainNavItems = [
  { href: "/dashboard", label: "Tonight", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: Rocket },
  { href: "/targets", label: "Targets", icon: Crosshair },
  { href: "/skymap", label: "Sky Map", icon: Map },
  { href: "/planner", label: "Planner", icon: Calendar },
  { href: "/site-check", label: "Site Check", icon: ScanSearch },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/gear", label: "Gear", icon: Telescope },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 64;

export function LeftRail() {
  const pathname = usePathname();
  const { expanded, setExpanded } = useSidebar();

  return (
    <motion.aside
      initial={false}
      animate={{
        width: expanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED,
      }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      layout={false}
      className={cn(
        "theme-shell-rail fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden border-r border-blue-950/40 bg-[#0d1321] transition-shadow duration-200",
        expanded ? "shadow-[4px_0_24px_rgba(0,0,0,0.4)]" : "shadow-none",
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Header: icon (fixed left) | label (revealed as drawer expands) */}
      <div className="flex shrink-0 items-center gap-3 px-3 py-4">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#d25e36] text-white"
        >
          <span className="text-sm font-bold">A</span>
        </Link>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="block truncate font-display text-sm font-semibold text-white tracking-wide">
            Parallax
          </span>
          <span className="block truncate text-xs text-slate-500">
            All Missions
          </span>
        </div>
      </div>

      {/* Main navigation - icon | label, always rendered, revealed by overflow */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-2">
        {mainNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <NavItem
              key={item.href}
              href={item.href}
              icon={Icon}
              label={item.label}
              isActive={isActive}
            />
          );
        })}
      </nav>

      {/* Bottom utility section - matches main nav styling */}
      <div className="shrink-0 space-y-0.5 border-t border-blue-950/40 px-2 py-3">
        <UtilityLink href="/help" icon={HelpCircle} label="Help" />
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-slate-100"
          title="Notifications"
          aria-label="Notifications"
        >
          <span className="relative shrink-0">
            <Bell className="h-4 w-4" strokeWidth={2} />
            <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d25e36] px-0.5 text-[10px] font-medium text-white">
              2
            </span>
          </span>
          <span className="min-w-0 flex-1 truncate">Notifications</span>
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-slate-100"
          title="User"
          aria-label="User profile"
        >
          <User className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="min-w-0 flex-1 truncate">User</span>
        </button>
      </div>
    </motion.aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={cn(
        "relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-sm transition-colors",
        isActive
          ? "bg-[#d25e36]/20 text-white"
          : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100",
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[#d25e36]" />
      )}
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}

function UtilityLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/50 hover:text-slate-100"
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </Link>
  );
}
