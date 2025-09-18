"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/20/solid";
import { BanknotesIcon, InboxIcon, PaperClipIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { CalendarIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import {
  Contact,
  LayoutDashboard,
  Settings,
  SlidersVertical,
  Server,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type User = {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  subscription: string;
};

type HB = {
  status: 0 | 1 | 2 | 3;
  time: string;
  msg?: string;
  ping?: number | null;
};
type HeartbeatPayload = { heartbeatList?: Record<string, HB[]> };

// ---- kleine Badge, die periodisch den Gesamtstatus ermittelt ----
function StatusBadge() {
  const [label, setLabel] = useState("Status...");
  const [classes, setClasses] = useState({
    wrap: "bg-gray-500/20 text-gray-300",
    dot: "bg-gray-400",
    anim: "animate-pulse",
  });

  function applyStatus(statuses: number[]) {
    // 0 = DOWN, 1 = UP, 2 = PENDING, 3 = MAINTENANCE
    const hasDown = statuses.includes(0);
    const hasMaintOrPending = statuses.some((s) => s === 3 || s === 2);
    if (hasDown) {
      setLabel("Outage");
      setClasses({
        wrap: "bg-rose-200/10 text-rose-400",
        dot: "bg-rose-500",
        anim: "animate-ping",
      });
    } else if (hasMaintOrPending) {
      setLabel("Maintenance");
      setClasses({
        wrap: "bg-amber-200/10 text-amber-400",
        dot: "bg-amber-500",
        anim: "animate-ping",
      });
    } else if (statuses.length > 0) {
      setLabel("Operational");
      setClasses({
        wrap: "bg-emerald-200/10 text-emerald-400",
        dot: "bg-emerald-500",
        anim: "animate-ping",
      });
    } else {
      setLabel("Unknown");
      setClasses({
        wrap: "bg-gray-500/20 text-gray-300",
        dot: "bg-gray-400",
        anim: "animate-pulse",
      });
    }
  }

  async function load() {
    try {
      const r = await fetch("/api/status/heartbeat?limit=1", {
        cache: "no-store",
      });
      const d: HeartbeatPayload = await r.json();
      const statuses = Object.values(d.heartbeatList ?? {}).map(
        (arr) => arr[arr.length - 1]?.status ?? 0
      );
      applyStatus(statuses);
    } catch {
      applyStatus([]);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // alle 30s aktualisieren
    return () => clearInterval(t);
  }, []);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
        classes.wrap
      )}
      title="Service status"
    >
      <span
        className={cn("size-1.5 rounded-full", classes.dot, classes.anim)}
      />
      {label}
    </span>
  );
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useCurrentUser() as {
    user: User | null;
    loading: boolean;
  };
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  }

  return (
    // FIXED + immer sichtbar auf Desktop
    <aside
      className="
        hidden md:flex fixed inset-y-0 left-0 w-72
        flex-col justify-between
        border-r border-gray-700/50 bg-[#1e2122] z-40
      "
      aria-label="Sidebar"
    >
      {/* Oberer Block + scrollbarer Mittelteil */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="py-3 border-b px-4 border-gray-700/50 h-20 flex items-center justify-between shrink-0">
          <Image
            src="/assets/Transparent/logo-beta.svg"
            alt="logo"
            width={128}
            height={32}
            className="w-32"
          />
          {/* Live-Status (Uptime Kuma) */}
          <Link
            href="https://status.pipvaro.com"
            target="_blank"
            rel="noreferrer"
          >
            <div className="cursor-pointer">
              <StatusBadge />
            </div>
          </Link>
        </div>

        {/* Navigation (scrollbar nur hier, unten bleibt stehen) */}
        <nav className="px-4 pt-4 space-y-2 overflow-y-auto">
          <NavItem
            active={pathname === "/"}
            onClick={() => router.push("/")}
            icon={<LayoutDashboard className="size-4 mr-3" />}
          >
            Dashboard
          </NavItem>
          <NavItem
            active={pathname === "/accounts"}
            onClick={() => router.push("/accounts")}
            icon={<Contact className="size-4 mr-3" />}
          >
            Accounts
          </NavItem>
          <NavItem
            active={pathname === "/receivers"}
            onClick={() => router.push("/receivers")}
            icon={<SlidersVertical className="size-4 mr-3" />}
          >
            Receivers
          </NavItem>
          <div className="mt-5 mb-2 text-[10px] uppercase tracking-wider text-gray-500">
            Others
          </div>
          <NavItem
            active={pathname === "/calendar"}
            onClick={() => router.push("/calendar")}
            icon={<CalendarIcon className="size-4 mr-3" />}
          >
            Economic Calendar
          </NavItem>
          <NavItem
            active={pathname === "/news"}
            onClick={() => router.push("/news")}
            icon={<PaperClipIcon className="size-4 mr-3" />}
          >
            Changelogs & News
          </NavItem>
          <NavItem
            active={pathname === "/settings"}
            onClick={() => router.push("/settings")}
            icon={<Settings className="size-4 mr-3" />}
          >
            Settings
          </NavItem>
          {isAdmin && (
            <>
              <div className="mt-5 mb-2 text-[10px] uppercase tracking-wider text-gray-500">
                Administration
              </div>
              <NavItem
                active={pathname === "/collectors"}
                onClick={() => router.push("/collectors")}
                icon={<Server className="size-4 mr-3" />}
              >
                Collectors
              </NavItem>
              <NavItem
                active={pathname === "/logs"}
                onClick={() => router.push("/logs")}
                icon={<Server className="size-4 mr-3" />}
              >
                Logs
              </NavItem>
              <NavItem
                active={pathname === "/messages"}
                onClick={() => router.push("/messages")}
                icon={<Server className="size-4 mr-3" />}
              >
                Messages
              </NavItem>
              <NavItem
                active={pathname === "/users"}
                onClick={() => router.push("/users")}
                icon={<UserGroupIcon className="size-4 mr-3" />}
              >
                Users
              </NavItem>
              <NavItem
                active={pathname === "/rcvs"}
                onClick={() => router.push("/rcvs")}
                icon={<InboxIcon className="size-4 mr-3" />}
              >
                Receivers
              </NavItem>
              <NavItem
                active={pathname === "/accs"}
                onClick={() => router.push("/accs")}
                icon={<BanknotesIcon className="size-4 mr-3" />}
              >
                Accounts
              </NavItem>
            </>
          )}
        </nav>
      </div>

      {/* Unterer Block (Abo + Logout) – bleibt stehen */}
      <div className="border-t border-gray-700/50">
        {user?.subscription && (
          <div
            className={cn(
              "w-full px-4 py-2 flex items-center justify-between",
              user.subscription.toLowerCase() === "fusion" && "bg-gray-500/20",
              user.subscription.toLowerCase() === "lunar" && "bg-yellow-500/30",
              user.subscription.toLowerCase() === "nova" && "bg-[#3f4bf2]/30"
            )}
          >
            <span className="text-xs text-white font-medium capitalize">
              {user.subscription}{" "}
              {user.subscription.toLowerCase() === "fusion"
                ? "Plan (Free)"
                : "Plan"}
            </span>
            <Link
              href={"/billing"}
              className="text-xs text-gray-300 font-medium flex items-center gap-1 cursor-pointer hover:text-white"
            >
              <Cog6ToothIcon className="size-4 text-gray-300 animate-spin-slow" />
              Manage
            </Link>
          </div>
        )}

        <div className="px-4 py-4 flex items-center justify-between bg-gray-700/30">
          {loading ? (
            <>
              <div className="w-full pr-4">
                <div className="h-3 w-40 rounded bg-gray-600/50 animate-pulse" />
                <div className="h-3 w-56 rounded bg-gray-600/30 mt-2 animate-pulse" />
              </div>
              <div className="flex flex-col items-center justify-center text-gray-500 opacity-40">
                <ArrowLeftOnRectangleIcon className="size-6" />
                <p className="text-sm">Logout</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-white text-sm">
                  {user ? `${user.first_name} ${user.last_name}` : "Guest"}
                </p>
                <p className="text-gray-500 text-xs">{user?.email ?? ""}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex flex-col items-center justify-center text-gray-400 hover:text-white"
                aria-label="Logout"
                type="button"
              >
                <ArrowLeftOnRectangleIcon className="size-6" />
                <span className="text-sm">Logout</span>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center px-4 py-2 rounded-md transition",
        active
          ? "bg-gray-700/60 text-white"
          : "hover:bg-gray-700/40 text-gray-200"
      )}
    >
      {icon}
      <span className="font-medium text-sm">{children}</span>
    </button>
  );
}
