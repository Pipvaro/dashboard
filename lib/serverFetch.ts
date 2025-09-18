import { cookies, headers } from "next/headers";

export async function masterFetch(path: string, init: RequestInit = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  // Token aus Cookie weiterreichen (gleiche Strategie wie /auth/me bei dir)
  const access = (await cookies()).get("access_token")?.value || "";
  const h = new Headers(init.headers || {});
  if (access) h.set("Authorization", `Bearer ${access}`);
  h.set("Content-Type", h.get("Content-Type") || "application/json");
  return fetch(`${base}${path}`, { ...init, headers: h, cache: "no-store" });
}
