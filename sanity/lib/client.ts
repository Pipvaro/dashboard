import { createClient } from "@sanity/client";

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  useCdn: true, // schnell + public published content
  token: process.env.SANITY_READ_TOKEN, // nur nötig für Drafts / privat
  perspective: "published", // published content
});
