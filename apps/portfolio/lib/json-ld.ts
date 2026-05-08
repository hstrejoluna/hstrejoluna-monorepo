import type { Profile, Skill, Project } from "@/types/sanity";
import { normalizeSocialLinks } from "@/lib/navigation";
import { urlFor } from "@/lib/sanity";
import { blockToPlainText } from "@/lib/utils";

const SITE_URL = "https://hstrejoluna.com";
const FALLBACK_IMAGE = "/og-image.png";

interface BuildPersonJsonLdParams {
  profile: Profile | null;
  skills: Pick<Skill, "name">[];
  locale: string;
}

interface PersonJsonLd {
  "@context": "https://schema.org";
  "@type": "Person";
  name: string | undefined;
  jobTitle: string | undefined;
  description: string | undefined | null;
  url: string;
  sameAs: string[];
  knowsAbout: string[];
  image: string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
}

/**
 * Builds a JSON-LD Person structured data object.
 *
 * Extracted from page.tsx to enable pure-function testing.
 * Design contract: spec § "SEO surface", design §8.
 */
export function buildPersonJsonLd({
  profile,
  skills,
  locale,
}: BuildPersonJsonLdParams): PersonJsonLd {
  let image: string;

  if (profile?.image) {
    image = urlFor(profile.image).width(1200).height(630).url();
  } else {
    image = FALLBACK_IMAGE;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile?.name,
    jobTitle: profile?.headline,
    description: profile?.bio,
    url: SITE_URL,
    sameAs: normalizeSocialLinks(profile?.socials).map((social) => social.href),
    knowsAbout: skills.map((s) => s.name),
    image,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/${locale}`,
    },
  };
}

// --- ItemList JSON-LD ---

interface BuildProjectListJsonLdParams {
  projects: Project[];
  locale: string;
}

interface ListItemJsonLd {
  "@type": "ListItem";
  position: number;
  item: {
    "@type": "CreativeWork";
    name: string;
    url: string;
    description: string;
    image: string;
  };
}

interface ItemListJsonLd {
  "@context": "https://schema.org";
  "@type": "ItemList";
  itemListElement: ListItemJsonLd[];
}

/**
 * Builds a JSON-LD ItemList of CreativeWork entries for the project grid.
 *
 * Pure function: same input → same output. No side effects.
 * Design contract: spec § "JSON-LD ItemList", design §8.
 */
export function buildProjectListJsonLd({
  projects,
  locale,
}: BuildProjectListJsonLdParams): ItemListJsonLd {
  const itemListElement: ListItemJsonLd[] = projects.map((project, index) => {
    const path = project.slug?.current
      ? `/projects/${project.slug.current}`
      : project.micrositePath || "#";

    const image = project.image
      ? urlFor(project.image).width(1200).height(630).url()
      : FALLBACK_IMAGE;

    const description =
      project.shortDescription && project.shortDescription.length > 0
        ? project.shortDescription
        : blockToPlainText(project.description);

    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: project.title,
        url: `${SITE_URL}/${locale}${path}`,
        description,
        image,
      },
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement,
  };
}
