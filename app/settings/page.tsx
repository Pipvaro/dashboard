"use client";

import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:ml-72">
        <div className="bg-[#3f4bf2] w-full py-2 px-4 text-white">
          <p className="text-sm">
            🚀 Welcome to Pipvaro! Your trading automation starts here.{" "}
            <strong>
              Since we are currently in beta phase some features may not be
              available.
            </strong>{" "}
            We are currently on <strong>Version 0.0.5</strong>
          </p>
        </div>
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>
        {/* Content */}
      </main>
    </div>
  );
}
