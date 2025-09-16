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
  Server, // für "Collectors"
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

type User = {
  first_name: string;
  last_name: string;
  email: string;
  role?: string; // <-- wichtig für Admin
  subscription: string;
};

const Sidebar = () => {
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
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="w-full max-w-1/5 h-screen border-r border-gray-700/50 hidden md:flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="py-3 border-b px-4 border-gray-700/50 h-20 flex justify-between items-center">
          <Image
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32"
          />
          <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-200 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-400/10 dark:text-green-400">
            <svg
              viewBox="0 0 6 6"
              aria-hidden="true"
              className="size-1.5 fill-green-600 dark:fill-green-600 animate-ping"
            >
              <circle r={3} cx={3} cy={3} />
            </svg>
            Operational
          </span>
        </div>

        {/* Haupt-Navigation */}
        <div className="w-full px-4 pt-4 space-y-4">
          <div
            className={cn(
              "w-full hover:bg-gray-700/50 px-4 rounded-md py-2 cursor-pointer",
              pathname === "/" && "bg-gray-700/50"
            )}
            onClick={() => router.push("/")}
          >
            <p className="text-white font-semibold text-sm flex items-center">
              <LayoutDashboard className="size-4 mr-4" />
              Dashboard
            </p>
          </div>

          <div
            className={cn(
              "w-full hover:bg-gray-700/50 px-4 rounded-md py-2 cursor-pointer",
              pathname === "/accounts" && "bg-gray-700/50"
            )}
            onClick={() => router.push("/accounts")}
          >
            <p className="text-white font-semibold text-sm flex items-center">
              <Contact className="size-4 mr-4" />
              Accounts
            </p>
          </div>

          <div
            className={cn(
              "w-full hover:bg-gray-700/50 px-4 rounded-md py-2 cursor-pointer",
              pathname === "/receivers" && "bg-gray-700/50"
            )}
            onClick={() => router.push("/receivers")}
          >
            <p className="text-white font-semibold text-sm flex items-center">
              <SlidersVertical className="size-4 mr-4" />
              Receivers
            </p>
          </div>

          <div
            className={cn(
              "w-full hover:bg-gray-700/50 px-4 rounded-md py-2 cursor-pointer",
              pathname === "/settings" && "bg-gray-700/50"
            )}
            onClick={() => router.push("/settings")}
          >
            <p className="text-white font-semibold text-sm flex items-center">
              <Settings className="size-4 mr-4" />
              Settings
            </p>
          </div>

          {/* Administration (nur Admin) */}
          {isAdmin && (
            <div className="pt-2">
              <p className="px-4 pb-2 text-[10px] uppercase tracking-wide text-gray-500">
                Administration
              </p>
              <div
                className={cn(
                  "w-full hover:bg-gray-700/50 px-4 rounded-md py-2 cursor-pointer",
                  pathname === "/collectors" && "bg-gray-700/50"
                )}
                onClick={() => router.push("/collectors")}
              >
                <p className="text-white font-semibold text-sm flex items-center">
                  <Server className="size-4 mr-4" />
                  Collectors
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: User-Info + Logout */}

      <div className="bg-gray-700/50 flex w-full flex-col items-center justify-between">
        {user?.subscription && (
          <>
            {/* Abo-Status */}
            {user.subscription.toLowerCase() == "fusion" && (
              <div className="bg-gray-500/20 w-full text-start px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-white font-medium capitalize">
                  {user.subscription} Plan
                </span>
                <div className="text-xs text-gray-300 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
                  <Cog6ToothIcon className="size-4 text-gray-300 animate-spin-slow" />
                  Manage
                </div>
              </div>
            )}
            {user.subscription.toLowerCase() == "lunar" && (
              <div className="bg-yellow-500/40 w-full text-start px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-white font-medium capitalize">
                  {user.subscription} Plan
                </span>
                <div className="text-xs text-gray-300 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
                  <Cog6ToothIcon className="size-4 text-gray-300 animate-spin-slow" />
                  Manage
                </div>
              </div>
            )}
            {user.subscription.toLowerCase() == "nova" && (
              <div className="bg-[#3f4bf2]/40 w-full text-start px-4 py-2 flex justify-between items-center">
                <span className="text-xs text-white font-medium capitalize">
                  {user.subscription} Plan
                </span>
                <div className="text-xs text-gray-300 font-medium flex items-center gap-1 cursor-pointer hover:text-white">
                  <Cog6ToothIcon className="size-4 text-gray-300 animate-spin-slow" />
                  Manage
                </div>
              </div>
            )}
          </>
        )}
        <div className="bg-gray-700/50 px-4 py-4 flex flex-row w-full items-center justify-between">
          {loading ? (
            <>
              <div className="w-full pr-4">
                <div className="h-3 w-40 rounded bg-gray-600/50 animate-pulse" />
                <div className="h-3 w-56 rounded bg-gray-600/30 mt-2 animate-pulse" />
              </div>
              <div className="flex flex-col items-center justify-center text-gray-500 opacity-40 cursor-not-allowed">
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
                  {user ? user.email : ""}
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
    </nav>
  );
};

export default Sidebar;
