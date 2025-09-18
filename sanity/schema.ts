// /sanity/schema.ts
import news from "./schemas/news";
import changelog from "./schemas/changelog";
import eaRelease from "./schemas/eaRelease";
import siteSettings from "./schemas/siteSettings";
import plan from "./schemas/plan";

export const schema = {
  types: [news, changelog, eaRelease, siteSettings, plan],
};
