"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Contact,
  SlidersVertical,
  Settings,
  Server,
  Menu as MenuIcon,
  X,
} from "lucide-react";
import { CalendarIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

/* ---------------- Status badge (same behavior as desktop) ---------------- */

type HB = {
  status: 0 | 1 | 2 | 3;
  time: string;
  msg?: string;
  ping?: number | null;
};
type HeartbeatPayload = { heartbeatList?: Record<string, HB[]> };

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
    const t = setInterval(load, 30000);
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

/* --------------------------------- MobileNav -------------------------------- */

type User = {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useCurrentUser() as {
    user: User | null;
    loading: boolean;
  };
  const isAdmin = (user?.role || "").toLowerCase() === "admin";

  // close drawer when the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
    } catch (e) {
      console.error(e);
    }
  }

  const Item = ({
    active,
    icon: Icon,
    label,
    onClick,
  }: {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    label: string;
    onClick: () => void;
  }) => (
    <button
      className={cn(
        "w-full text-left hover:bg-gray-700/50 px-4 rounded-md py-2",
        active && "bg-gray-700/50"
      )}
      onClick={onClick}
    >
      <span className="text-white font-semibold text-sm flex items-center">
        <Icon className="size-4 mr-4" />
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* Trigger */}
      <button
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
        className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-[#d3d5f0] hover:bg-gray-700/30"
      >
        <MenuIcon />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className={cn(
              "absolute left-0 top-0 h-full w-[85vw] max-w-xs bg-[#1b1e22] border-r border-gray-800",
              "shadow-xl transition-transform duration-200 ease-out",
              open ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Header */}
            <div className="h-16 border-b border-gray-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/Transparent/logo-dash.png"
                  alt="logo"
                  width={128}
                  height={32}
                  className="w-28"
                />
                {/* Live status (linked) */}
                <Link
                  href="https://status.pipvaro.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  <StatusBadge />
                </Link>
              </div>
              <button
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-300 hover:bg-gray-700/30"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Links */}
            <div className="p-4 space-y-3">
              <Item
                active={pathname === "/"}
                icon={LayoutDashboard}
                label="Dashboard"
                onClick={() => router.push("/")}
              />
              <Item
                active={pathname === "/accounts"}
                icon={Contact}
                label="Accounts"
                onClick={() => router.push("/accounts")}
              />
              <Item
                active={pathname === "/receivers"}
                icon={SlidersVertical}
                label="Receivers"
                onClick={() => router.push("/receivers")}
              />

              {/* Others */}
              <p className="px-2 pt-2 text-[10px] uppercase tracking-wide text-gray-500">
                Others
              </p>
              <Item
                active={pathname === "/calendar"}
                icon={CalendarIcon}
                label="Economic Calendar"
                onClick={() => router.push("/calendar")}
              />
              <Item
                active={pathname === "/news"}
                icon={PaperClipIcon}
                label="Changelogs & News"
                onClick={() => router.push("/news")}
              />
              <Item
                active={pathname === "/settings"}
                icon={Settings}
                label="Settings"
                onClick={() => router.push("/settings")}
              />

              {/* Admin */}
              {isAdmin && (
                <div className="pt-1">
                  <p className="px-2 pb-2 text-[10px] uppercase tracking-wide text-gray-500">
                    Administration
                  </p>
                  <Item
                    active={pathname === "/collectors"}
                    icon={Server}
                    label="Collectors"
                    onClick={() => router.push("/collectors")}
                  />
                  <Item
                    active={pathname === "/logs"}
                    icon={Server}
                    label="Logs"
                    onClick={() => router.push("/logs")}
                  />
                  <Item
                    active={pathname === "/messages"}
                    icon={Server}
                    label="Messages"
                    onClick={() => router.push("/messages")}
                  />
                  <Item
                    active={pathname === "/users"}
                    icon={Server}
                    label="Users"
                    onClick={() => router.push("/users")}
                  />
                  <Item
                    active={pathname === "/rcvs"}
                    icon={Server}
                    label="Receivers"
                    onClick={() => router.push("/rcvs")}
                  />
                  <Item
                    active={pathname === "/accs"}
                    icon={Server}
                    label="Accounts"
                    onClick={() => router.push("/accs")}
                  />
                </div>
              )}
            </div>

            {/* Bottom User / Logout */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4 flex items-center justify-between bg-[#1b1e22]">
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
                    <p className="text-white text-md">
                      {user ? `${user.first_name} ${user.last_name}` : "Guest"}
                    </p>
                    <span className="text-gray-500 text-sm">
                      {user?.email ?? ""}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center cursor-pointer hover:text-white text-gray-500"
                    aria-label="Logout"
                    type="button"
                  >
                    <ArrowLeftOnRectangleIcon className="size-6" />
                    <p className="text-sm">Logout</p>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
