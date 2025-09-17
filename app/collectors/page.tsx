import CollectorsList from "@/components/Collectors/CollectorsList";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import SiteBanner from "@/components/SiteBanner";
import { cn } from "@/lib/utils";
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
            src={"/assets/Transparent/logo-dash.png"}
            alt="logo"
            height={100}
            width={250}
            className="w-32 md:hidden block"
          />
          <MobileNav />
        </div>
        <h1 className={cn("text-3xl font-bold px-6 pt-6 text-white")}>
          Collectors
        </h1>
        <p className="px-6 text-sm text-gray-500 pb-6">
          View and manage all the collectors connected to Pipvaro.
        </p>
        <CollectorsList />
      </main>
    </div>
  );
}
