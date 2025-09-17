// sanity/schemas/eaRelease.ts
import { defineType, defineField } from "sanity";
import { DownloadIcon } from "@sanity/icons";

export default defineType({
  name: "eaRelease",
  title: "EA Release",
  type: "document",
  icon: DownloadIcon,
  fields: [
    defineField({
      name: "version",
      title: "Version",
      type: "string",
      validation: (r) => r.required(),
      description: "e.g. 1.4.2",
    }),
    defineField({
      name: "file",
      title: "EA File",
      type: "file",
      options: {
        storeOriginalFilename: true,
      },
      validation: (r) => r.required(),
      description: "Upload the compiled EA (.ex5) or a .zip.",
    }),
    defineField({
      name: "active",
      title: "Active release",
      type: "boolean",
      initialValue: false,
      description:
        "If true, this version will be served by /api/ea/latest (overrides older releases).",
    }),
    defineField({
      name: "releasedAt",
      title: "Released at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "notes",
      title: "Release notes (optional)",
      type: "array",
      of: [{ type: "block" }],
    }),
  ],
  preview: {
    select: {
      title: "version",
      active: "active",
      file: "file.asset.originalFilename",
    },
    prepare({ title, active, file }) {
      return {
        title: `v${title}`,
        subtitle: `${active ? "Active • " : ""}${file || "no file"}`,
      };
    },
  },
});
