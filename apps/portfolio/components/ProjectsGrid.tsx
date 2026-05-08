import type { Project } from "@/types/sanity";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { urlFor } from "@/lib/sanity";
import { blockToPlainText } from "@/lib/utils";

export interface ProjectsGridProps {
  projects: Project[];
  locale: string;
}

/**
 * Async Server Component: semantic project grid with SEO-ready HTML.
 *
 * Renders a CSS Grid of `<article>` cards with `<h3>`, `<p>`,
 * `next/image`, and `next/link` to `/projects/[slug]`.
 * Zero client JS required — all content in SSR HTML.
 *
 * Design contract: spec § "Server-Rendered Semantic Grid", design §11.
 */
export async function ProjectsGrid({ projects, locale }: ProjectsGridProps) {
  const t = await getTranslations({ locale, namespace: "projectsGrid" });

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0">
      {projects
        .filter((project) => project.slug?.current)
        .map((project) => {
          const description =
            project.shortDescription && project.shortDescription.length > 0
              ? project.shortDescription
              : blockToPlainText(project.description);

          const imageAlt = project.image?.alt ?? project.title;

          return (
            <li key={project._id} className="m-0 p-0">
              <Link
                href={`/projects/${project.slug!.current}`}
                className="no-underline group block h-full"
              >
                <article className="relative flex flex-col h-full bg-surface_container_lowest rounded-xl overflow-hidden border border-surface_container_highest transition-shadow duration-300 motion-safe:hover:shadow-lg motion-safe:hover:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-surface_container_lowest">
                  {project.image ? (
                    <div className="relative aspect-video overflow-hidden bg-surface_container_low">
                      <Image
                        src={urlFor(project.image).url()}
                        alt={imageAlt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="aspect-video bg-gradient-to-br from-surface_container_low to-surface_container_lowest flex items-center justify-center"
                    >
                      <span className="text-on_surface_variant text-sm font-mono">
                        {project.title}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-5 gap-3">
                    <h3 className="text-lg font-bold tracking-tight text-on_surface group-hover:text-primary transition-colors duration-200 m-0">
                      {project.title}
                    </h3>

                    <p className="text-sm text-on_surface_variant leading-relaxed flex-1 m-0">
                      {description}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider motion-safe:group-hover:gap-3 transition-all duration-200">
                      {t("viewCaseStudy")}
                      <span aria-hidden="true" className="text-primary/70">
                        →
                      </span>
                    </span>
                  </div>
                </article>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
