import CollectorsList from "@/components/Collectors/CollectorsList";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import SiteBanner from "@/components/SiteBanner";
import { cn } from "@/lib/utils";
import { BanknotesIcon, ServerIcon } from "@heroicons/react/24/outline";
import { Menu } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full h-screen flex">
      <Sidebar />
      <main className="w-full max-w-full md:ml-72">
        <SiteBanner />
        <div className="h-20 border-b md:hidden border-gray-700/50 flex justify-between items-center px-4">
          <Image
            src={"/assets/Transparent/logo-beta.svg"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>
        <div className="mb-6 ml-8 m-6">
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ServerIcon className="size-5 text-indigo-400" />
            Collectors
          </h1>
          <p className="text-sm text-gray-400">
            Have a quick overview of all the connected collectors to Pipvaro.
          </p>
        </div>
        <CollectorsList />
      </main>
    </div>
  );
}
