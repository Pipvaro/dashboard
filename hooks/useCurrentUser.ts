"use client";
import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/me").then(async (r) => {
      if (!alive) return;
      if (r.ok) {
        const d = await r.json();
        setUser(d.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
}
