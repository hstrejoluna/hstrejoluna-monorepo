import type { NavSectionId } from "@/lib/sections";
import type { ProfileSocialLink, Project } from "@/types/sanity";

export interface NavigationSocialLink {
  kind: "github" | "linkedin" | "email";
  href: string;
  label: string;
  external: boolean;
}

export interface ScrollToSectionOptions {
  id: NavSectionId;
  reducedMotion: boolean;
}

const supportedPlatforms = new Set<NavigationSocialLink["kind"]>([
  "github",
  "linkedin",
  "email",
]);

const defaultLabels: Record<NavigationSocialLink["kind"], string> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  email: "Email",
};

const platformPriority: Record<NavigationSocialLink["kind"], number> = {
  github: 1,
  linkedin: 2,
  email: 3,
};

const emailRegex = /\S+@\S+\.\S+/;

const normalizePlatform = (platform?: string): NavigationSocialLink["kind"] | null => {
  if (!platform) {
    return null;
  }

  const normalized = platform.toLowerCase().trim();
  if (!supportedPlatforms.has(normalized as NavigationSocialLink["kind"])) {
    return null;
  }

  return normalized as NavigationSocialLink["kind"];
};

const normalizeEmailToHref = (value?: string): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const email = trimmed.startsWith("mailto:")
    ? trimmed.slice("mailto:".length).trim()
    : trimmed;
  if (!emailRegex.test(email)) {
    return null;
  }

  return `mailto:${email}`;
};

export const normalizeSocialLinks = (
  socials?: ProfileSocialLink[]
): NavigationSocialLink[] => {
  if (!socials?.length) {
    return [];
  }

  const links = socials
    .map((social, index) => {
      const kind = normalizePlatform(social.platform);
      if (!kind) {
        return null;
      }

      const href =
        kind === "email"
          ? normalizeEmailToHref(social.email ?? social.url)
          : social.url?.trim() ?? null;
      if (!href) {
        return null;
      }

      const isExternalHttp = /^https?:\/\//i.test(href);
      const order = typeof social.order === "number" ? social.order : Number.MAX_SAFE_INTEGER;

      return {
        kind,
        href,
        label: social.label?.trim() || defaultLabels[kind],
        external: isExternalHttp,
        order,
        index,
      };
    })
    .filter((link): link is NonNullable<typeof link> => Boolean(link))
    .sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      const platformDelta = platformPriority[a.kind] - platformPriority[b.kind];
      if (platformDelta !== 0) {
        return platformDelta;
      }

      return a.index - b.index;
    });

  const deduped = new Map<NavigationSocialLink["kind"], NavigationSocialLink>();
  links.forEach((link) => {
    if (!deduped.has(link.kind)) {
      deduped.set(link.kind, {
        kind: link.kind,
        href: link.href,
        label: link.label,
        external: link.external,
      });
    }
  });

  return [...deduped.values()];
};

export const scrollToSection = ({ id, reducedMotion }: ScrollToSectionOptions): boolean => {
  if (typeof document === "undefined") {
    return false;
  }

  const target = document.getElementById(id);
  if (!target) {
    return false;
  }

  target.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });

  if (typeof window !== "undefined") {
    const hash = `#${id}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash);
    }
  }

  return true;
};

export const getProjectUrl = (project: Project): string => {
  if (project.slug?.current) {
    return `/projects/${project.slug.current}`;
  }
  if (project.micrositePath) {
    return project.micrositePath;
  }
  return project.externalLink || "#";
};
