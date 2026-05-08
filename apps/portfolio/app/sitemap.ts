import type { MetadataRoute } from "next";
import { cache } from "react";
import { routing } from "../i18n/routing";
import { client } from "@/lib/sanity";

interface ProjectSlug {
  slug: string;
  _updatedAt: string;
}

const getProjectSlugs = cache(async (): Promise<ProjectSlug[]> => {
  try {
    return await client.fetch<ProjectSlug[]>(
      '*[_type == "project" && defined(slug.current)]{ "slug": slug.current, _updatedAt }',
    );
  } catch {
    return [];
  }
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hstrejoluna.com";
  const lastModified = new Date();
  const locales = routing.locales;
  const paths = ["", "/privacy", "/cookies", "/legal"];
  const projectSlugs = await getProjectSlugs();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static paths per locale
  locales.forEach((locale) => {
    paths.forEach((path) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified,
        changeFrequency: "monthly" as const,
        priority: path === "" ? 1 : 0.5,
      });
    });
  });

  // Dynamic project case study paths
  projectSlugs.forEach((project) => {
    locales.forEach((locale) => {
      const projectLastMod = project._updatedAt
        ? new Date(project._updatedAt)
        : lastModified;

      const alternates: Record<string, string> = {};
      routing.locales.forEach((altLocale) => {
        if (altLocale !== locale) {
          alternates[altLocale] =
            `${baseUrl}/${altLocale}/projects/${project.slug}`;
        }
      });

      sitemapEntries.push({
        url: `${baseUrl}/${locale}/projects/${project.slug}`,
        lastModified: projectLastMod,
        changeFrequency: "monthly" as const,
        priority: 0.8,
        alternates: {
          languages: alternates,
        },
      } as MetadataRoute.Sitemap[number]);
    });
  });

  return sitemapEntries;
}
