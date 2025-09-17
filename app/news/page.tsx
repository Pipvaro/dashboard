/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/packs/Card";
import { timeAgo } from "@/lib/format";
import {
  Megaphone,
  History as HistoryIcon,
  Search,
  Tag as TagIcon,
  Filter,
  Newspaper,
  Code2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import MobileNav from "@/components/MobileNav";
import { PaperClipIcon } from "@heroicons/react/24/outline";
import SiteBanner from "@/components/SiteBanner";

/* --------------------------------------------
   Types
--------------------------------------------- */

type ItemType = "news" | "changelog";

type Item = {
  id: string;
  type: ItemType;
  version?: string;
  date: string; // ISO
  title: string;
  body?: string;
  tags: string[];
  highlights?: string[];
};

/* --------------------------------------------
   Fallback (falls API down)
--------------------------------------------- */

const TAGS = [
  "Expert Advisor",
  "Dashboard",
  "General",
  "Collectors",
  "API",
  "Bugfix",
  "Performance",
  "Security",
] as const;

const ITEMS_FALLBACK: Item[] = [
  {
    id: "v0.7.0",
    type: "changelog",
    version: "0.7.0",
    date: "2025-09-15T18:30:00Z",
    title: "Big account analytics refresh",
    tags: ["Dashboard", "Performance"],
    highlights: [
      "New live KPIs with auto-refresh and green/red deltas",
      "Balance / Equity / Margin Level charts with smoother scales",
      "4h / 1d timeframes added to charts",
      "Faster server-side data joins for account snapshots",
    ],
  },
];

/* --------------------------------------------
   Uptime status (for banner)
--------------------------------------------- */

type KumaResponse = {
  heartbeatList?: Record<
    string,
    { status: number; time: string; msg: string; ping: number | null }[]
  >;
};

function useStatusBanner() {
  const [state, setState] = useState<"down" | "maintenance" | "ok">("ok");

  useEffect(() => {
    let t: any;
    const load = async () => {
      try {
        const r = await fetch("/api/status/heartbeat?limit=1", {
          cache: "no-store",
        });
        const d: KumaResponse = await r.json();
        let worst: number | null = null;
        const lists = d.heartbeatList || {};
        for (const k of Object.keys(lists)) {
          const s = lists[k]?.[0]?.status;
          if (typeof s === "number") {
            worst = worst === null ? s : Math.min(worst, s);
          }
        }
        if (worst === 0) setState("down");
        else if (worst === 3) setState("maintenance");
        else setState("ok");
      } catch {
        // ignore
      }
    };
    load();
    // eslint-disable-next-line prefer-const
    t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  return state;
}

/* --------------------------------------------
   Sanity fetch (über /api/news)
--------------------------------------------- */

type ApiResp = {
  ok: boolean;
  items: Item[];
  tags?: string[];
  versions?: string[];
};

function useSanityNews() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [versions, setVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const r = await fetch(`/api/news?limit=100`, { cache: "no-store" });
        const d: ApiResp = await r
          .json()
          .catch(() => ({ ok: false, items: [] }));
        if (!cancelled) {
          setItems(
            Array.isArray(d.items) && d.items.length ? d.items : ITEMS_FALLBACK
          );
          setVersions(Array.isArray(d.versions) ? d.versions : []);
        }
      } catch {
        if (!cancelled) {
          setItems(ITEMS_FALLBACK);
          setVersions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, versions, loading };
}

/* --------------------------------------------
   Page
--------------------------------------------- */

export default function NewsPage() {
  const { items, versions: apiVersions } = useSanityNews();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType | "all">("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const versionListRef = useRef<HTMLDivElement>(null);
  const status = useStatusBanner();

  const baseItems: Item[] = items ?? ITEMS_FALLBACK;

  // Version-History aus API (Fallback: aus Items ableiten)
  const versions = useMemo(() => {
    const fromApi = apiVersions && apiVersions.length ? apiVersions : null;
    if (fromApi) return fromApi;
    return Array.from(
      new Set(
        baseItems
          .filter((i) => i.type === "changelog" && i.version)
          .map((i) => i.version as string)
      )
    ).sort((a, b) => (a < b ? 1 : -1));
  }, [apiVersions, baseItems]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return baseItems
      .filter((it) => {
        if (typeFilter !== "all" && it.type !== typeFilter) return false;
        if (activeTags.length) {
          const hit = it.tags?.some((t) => activeTags.includes(t));
          if (!hit) return false;
        }
        if (!query) return true;
        const hay =
          `${it.title} ${it.body || ""} ${(it.highlights || []).join(" ")} ${(it.tags || []).join(" ")}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [q, typeFilter, activeTags, baseItems]);

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f14] overflow-x-hidden">
      <Sidebar />
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
      <main className="md:ml-72">
        <SiteBanner />
        <div className="px-6 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <PaperClipIcon className="size-5 text-indigo-400" />
                Changelogs & News
              </h1>
              <p className="text-sm text-gray-400">
                Release notes, platform updates and product announcements.
              </p>
            </div>
            <a
              href="#versions"
              onClick={(e) => {
                e.preventDefault();
                versionListRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
            >
              <HistoryIcon className="size-4" />
              Jump to version history
            </a>
          </div>

          {/* Controls */}
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative w-full md:w-1/2">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles, notes and tags…"
                  className="w-full bg-[#0f1419] text-sm text-white rounded-lg pl-9 pr-3 py-2 border border-gray-800 outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 hidden md:inline">
                  Type
                </span>
                <TypePill
                  active={typeFilter === "all"}
                  onClick={() => setTypeFilter("all")}
                  icon={<Filter className="size-4" />}
                >
                  All
                </TypePill>
                <TypePill
                  active={typeFilter === "news"}
                  onClick={() => setTypeFilter("news")}
                  icon={<Megaphone className="size-4" />}
                >
                  News
                </TypePill>
                <TypePill
                  active={typeFilter === "changelog"}
                  onClick={() => setTypeFilter("changelog")}
                  icon={<Code2 className="size-4" />}
                >
                  Changelog
                </TypePill>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-400 inline-flex items-center gap-1 mr-1">
                <TagIcon className="size-3.5" /> Tags
              </span>
              {TAGS.map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className={[
                    "px-2 py-1 rounded-md text-xs border",
                    activeTags.includes(t)
                      ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
                      : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
              {!!activeTags.length && (
                <button
                  onClick={() => setActiveTags([])}
                  className="text-xs text-gray-400 hover:text-gray-200 ml-1"
                >
                  Clear
                </button>
              )}
            </div>
          </Card>

          {/* STATUS BANNER */}
          {status !== "ok" && (
            <Link
              href="https://status.pipvaro.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Card
                className={[
                  "mt-4 border shadow-md",
                  status === "down"
                    ? "bg-[#3b0f14] border-rose-500/60 shadow-[0_0_0_1px_rgba(244,63,94,0.35)]"
                    : "bg-[#2e1b05] border-amber-500/60 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {status === "down" ? (
                    <AlertTriangle className="size-5 text-rose-300 mt-0.5 shrink-0" />
                  ) : (
                    <Wrench className="size-5 text-amber-300 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div
                      className={[
                        "font-medium",
                        status === "down" ? "text-rose-200" : "text-amber-200",
                      ].join(" ")}
                    >
                      {status === "down"
                        ? "Incident detected"
                        : "Maintenance mode"}
                    </div>
                    <p className="text-sm text-gray-100">
                      {status === "down"
                        ? "Some services are currently unavailable. Our team is currently investigating the issue. We apologize for the inconvenience."
                        : "Planned maintenance is in progress. Minor interruptions are expected. Please be patient until we are back online with full service."}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
            {/* Feed */}
            <div className="xl:col-span-2 space-y-4">
              {filtered.map((it) => (
                <ItemCard key={it.id} it={it} />
              ))}
              {!filtered.length && (
                <Card>
                  <div className="py-10 text-center text-gray-400">
                    No entries match your filters.
                  </div>
                </Card>
              )}
            </div>

            {/* Version history */}
            <div className="xl:col-span-1">
              <div ref={versionListRef} id="versions" />
              <Card>
                <div className="flex items-center gap-2 mb-3">
                  <HistoryIcon className="size-4 text-amber-400" />
                  <div className="text-white font-medium">Version history</div>
                </div>

                <div className="relative pl-10">
                  <div className="absolute left-4 top-1 bottom-1 w-px bg-gradient-to-b from-amber-400/70 via-gray-700 to-gray-700 pointer-events-none" />
                  <ol className="space-y-4">
                    {versions.map((v, idx) => {
                      const entry = baseItems.find(
                        (i) => i.type === "changelog" && i.version === v
                      );
                      const latest = idx === 0;
                      return (
                        <li key={v} className="relative pl-6">
                          <span
                            className={[
                              "absolute left-3 top-1.5 size-3 rounded-full ring-2 ring-[#0b0f14]",
                              latest
                                ? "bg-amber-400 shadow-[0_0_0_3px_rgba(245,158,11,0.25)]"
                                : "bg-gray-500",
                            ].join(" ")}
                          />
                          <a
                            href={`#${entry?.id || v}`}
                            className="text-sm text-white hover:text-amber-300 font-medium ml-2"
                          >
                            v{v}
                          </a>
                          {latest && (
                            <span className="ml-2 text-[10px] rounded px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              Latest
                            </span>
                          )}
                          <div className="text-xs text-gray-400 mt-0.5 ml-2">
                            {entry ? timeAgo(entry.date) : ""}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </Card>

              <Card className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-indigo-400" />
                  <div className="text-white font-medium">Contribute</div>
                </div>
                <p className="text-sm text-gray-400">
                  Want to suggest a note for the next release? Ping us in{" "}
                  <span className="text-indigo-300">#pipvaro-feedback</span>{" "}
                  within our discord server.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --------------------------------------------
   Components
--------------------------------------------- */

function ItemCard({ it }: { it: Item }) {
  const isNews = it.type === "news";
  const icon = isNews ? (
    <Megaphone className="size-4 text-sky-400" />
  ) : (
    <Code2 className="size-4 text-amber-400" />
  );

  return (
    <Card>
      <div id={it.id}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span
              className={[
                "text-[11px] px-2 py-0.5 rounded-full border",
                isNews
                  ? "border-sky-500/40 text-sky-300"
                  : "border-amber-500/40 text-amber-300",
              ].join(" ")}
            >
              {isNews ? "NEWS" : "CHANGELOG"}
            </span>
            {it.version && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                v{it.version}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">{timeAgo(it.date)}</div>
        </div>

        <h3 className="text-white font-medium mt-2">{it.title}</h3>
        {it.body && <p className="text-sm text-gray-300 mt-1">{it.body}</p>}

        {it.highlights && it.highlights.length > 0 && (
          <ul className="mt-3 space-y-1">
            {it.highlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-300 flex gap-2">
                <CheckCircle2 className="size-4 mt-0.5 text-emerald-400 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(it.tags || []).map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#0f1419] border border-gray-800 text-gray-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

function TypePill({
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
      className={[
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border transition",
        active
          ? "bg-indigo-500/15 border-indigo-500 text-indigo-300"
          : "bg-[#0f1419] border-gray-800 text-gray-300 hover:border-gray-700",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
