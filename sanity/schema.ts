// /sanity/schema.ts
import news from "./schemas/news";
import changelog from "./schemas/changelog";
import eaRelease from "./schemas/eaRelease";

export const schema = {
  types: [news, changelog, eaRelease],
};
