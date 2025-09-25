import { groq } from "next-sanity";

/** Kombinierte Liste aus News + Changelogs, neueste zuerst */
export const RELEASE_ITEMS_QUERY = groq`
*[_type in ["news","changelog"]]
| order(date desc) {
  _id,
  _type,
  "id": coalesce(slug.current, _id),
  title,
  date,
  version,
  highlights,
  tags,
  body
}
`;

/** Alle verwendeten Tags (unique, alphabetisch) */
export const TAGS_QUERY = groq`
array::unique(*[_type in ["news","changelog"]].tags[]) | order(@ asc)
`;

/** Nur Changelog-Versionen (wir deduplizieren später im Code) */
export const CHANGELOGS_QUERY = groq`
*[_type == "changelog" && defined(version)]
| order(date desc){ version, _id, date }
`;

export const EA_LATEST_QUERY = groq`
*[_type == "eaRelease"]
| order(active desc, releasedAt desc)[0]{
  version,
  "assetUrl": file.asset->url,
  "filename": file.asset->originalFilename
}
`;

export const SITE_SETTINGS_QUERY = groq`*[_type == "siteSettings"][0]{
  bannerEnabled,
  bannerTone,
  bannerText,
  bannerLinkText,
  bannerLinkUrl,
  allowRegistration,
  allowNewRegistrations
}`;

export const PLANS_QUERY = groq`*[_type == "plan"] | order(coalesce(order, 999) asc) {
  _id,
  title,
  "slug": slug.current,
  priceMonthly,
  currency,
  priceSuffix,
  badge,
  subtitle,
  popular,
  order,
  features
}`;