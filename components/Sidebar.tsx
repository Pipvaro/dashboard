import { cn } from "@/lib/utils";
import { Contact, LayoutDashboard, Settings, SlidersVertical } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import React from "react";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <nav className="w-full max-w-1/5 h-screen border-r border-gray-700/50 hidden md:block">
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
      <div className="w-full h-full px-4 pt-4 space-y-4">
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
      </div>
    </nav>
  );
};

export default Sidebar;
