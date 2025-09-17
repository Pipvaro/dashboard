import { groq } from "next-sanity";

/** All notes we render on the /news page */
export const NOTES_QUERY = groq`*[_type == "note"] | order(releasedAt desc) {
  _id,
  title,
  type,
  version,
  releasedAt,
  highlights,
  tags,
}`;

/** Only versions from changelogs, newest first */
export const VERSIONS_QUERY = groq`*[_type == "note" && type == "changelog" && defined(version)]
  | order(releasedAt desc) {
    version,
    releasedAt
  }`;
