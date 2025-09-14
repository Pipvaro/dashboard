"use client";

import Card from "@/components/packs/Card";
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
      <main className="w-full max-w-full md:max-w-4/5">
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <Menu className="text-[#d3d5f0] hover:bg-gray-700/30 rounded-full block md:hidden" />
        </div>
        {/* Content */}
        <h1
          className={cn(
            "text-3xl font-bold px-6 pt-6",
            pathname === "/accounts" ? "text-white" : "text-gray-300"
          )}
        >
          Accounts
        </h1>
        <p className="px-6 text-sm text-gray-500 pb-6">Accounts will be automatically imported and detected by using our receiver.</p>
        <div className="px-6">
          <Card>Test</Card>
        </div>
      </main>
    </div>
  );
}
