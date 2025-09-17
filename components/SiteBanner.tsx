"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Settings = {
  bannerEnabled?: boolean;
  bannerTone?: "brand" | "info" | "success" | "warning" | "danger";
  bannerText?: string;
  bannerLinkText?: string;
  bannerLinkUrl?: string;
};

function toneClasses(tone?: Settings["bannerTone"]) {
  switch (tone) {
    case "info":
      return "bg-sky-600";
    case "success":
      return "bg-emerald-600";
    case "warning":
      return "bg-amber-600";
    case "danger":
      return "bg-rose-600";
    case "brand":
    default:
      return "bg-[#3f4bf2]";
  }
}

export default function SiteBanner() {
  const [data, setData] = useState<Settings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/site-settings", { cache: "no-store" });
        const d = await r.json();
        if (!cancelled) setData(d?.item ?? null);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fallback if settings not loaded yet: render nothing (avoids layout shift)
  if (!data || data.bannerEnabled === false) return null;

  const text =
    data.bannerText ||
    "🚀 Welcome to Pipvaro! Your trading automation starts here. Since we are currently in beta phase some features may not be available.";

  return (
    <div
      className={cn(
        toneClasses(data.bannerTone),
        "w-full py-2 px-4 text-white"
      )}
    >
      <p className="text-sm">
        {text}{" "}
        {data.bannerLinkText && data.bannerLinkUrl ? (
          <>
            {" "}
            <Link
              href={data.bannerLinkUrl}
              className="underline decoration-white/60 hover:decoration-white"
              target="_blank"
              rel="noreferrer"
            >
              {data.bannerLinkText}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
