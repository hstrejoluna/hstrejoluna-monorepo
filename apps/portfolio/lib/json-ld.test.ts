import { describe, expect, it } from "vitest";
import { buildPersonJsonLd, buildProjectListJsonLd } from "./json-ld";
import type { Project } from "@/types/sanity";

const DEFAULT_PROFILE = {
  name: "Héctor Trejo Luna",
  headline: "Senior Software Architect",
  bio: "Building digital experiences",
  image: {
    asset: {
      _ref: "image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg",
      _type: "reference" as const,
    },
    alt: "Héctor Trejo Luna portrait",
  },
  socials: [
    { platform: "github", url: "https://github.com/htrejoluna" },
    { platform: "linkedin", url: "https://linkedin.com/in/htrejoluna" },
  ],
};

const DEFAULT_SKILLS = [
  { name: "React", _id: "s1" },
  { name: "TypeScript", _id: "s2" },
];

describe("buildPersonJsonLd", () => {
  describe("existing Person fields preserved", () => {
    it("includes @context and @type", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("Person");
    });

    it("includes name and jobTitle from profile", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result.name).toBe("Héctor Trejo Luna");
      expect(result.jobTitle).toBe("Senior Software Architect");
    });

    it("includes description from profile.bio", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result.description).toBe("Building digital experiences");
    });

    it("includes url set to https://hstrejoluna.com", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result.url).toBe("https://hstrejoluna.com");
    });

    it("includes sameAs from normalized social links", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result.sameAs).toContain("https://github.com/htrejoluna");
      expect(result.sameAs).toContain("https://linkedin.com/in/htrejoluna");
    });

    it("includes knowsAbout from skills", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result.knowsAbout).toContain("React");
      expect(result.knowsAbout).toContain("TypeScript");
    });
  });

  describe("new fields: image", () => {
    it("includes image field from Sanity profile image via urlFor", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result).toHaveProperty("image");
      const image = result.image as string;
      // urlFor generates a Sanity CDN URL containing the image ref
      expect(image).toContain("cdn.sanity.io");
      expect(image).toContain("2000x3000");
    });

    it("falls back to /og-image.png when profile has no image", () => {
      const result = buildPersonJsonLd({
        profile: { ...DEFAULT_PROFILE, image: undefined },
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      const image = result.image as string;
      expect(image).toBe("/og-image.png");
    });

    it("falls back when profile is null", () => {
      const result = buildPersonJsonLd({
        profile: null,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      const image = result.image as string;
      expect(image).toBe("/og-image.png");
    });
  });

  describe("new fields: mainEntityOfPage", () => {
    it("includes mainEntityOfPage with locale-aware @id", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "en",
      });

      expect(result).toHaveProperty("mainEntityOfPage");
      expect(result.mainEntityOfPage).toEqual({
        "@type": "WebPage",
        "@id": "https://hstrejoluna.com/en",
      });
    });

    it("uses es in @id when locale is es", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: DEFAULT_SKILLS,
        locale: "es",
      });

      expect(result.mainEntityOfPage).toEqual({
        "@type": "WebPage",
        "@id": "https://hstrejoluna.com/es",
      });
    });
  });

  describe("edge cases", () => {
    it("handles empty skills array", () => {
      const result = buildPersonJsonLd({
        profile: DEFAULT_PROFILE,
        skills: [],
        locale: "en",
      });

      expect(result.knowsAbout).toEqual([]);
    });

    it("handles profile with null bio", () => {
      const result = buildPersonJsonLd({
        profile: {
          name: "Test",
          headline: "Dev",
          bio: null as unknown as undefined,
          socials: [],
        },
        skills: [],
        locale: "en",
      });

      expect(result.description).toBeNull();
    });
  });
});

// --- buildProjectListJsonLd tests ---

const MOCK_PROJECTS: Project[] = [
  {
    _id: "proj-1",
    title: "Dark Kinetic Portfolio",
    slug: { current: "dark-kinetic" },
    description: "A portfolio site built with Next.js",
    shortDescription: "Next.js portfolio with SEO optimization",
    seoKeywords: ["nextjs", "portfolio", "seo"],
    category: "web",
    image: {
      asset: {
        _ref: "image-abc123-800x600-jpg",
        _type: "reference" as const,
      },
      alt: "Dark Kinetic screenshot",
    },
  },
  {
    _id: "proj-2",
    title: "Maestros del Salmón",
    slug: { current: "maestros-del-salmon" },
    description: [
      {
        _type: "block",
        children: [
          { _type: "span", text: "A culinary experience site", marks: [] },
        ],
      },
    ],
    // shortDescription intentionally undefined — tests fallback
    seoKeywords: ["food", "culinary"],
    category: "microsite",
    micrositePath: "/maestros-del-salmon",
    // image intentionally undefined — tests fallback
  },
];

describe("buildProjectListJsonLd", () => {
  describe("ItemList structure", () => {
    it("returns a valid ItemList with @context and @type", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("ItemList");
    });

    it("includes itemListElement array with correct length", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement).toHaveLength(2);
      expect(result.itemListElement[0]["@type"]).toBe("ListItem");
    });

    it("includes position starting at 1 for each ListItem", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement[0].position).toBe(1);
      expect(result.itemListElement[1].position).toBe(2);
    });
  });

  describe("CreativeWork entries", () => {
    it("includes name from project.title", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement[0].item.name).toBe(
        "Dark Kinetic Portfolio",
      );
      expect(result.itemListElement[1].item.name).toBe("Maestros del Salmón");
    });

    it("includes url with locale-aware project path via slug", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement[0].item.url).toBe(
        "https://hstrejoluna.com/en/projects/dark-kinetic",
      );
      expect(result.itemListElement[1].item.url).toBe(
        "https://hstrejoluna.com/en/projects/maestros-del-salmon",
      );
    });

    it("includes description from shortDescription when available", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement[0].item.description).toBe(
        "Next.js portfolio with SEO optimization",
      );
    });

    it("falls back to blockToPlainText when shortDescription is missing", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      // proj-2 has no shortDescription, so it falls back to Portable Text extraction
      expect(result.itemListElement[1].item.description).toBe(
        "A culinary experience site",
      );
    });

    it("includes image from Sanity CDN via urlFor when project.image exists", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      const image = result.itemListElement[0].item.image as string;
      expect(image).toContain("cdn.sanity.io");
      expect(image).toContain("abc123");
    });

    it("uses fallback image when project has no image", () => {
      const result = buildProjectListJsonLd({
        projects: [
          {
            _id: "proj-3",
            title: "No Image Project",
            slug: { current: "no-image" },
            description: "No image available",
          },
        ],
        locale: "en",
      });

      const image = result.itemListElement[0].item.image as string;
      expect(image).toBe("/og-image.png");
    });
  });

  describe("edge cases", () => {
    it("handles empty projects array", () => {
      const result = buildProjectListJsonLd({
        projects: [],
        locale: "en",
      });

      expect(result["@context"]).toBe("https://schema.org");
      expect(result["@type"]).toBe("ItemList");
      expect(result.itemListElement).toEqual([]);
    });

    it("uses es locale in URLs when locale is es", () => {
      const result = buildProjectListJsonLd({
        projects: [MOCK_PROJECTS[0]],
        locale: "es",
      });

      expect(result.itemListElement[0].item.url).toBe(
        "https://hstrejoluna.com/es/projects/dark-kinetic",
      );
    });

    it("falls back to micrositePath when slug is missing", () => {
      const result = buildProjectListJsonLd({
        projects: [
          {
            _id: "proj-4",
            title: "Microsite Only",
            description: "Microsite project",
            micrositePath: "/custom-path",
          },
        ],
        locale: "en",
      });

      expect(result.itemListElement[0].item.url).toBe(
        "https://hstrejoluna.com/en/custom-path",
      );
    });

    it("handles project with empty string shortDescription", () => {
      const result = buildProjectListJsonLd({
        projects: [
          {
            _id: "proj-5",
            title: "Empty Short Desc",
            slug: { current: "empty-desc" },
            description: [
              {
                _type: "block",
                children: [
                  { _type: "span", text: "Long form description", marks: [] },
                ],
              },
            ],
            shortDescription: "",
          },
        ],
        locale: "en",
      });

      // Empty string is falsy, so should fall back to blockToPlainText
      expect(result.itemListElement[0].item.description).toBe(
        "Long form description",
      );
    });

    it("includes @type CreativeWork on each item", () => {
      const result = buildProjectListJsonLd({
        projects: MOCK_PROJECTS,
        locale: "en",
      });

      expect(result.itemListElement[0].item["@type"]).toBe("CreativeWork");
      expect(result.itemListElement[1].item["@type"]).toBe("CreativeWork");
    });
  });
});
