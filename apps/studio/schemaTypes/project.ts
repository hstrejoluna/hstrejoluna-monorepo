import { defineField, defineType } from "sanity";

export default defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug (URL path)",
      type: "slug",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Short Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "content",
      title: "Full Case Study Content",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "string",
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
    }),
    defineField({
      name: "gallery",
      title: "Project Gallery",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alternative Text",
              type: "string",
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
    }),
    defineField({
      name: "image",
      title: "Project Image / Mockup",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "alt",
          title: "Alternative Text",
          type: "string",
          validation: (Rule) => Rule.required(),
        },
      ],
    }),
    defineField({
      name: "isFeatured",
      title: "Featured Project",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "techStack",
      title: "Tech Stack",
      type: "array",
      of: [{ type: "reference", to: [{ type: "skill" }] }],
    }),
    defineField({
      name: "micrositePath",
      title: "Microsite Path (e.g., /maestros-del-salmon)",
      type: "string",
    }),
    defineField({
      name: "shortDescription",
      title: "SEO Short Description",
      description:
        "Plain-text summary for SEO and card previews (max 200 characters). Falls back to Short Description field if empty.",
      type: "string",
      validation: (Rule) => Rule.max(200),
    }),
    defineField({
      name: "seoKeywords",
      title: "SEO Keywords",
      description: "Relevant keywords for search engine optimization.",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "category",
      title: "Project Category",
      description: "Category for grouping projects in the grid.",
      type: "string",
    }),
    defineField({
      name: "externalLink",
      title: "External Link (Live/GitHub)",
      type: "url",
    }),
  ],
});
