"use client";

import { m, Variants } from "framer-motion";
import { Link as LocalizedLink } from "@/i18n/navigation";
import { normalizeSocialLinks, getProjectUrl } from "@/lib/navigation";
import { Profile, Project, Skill } from "@/types/sanity";
import { SkillsGrid } from "@/components/SkillsGrid";
import { useTranslations } from "next-intl";
import { blockToPlainText } from "@/lib/utils";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 12 },
  },
};

interface PortfolioGridProps {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
}

const buildNameParts = (name: string) => {
  const seen = new Map<string, number>();

  return name.split(" ").map((word) => {
    const count = (seen.get(word) ?? 0) + 1;
    seen.set(word, count);

    return {
      word,
      key: `${word}-${count}`,
    };
  });
};

export const PortfolioGrid = ({
  profile,
  projects,
  skills,
}: PortfolioGridProps) => {
  const t = useTranslations("fragments.portfolioGrid");
  const tCommon = useTranslations("common");
  const featuredProject = projects.find((p) => p.isFeatured);
  const otherProjects = projects.filter((p) => !p.isFeatured);
  const nameParts = buildNameParts(profile?.name ?? tCommon("fullName"));
  const socialLinks = normalizeSocialLinks(profile?.socials);

  return (
    <m.div
      className="max-w-7xl mx-auto px-4 py-12 md:py-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <m.header variants={itemVariants} className="mb-20 space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-none bg-primary/10 border border-outline_variant/10 text-primary font-mono text-label-sm uppercase tracking-widest mb-4">
          {t("status")}
        </div>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] text-white">
          {nameParts.map(({ word, key }, i) => (
            <span
              key={key}
              className={i === 0 ? "block" : "block text-brand-salmon"}
            >
              {word}
            </span>
          ))}
        </h1>
        <p className="text-2xl md:text-3xl text-gray-400 max-w-3xl font-light leading-tight">
          {profile?.headline ||
            "Software Architect specializing in Generative AI and scalable ecosystems."}
        </p>
      </m.header>

      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 auto-rows-[minmax(240px,auto)]">
        <m.div
          variants={itemVariants}
          className="md:col-span-4 lg:col-span-3 row-span-2 bento-card p-10 flex flex-col justify-end relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-salmon/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-brand-salmon/20 transition-colors duration-700" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-6">{t("about")}</h2>
            <p className="text-xl text-gray-300 leading-relaxed font-light">
              {profile?.bio ||
                "Coding at business: Elevating ecosystems with impeccable software architecture."}
            </p>
            <div className="mt-10 flex gap-6">
              {socialLinks.map((social) => (
                <a
                  key={social.kind}
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={
                    social.external ? "noopener noreferrer external" : undefined
                  }
                  className="text-white hover:text-brand-salmon transition-colors text-lg font-bold border-b-2 border-white/10 hover:border-brand-salmon pb-1"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </m.div>

        {featuredProject && (
          <m.div
            variants={itemVariants}
            whileHover={{ y: 0 }}
            className="md:col-span-2 lg:col-span-3 row-span-2 bg-surface_container_low rounded-none p-10 flex flex-col justify-between relative overflow-hidden group hover:bg-surface_container_high transition-colors"
          >
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-on_surface_variant text-label-sm font-mono uppercase tracking-widest mb-2 block">
                {t("latestWork")}
              </span>
              <h3 className="text-4xl md:text-5xl font-black text-on_surface tracking-tighter leading-none mb-6">
                {featuredProject.title}
              </h3>
              <p className="text-on_surface/80 text-lg font-medium max-w-xs">
                {blockToPlainText(featuredProject.description)}
              </p>
            </div>
            <LocalizedLink
              href={getProjectUrl(featuredProject)}
              className="relative z-10 w-fit px-8 py-4 bg-gradient-to-r from-primary to-primary_container text-on_primary shadow-[0_0_20px_var(--color-primary)] rounded-none font-bold hover:shadow-[0_0_40px_var(--color-primary)] transition-shadow"
            >
              {t("exploreProject")}
            </LocalizedLink>
          </m.div>
        )}

        <SkillsGrid skills={skills} variants={itemVariants} />

        {otherProjects.map((project) => (
          <m.div
            key={project._id}
            variants={itemVariants}
            whileHover={{ y: -5 }}
            className="md:col-span-2 lg:col-span-3 bento-card p-10 flex flex-col justify-between group"
          >
            <div>
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-brand-salmon transition-colors italic uppercase tracking-tighter">
                {project.title}
              </h3>
              <p className="text-gray-400 text-lg font-light leading-snug">
                {blockToPlainText(project.description)}
              </p>
            </div>
            <LocalizedLink
              href={getProjectUrl(project)}
              className="mt-8 text-white font-bold inline-flex items-center gap-2 hover:gap-4 transition-all"
            >
              {t("caseStudy")} <span className="text-brand-salmon">→</span>
            </LocalizedLink>
          </m.div>
        ))}
      </div>
    </m.div>
  );
};
