"use client";

import React, { useState, useEffect } from "react";
import { useReducedMotion } from "@hstrejoluna/ui";
import { useActiveSection } from "@/hooks/useActiveSection";
import {
  Profile,
  Project,
  Skill,
  Experience,
  Certificate,
} from "@/types/sanity";
import { HeroSection } from "./fragments/HeroSection";
import { ExperienceOverview } from "./fragments/ExperienceOverview";
import { SkillsOverview } from "./fragments/SkillsOverview";
import { CertificatesOverview } from "./fragments/CertificatesOverview";
import { CommandNav } from "./ui/CommandNav";
import { BootSequence } from "@hstrejoluna/ui";
import { navSections, navSectionIds, streamSectionIds } from "@/lib/sections";
import type { NavSectionId, StreamSectionId } from "@/lib/sections";
import { useTranslations } from "next-intl";
import { scrollToSection } from "@/lib/navigation";

interface ObsidianStreamProps {
  profile: Profile | null;
  projects: Project[];
  skills: Skill[];
  experiences: Experience[];
  certificates: Certificate[];
  projectsContent?: React.ReactNode;
}

interface StreamSectionProps {
  id: NavSectionId;
  sectionClassName: string;
  wrapperClassName: string;
  title: string;
  countLabel: string;
  children: React.ReactNode;
}

const StreamSection = ({
  id,
  sectionClassName,
  wrapperClassName,
  title,
  countLabel,
  children,
}: StreamSectionProps) => (
  <section id={id} className={sectionClassName}>
    <div className={wrapperClassName}>
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-12 italic text-on_surface border-b border-surface_container_highest pb-4">
        {title}{" "}
        <span className="text-primary text-sm tracking-widest align-top ml-4">
          {countLabel}
        </span>
      </h2>
      {children}
    </div>
  </section>
);

const formatLabelCount = (count: number) => count.toString().padStart(2, "0");

/**
 * ScrollProgressBar — CSS-only scroll progress indicator.
 *
 * Uses `animation-timeline: scroll()` for zero-JS browsers that support it,
 * with a scroll-event-driven CSS custom property fallback for universal support.
 * Respects `prefers-reduced-motion` by rendering at full width (no animation).
 */
function ScrollProgressBar({ isReducedMotion }: { isReducedMotion: boolean }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isReducedMotion) {
      setProgress(1);
      return;
    }

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(scrollTop / docHeight, 1));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-white/5 pointer-events-none"
    >
      <div
        className="h-full bg-primary origin-left scroll-progress-fill"
        style={
          { "--scroll-progress": progress } as React.CSSProperties & {
            "--scroll-progress": number;
          }
        }
      />
    </div>
  );
}

export const ObsidianStream = ({
  profile,
  projects,
  skills,
  experiences,
  certificates,
  projectsContent,
}: ObsidianStreamProps) => {
  const tCommon = useTranslations("common");
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("nav");
  const tPortfolioGrid = useTranslations("fragments.portfolioGrid");
  const skipBootSequence = process.env.NEXT_PUBLIC_SKIP_BOOT_SEQUENCE === "1";
  const [isBooted, setIsBooted] = useState(skipBootSequence);
  const isReducedMotion = useReducedMotion();
  const isNavigationHidden = false;

  const activeId = useActiveSection<StreamSectionId>(
    streamSectionIds,
    0.4,
    isBooted,
  );

  const sectionBaseWrapperClass =
    "pt-24 md:pt-32 px-4 md:px-12 max-w-7xl mx-auto w-full";
  const compactSectionWrapperClass = `${sectionBaseWrapperClass} pb-12`;
  const fullSectionWrapperClass = `${sectionBaseWrapperClass} pb-32`;

  useEffect(() => {
    if (!isBooted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isBooted]);

  return (
    <div className="relative bg-background w-full min-h-screen font-sans overflow-x-hidden">
      {/* Boot sequence — CSS transition exit replaces AnimatePresence */}
      <div
        className={`transition-opacity duration-500 ${
          isBooted ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-hidden={isBooted}
      >
        {!isBooted && <BootSequence onComplete={() => setIsBooted(true)} />}
      </div>

      {isBooted && (
        <div className="animate-hero-fade-in">
          {/* Background name watermark — pure CSS fixed parallax.
              Replaces framer-motion useScroll+useTransform.
              Respects prefers-reduced-motion via no animation. */}
          <div
            aria-hidden="true"
            className={`fixed inset-0 z-0 flex flex-col justify-center items-center pointer-events-none select-none opacity-5 md:opacity-10 ${
              isReducedMotion ? "" : "bg-fixed-parallax"
            }`}
          >
            <span className="text-[15vw] font-black uppercase leading-none italic">
              {profile?.name || tCommon("fullName")}
            </span>
          </div>

          <CommandNav
            activeId={activeId}
            counts={{
              projects: projects.length,
              experience: experiences.length,
              certificates: certificates.length,
            }}
            socials={profile?.socials}
            hideOnScroll={isNavigationHidden}
          />

          <div className="relative z-10 flex flex-col w-full">
            <HeroSection profile={profile} />
            <StreamSection
              id="projects"
              sectionClassName="stream-section bg-surface_container_lowest"
              wrapperClassName={compactSectionWrapperClass}
              title={tNav("projects").toUpperCase()}
              countLabel={`[${formatLabelCount(projects.length)}]`}
            >
              {projectsContent}
            </StreamSection>
            <StreamSection
              id="experience"
              sectionClassName="stream-section relative bg-background"
              wrapperClassName={compactSectionWrapperClass}
              title={tBrand("experienceLog")}
              countLabel={`[${formatLabelCount(experiences.length)}]`}
            >
              <ExperienceOverview experiences={experiences} />
            </StreamSection>
            <StreamSection
              id="skills"
              sectionClassName="stream-section bg-surface_container_lowest"
              wrapperClassName={fullSectionWrapperClass}
              title={tBrand("neuralMap")}
              countLabel={`[${tPortfolioGrid("activeNodes")}: ${skills.length}]`}
            >
              <SkillsOverview skills={skills} />
            </StreamSection>
            <StreamSection
              id="certificates"
              sectionClassName="stream-section relative bg-background"
              wrapperClassName={fullSectionWrapperClass}
              title={tNav("certificates").toUpperCase()}
              countLabel={`[${formatLabelCount(certificates.length)}]`}
            >
              <CertificatesOverview certificates={certificates} />
            </StreamSection>
          </div>

          <ScrollProgressBar isReducedMotion={isReducedMotion} />
        </div>
      )}
    </div>
  );
};
