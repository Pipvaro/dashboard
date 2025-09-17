// /sanity/schemas/changelog.ts
import { TAG_OPTIONS } from "./shared";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "changelog",
  title: "Changelog",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({ name: "version", type: "string", description: "e.g. 0.7.0" }),
    defineField({
      name: "date",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "highlights",
      title: "Highlights (bullets)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "tags",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
        list: TAG_OPTIONS.map((t) => ({ title: t, value: t })),
      },
    }),
  ],
  orderings: [{
    name: "dateDesc", by: [{ field: "date", direction: "desc" }],
    title: ""
  }],
  preview: {
    select: { title: "title", subtitle: "version" },
    prepare: (sel) => ({
      title: sel.title,
      subtitle: sel.subtitle ? `v${sel.subtitle}` : "",
    }),
  },
});
