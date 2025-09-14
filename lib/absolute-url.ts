import { headers } from "next/headers";

export async function absoluteUrl(path: string = "/") {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const base = `${proto}://${host}`;
  return path.startsWith("/") ? base + path : `${base}/${path}`;
}
