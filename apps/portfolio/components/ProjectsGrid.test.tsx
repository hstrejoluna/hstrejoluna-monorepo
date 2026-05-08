/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/types/sanity";

// Mock next-intl/server (getTranslations — async, used in RSC)
vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string) => {
      const messages: Record<string, string> = {
        viewCaseStudy: "View Case Study",
      };
      return messages[key] ?? key;
    }),
}));

// Mock next/link — render as plain <a> for assertions
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock next/image — render as simple <img> with meaningful alt assertions
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

import { ProjectsGrid } from "./ProjectsGrid";

const MOCK_PROJECTS: Project[] = [
  {
    _id: "proj-1",
    title: "Dark Kinetic Portfolio",
    slug: { current: "dark-kinetic" },
    description: [
      {
        _type: "block",
        children: [
          {
            _type: "span",
            text: "A portfolio site built with Next.js and Sanity",
            marks: [],
          },
        ],
      },
    ],
    shortDescription: "Next.js portfolio with SEO optimization",
    seoKeywords: ["nextjs", "portfolio", "seo"],
    category: "web",
    image: {
      asset: { _ref: "image-abc123-800x600-jpg", _type: "reference" as const },
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
    // shortDescription intentionally undefined — tests fallback to blockToPlainText
    seoKeywords: ["food", "culinary"],
    category: "microsite",
    // image intentionally undefined — tests alt fallback
  },
];

describe("ProjectsGrid — SSR semantic rendering", () => {
  it("renders a <ul> as the grid container", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list.tagName).toBe("UL");
  });

  it("renders one <li> per project", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
  });

  it("renders each project card as an <article>", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(2);
  });

  it("renders <h3> with project title inside each card", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    // Title appears in both <h3> and (for projects without image) in placeholder <span>
    expect(screen.getByText("Dark Kinetic Portfolio")).toBeInTheDocument();
    expect(
      screen.getAllByText("Maestros del Salmón").length,
    ).toBeGreaterThanOrEqual(1);

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("Dark Kinetic Portfolio");
    expect(headings[1]).toHaveTextContent("Maestros del Salmón");
  });

  it("renders shortDescription as <p> when available", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    expect(
      screen.getByText("Next.js portfolio with SEO optimization"),
    ).toBeInTheDocument();
  });

  it("falls back to blockToPlainText when shortDescription is undefined", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    expect(screen.getByText("A culinary experience site")).toBeInTheDocument();
  });

  it("renders next/image with alt text from Sanity", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const images = screen.getAllByRole("img");
    // proj-1 has an image with alt, proj-2 has no image
    const projectImage = images.find((img) =>
      img.getAttribute("alt")?.includes("Dark Kinetic"),
    );
    expect(projectImage).toBeInTheDocument();
    expect(projectImage).toHaveAttribute("alt", "Dark Kinetic screenshot");
  });

  it("renders a link with href pointing to /projects/[slug]", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const link = screen.getByRole("link", { name: /Dark Kinetic/ });
    expect(link).toHaveAttribute("href", "/projects/dark-kinetic");
  });

  it("renders i18n 'View Case Study' text inside each card link", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    const caseStudyLinks = screen.getAllByText("View Case Study");
    expect(caseStudyLinks).toHaveLength(2);
  });

  it("renders gracefully with empty projects array", async () => {
    const element = await ProjectsGrid({
      projects: [],
      locale: "en",
    });
    render(element);

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("uses prefers-reduced-motion media query via CSS", async () => {
    const { container } = render(
      await ProjectsGrid({ projects: MOCK_PROJECTS, locale: "en" }),
    );

    const cards = Array.from(container.querySelectorAll("article"));
    expect(cards).toHaveLength(2);

    const motionSafeElements = cards.flatMap((card) => {
      const elements = [card, ...Array.from(card.querySelectorAll("*"))];
      return elements.filter((element) =>
        /\bmotion-safe:[^\s]+\b/.test(element.className),
      );
    });

    expect(motionSafeElements.length).toBeGreaterThan(0);
  });
});

describe("ProjectsGrid — link behavior", () => {
  it("each card has exactly one primary link to project case study", async () => {
    const element = await ProjectsGrid({
      projects: MOCK_PROJECTS,
      locale: "en",
    });
    render(element);

    // Each card has one link: "View Case Study" + title/h3 wrapping
    const allLinks = screen.getAllByRole("link");
    // 2 cards, each with a primary link
    expect(
      allLinks.filter((l) => l.getAttribute("href")?.startsWith("/projects/")),
    ).toHaveLength(2);
  });

  it("card links do NOT point to externalLink or micrositePath", async () => {
    const micrositeProject: Project = {
      _id: "proj-3",
      title: "Microsite Project",
      slug: { current: "micro-site" },
      description: "A microsite",
      externalLink: "https://external.example.com",
      micrositePath: "/maestros-del-salmon",
    };

    const element = await ProjectsGrid({
      projects: [micrositeProject],
      locale: "en",
    });
    render(element);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/micro-site");
    expect(link).not.toHaveAttribute("href", "https://external.example.com");
    expect(link).not.toHaveAttribute("href", "/maestros-del-salmon");
  });
});

describe("ProjectsGrid — sans-JS rendering", () => {
  it("all content is present in server-rendered HTML (no client interactivity required)", async () => {
    // Test that content is present without JS: all text and links are in DOM
    const { container } = render(
      await ProjectsGrid({ projects: MOCK_PROJECTS, locale: "en" }),
    );

    const html = container.innerHTML;
    expect(html).toContain("Dark Kinetic Portfolio");
    expect(html).toContain("Maestros del Salmón");
    expect(html).toContain("Next.js portfolio with SEO optimization");
    expect(html).toContain("A culinary experience site");
    expect(html).toContain("/projects/dark-kinetic");
    expect(html).toContain("/projects/maestros-del-salmon");
    expect(html).toContain("View Case Study");

    // No framer-motion attributes, no client state attributes
    expect(html).not.toContain("framer-motion");
    expect(html).not.toContain("aria-expanded");
  });
});
