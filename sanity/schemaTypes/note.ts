import { defineField, defineType } from "sanity";
import { BulbOutlineIcon } from "@sanity/icons";

const TAGS = [
  "Expert Advisor",
  "Dashboard",
  "General",
  "API",
  "Collectors",
  "Bugfix",
  "Performance",
  "Security",
];

export default defineType({
  name: "note",
  title: "Note (News/Changelog)",
  type: "document",
  icon: BulbOutlineIcon,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "News", value: "news" },
          { title: "Changelog", value: "changelog" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
      initialValue: "news",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "version",
      title: "Version (for Changelog only)",
      type: "string",
      description: 'e.g. "v0.7.0". Leave empty for News.',
    }),
    defineField({
      name: "releasedAt",
      title: "Released at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (r) => r.required(),
    }),
    defineField({
      name: "highlights",
      title: "Highlights (bullets)",
      type: "array",
      of: [{ type: "string" }],
      description:
        "One bullet per line. These render as the green bullet list.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { list: TAGS, layout: "tags" },
    }),
    defineField({
      name: "body",
      title: "Body (optional)",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: { title: "title", type: "type", version: "version" },
    prepare: ({ title, type, version }) => ({
      title,
      subtitle:
        type === "changelog" && version ? `${version} • Changelog` : type,
    }),
  },
});
