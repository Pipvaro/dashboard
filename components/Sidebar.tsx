"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/20/solid";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import {
  Contact,
  LayoutDashboard,
  Settings,
  SlidersVertical,
  Server,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

type User = {
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
  subscription: string;
};

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
            src="/assets/Transparent/logo-dash.png"
            alt="logo"
            width={128}
            height={32}
            className="w-32"
          />
          <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-200/10 px-1.5 py-0.5 text-xs font-medium text-green-400">
            <span className="size-1.5 rounded-full bg-green-500 animate-ping" />
            Operational
          </span>
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
            <span className="text-xs text-gray-300 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
              <Cog6ToothIcon className="size-4 text-gray-300 animate-spin-slow" />
              Manage
            </span>
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
