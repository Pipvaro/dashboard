// sanity/schemas/siteSettings.ts
import { defineField, defineType } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "bannerEnabled",
      title: "Show Global Banner",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "bannerTone",
      title: "Banner Tone",
      type: "string",
      initialValue: "brand",
      options: {
        list: [
          { title: "Brand (Indigo)", value: "brand" },
          { title: "Info (Blue)", value: "info" },
          { title: "Success (Green)", value: "success" },
          { title: "Warning (Amber)", value: "warning" },
          { title: "Danger (Red)", value: "danger" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "bannerText",
      title: "Banner Text",
      type: "text",
      rows: 3,
      initialValue:
        "🚀 Welcome to Pipvaro! Your trading automation starts here. Since we are currently in beta phase some features may not be available.",
    }),
    defineField({
      name: "bannerLinkText",
      title: "Optional Link Text",
      type: "string",
    }),
    defineField({
      name: "bannerLinkUrl",
      title: "Optional Link URL",
      type: "url",
    }),
    defineField({
      name: "allowRegistration",
      title: "Allow New Registrations",
      type: "boolean",
      description:
        "If disabled, the /register page will show a notice and hide the form.",
      initialValue: true,
    }),
  ],
});
