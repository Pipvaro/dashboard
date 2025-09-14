"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
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
import { ArrowLeftOnRectangleIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";

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
              <Image
                src="/assets/Transparent/logo-dash.png"
                alt="logo"
                width={128}
                height={32}
                className="w-28"
              />
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
              <Item
                active={pathname === "/settings"}
                icon={Settings}
                label="Settings"
                onClick={() => router.push("/settings")}
              />

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
