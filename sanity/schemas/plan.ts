import { defineField, defineType } from "sanity";

export default defineType({
  name: "plan",
  title: "Plans",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 64,
      },
    }),
    defineField({
      name: "priceMonthly",
      title: "Price (per month)",
      type: "number",
      validation: (r) => r.required().min(0),
    }),
    defineField({
      name: "currency",
      title: "Currency Symbol",
      type: "string",
      initialValue: "$",
    }),
    defineField({
      name: "priceSuffix",
      title: "Price Suffix",
      type: "string",
      initialValue: " / month",
    }),
    defineField({
      name: "badge",
      title: "Badge (small note under title)",
      type: "string",
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle (one-liner under title)",
      type: "string",
    }),
    defineField({
      name: "popular",
      title: "Mark as Popular (highlighted)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "order",
      title: "Sort Order (asc)",
      type: "number",
      initialValue: 1,
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [{ type: "string" }],
      validation: (r) => r.min(1),
    }),
  ],
  preview: {
    select: { title: "title", price: "priceMonthly", popular: "popular" },
    prepare(sel) {
      return {
        title: sel.title,
        subtitle: `${sel.popular ? "⭐ Popular – " : ""}$${sel.price}/mo`,
      };
    },
  },
});
