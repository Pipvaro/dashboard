// components/skeletons/HydrationOverlay.tsx
"use client";
import { useEffect, useState } from "react";

export function HydrationOverlay() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    // Sobald hydriert, Overlay wegfaden
    const t = setTimeout(() => setVisible(false), 0);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-[#0e1117]">
      <div className="h-8 w-8 rounded-full border-2 border-gray-600 border-t-transparent animate-spin" />
    </div>
  );
}
