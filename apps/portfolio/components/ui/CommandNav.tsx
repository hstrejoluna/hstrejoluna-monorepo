"use client";

import { useMemo } from "react";
import { LiquidNav } from "@hstrejoluna/ui";
import { useReducedMotion } from "@hstrejoluna/ui";
import { normalizeSocialLinks, scrollToSection } from "@/lib/navigation";
import { navSectionIds, navSections } from "@/lib/sections";
import type { NavSectionId, StreamSectionId } from "@/lib/sections";
import type { ProfileSocialLink } from "@/types/sanity";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./LocaleSwitcher";

interface CommandNavCounts {
  projects: number;
  experience: number;
  certificates: number;
}

interface CommandNavProps {
  activeId: StreamSectionId | "";
  counts: CommandNavCounts;
  socials?: ProfileSocialLink[];
  hideOnScroll?: boolean;
}

const formatCount = (value: number): string =>
  value.toString().padStart(2, "0");

const resolveLabel = (
  activeId: string,
  counts: CommandNavCounts,
  labels: any,
): string => {
  if (!activeId) return labels.initializing;
  if (activeId === "hero") return labels.systemOnline;
  if (activeId === "projects")
    return `${labels.projectsPrefix} [${formatCount(counts.projects)}]`;
  if (activeId === "experience")
    return `${labels.experiencePrefix} [${formatCount(counts.experience)}]`;
  if (activeId === "skills") return labels.skills;
  if (activeId === "certificates")
    return `${labels.certificatesPrefix} [${formatCount(counts.certificates)}]`;
  return activeId.toUpperCase();
};

export const CommandNav = ({
  activeId,
  counts,
  socials,
  hideOnScroll = false,
}: CommandNavProps) => {
  const tBrand = useTranslations("brand");
  const tNav = useTranslations("nav");
  const isReducedMotion = useReducedMotion();
  const socialLinks = useMemo(() => normalizeSocialLinks(socials), [socials]);

  const handleSectionNavigation = (sectionId: string) => {
    if (!navSectionIds.includes(sectionId as NavSectionId)) {
      return;
    }

    scrollToSection({
      id: sectionId as NavSectionId,
      reducedMotion: isReducedMotion,
    });
  };

  const statusLabel = resolveLabel(activeId, counts, {
    initializing: tBrand("initializing"),
    systemOnline: tBrand("systemOnline"),
    projectsPrefix: tNav("projects").toUpperCase(),
    experiencePrefix: tNav("experience").toUpperCase(),
    skills: tBrand("neuralMap"),
    certificatesPrefix: tNav("certificates").toUpperCase(),
  });

  return (
    <LiquidNav
      activeId={activeId}
      sections={navSections}
      socials={socialLinks}
      hideOnScroll={hideOnScroll}
      onSectionNavigate={handleSectionNavigation}
      statusLabel={statusLabel}
      labels={{
        menu: tBrand("menu") || "Menu",
        close: tBrand("close") || "Close",
        socialHeading: tBrand("socialHeading") || "Social",
      }}
    >
      <LocaleSwitcher />
    </LiquidNav>
  );
};
