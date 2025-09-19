export async function apiFetch(input: RequestInfo, init?: RequestInit) {
  // always include cookies; never cache
  const first = await fetch(input, {
    ...init,
    credentials: "include",
    cache: "no-store",
  });

  if (first.status !== 401) return first;

  // try silent refresh
  const rr = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!rr.ok) return first; // still 401 -> caller decides (e.g., show login)

  // retry original request
  return fetch(input, { ...init, credentials: "include", cache: "no-store" });
}
