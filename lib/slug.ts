// lib/slug.ts
export const slugify = (x?: string | null) =>
  String(x || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
