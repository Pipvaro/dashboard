"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

// Keep Studio on the Node.js runtime; do not export `revalidate`/`dynamic` here.
export const runtime = "nodejs";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
