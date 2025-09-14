"use client";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({
  className = "",
}: {
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    try {
      setLoading(true);
      await fetch("/api/logout", { method: "POST" });
      // optional: next param, damit man zurück könnte
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
      variant="secondary"
    >
      {loading ? "Signing out..." : "Logout"}
    </Button>
  );
}
