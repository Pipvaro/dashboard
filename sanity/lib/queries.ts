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
