// /sanity/schemas/news.ts
import { TAG_OPTIONS } from "./shared";
import { defineField, defineType } from "sanity";

export default defineType({
  name: "news",
  title: "News",
  type: "document",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "slug", type: "slug", options: { source: "title" } }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "text",
      rows: 5,
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
  preview: { select: { title: "title", subtitle: "date" } },
});
