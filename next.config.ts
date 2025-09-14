import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // <— Next/Image nicht optimieren, Datei direkt ausliefern
  },
};

export default nextConfig;
