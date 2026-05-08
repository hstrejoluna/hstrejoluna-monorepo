/** @vitest-environment jsdom */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProjectPage, { generateMetadata } from "./page";

// Mock next-intl server functions
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: vi.fn(async ({ namespace }) => {
    const messages: any = {
      "fragments.project": {
        home: "Home",
        projects: "Projects",
        role: "Role",
        year: "Year",
        visitSite: "Visit Live Site",
        viewGitHub: "View on GitHub",
      },
      common: { fullName: "Test Author" },
      seo: { title: "Portfolio" },
    };
    return (key: string) => messages[namespace]?.[key] || key;
  }),
}));

// Mock Sanity client and helpers
vi.mock("@/lib/sanity", () => ({
  client: {
    fetch: vi.fn(),
  },
  urlFor: () => ({
    url: () => "https://sanity.io/image.png",
  }),
}));

// Mock child components
vi.mock("@/components/Breadcrumbs", () => ({
  Breadcrumbs: ({ items }: any) => (
    <nav data-testid="breadcrumbs">
      {items.map((i: any) => (
        <span key={i.label}>{i.label}</span>
      ))}
    </nav>
  ),
}));

vi.mock("@hstrejoluna/ui", () => ({
  TelemetryHUD: ({ identifier }: any) => (
    <div data-testid="telemetry-hud">{identifier}</div>
  ),
  LiquidGlass: ({
    as: As = "div",
    variant,
    intensity,
    children,
    className,
    ...rest
  }: any) => (
    <As
      data-lg-variant={variant}
      data-lg-intensity={intensity}
      className={className}
      {...rest}
    >
      {children}
    </As>
  ),
}));

// Mock safeJsonLd
vi.mock("@/lib/safe-json-ld", () => ({
  safeJsonLd: (data: any) => JSON.stringify(data),
}));

// Mock blockToPlainText for generateMetadata tests
vi.mock("@/lib/utils", () => ({
  blockToPlainText: vi.fn(),
}));

const mockProject: any = {
  _id: "123",
  title: "Test Project",
  slug: { current: "test-project" },
  description: [{ _type: "block", children: [{ text: "Short desc" }] }],
  content: [{ _type: "block", children: [{ text: "Long case study" }] }],
  year: "2024",
  role: "Lead Architect",
  externalLink: "https://github.com/hstrejoluna/test",
  techStack: [{ _id: "s1", name: "Next.js" }],
  image: { asset: { _ref: "img-main", _type: "reference" as const } },
  gallery: [{ asset: { _ref: "img-1", _type: "reference" as const } }],
};

import { client } from "@/lib/sanity";
import { blockToPlainText } from "@/lib/utils";

describe("ProjectPage — Dynamic Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (client.fetch as any).mockResolvedValue(mockProject);
  });

  it("renders project header with title, role, and year", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    render(Page);

    expect(
      screen.getByRole("heading", { level: 1, name: "Test Project" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Lead Architect")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders specialized GitHub link when external link points to github.com", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    render(Page);

    expect(screen.getByText("View on GitHub")).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: /github.com\/hstrejoluna\/test/i,
    });
    expect(link).toHaveAttribute("href", "https://github.com/hstrejoluna/test");
    expect(link).toHaveAttribute("rel", "noopener noreferrer external");
  });

  it("includes correct SoftwareSourceCode JSON-LD for the project", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    const { container } = render(Page);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).toBeInTheDocument();

    const jsonLd = JSON.parse(script?.innerHTML || "{}");
    expect(jsonLd["@type"]).toContain("SoftwareSourceCode");
    expect(jsonLd.name).toBe("Test Project");
    expect(jsonLd.codeRepository).toBe("https://github.com/hstrejoluna/test");
  });

  it("renders the case-study aside via <LiquidGlass variant='panel'> (REQ-7 S7.2)", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    const { container } = render(Page);

    const panel = container.querySelector("aside [data-lg-variant='panel']");
    expect(panel).not.toBeNull();
  });

  it("renders case-study image frames via <LiquidGlass variant='panel'> (REQ-7 S7.2)", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    const { container } = render(Page);

    const panels = container.querySelectorAll(
      "section [data-lg-variant='panel']",
    );
    expect(panels.length).toBeGreaterThanOrEqual(2);
  });

  it("does not use raw `backdrop-blur` Tailwind utilities on the page (REQ-7 S7.1)", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    const { container } = render(Page);

    const offenders = container.querySelectorAll("[class*='backdrop-blur']");
    expect(offenders.length).toBe(0);
  });

  it("renders Breadcrumbs with correct trace", async () => {
    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const Page = await ProjectPage({ params });
    render(Page);

    const breadcrumbs = screen.getByTestId("breadcrumbs");
    expect(breadcrumbs).toHaveTextContent("Home");
    expect(breadcrumbs).toHaveTextContent("Projects");
    expect(breadcrumbs).toHaveTextContent("Test Project");
  });
});

describe("generateMetadata — SEO description resolution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers shortDescription over blockToPlainText when shortDescription is non-empty", async () => {
    const projectWithShortDesc = {
      ...mockProject,
      shortDescription: "A custom SEO description for search results",
      description: [{ _type: "block", children: [{ text: "Full body text" }] }],
    };
    (client.fetch as any).mockResolvedValue(projectWithShortDesc);

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe(
      "A custom SEO description for search results",
    );
    // blockToPlainText must NOT have been called since shortDescription was used
    expect(blockToPlainText).not.toHaveBeenCalled();
  });

  it("falls back to blockToPlainText(description) when shortDescription is null", async () => {
    const projectWithoutShortDesc = {
      ...mockProject,
      shortDescription: null,
      description: [
        { _type: "block", children: [{ text: "Full body text for fallback" }] },
      ],
    };
    (client.fetch as any).mockResolvedValue(projectWithoutShortDesc);
    vi.mocked(blockToPlainText).mockReturnValue("Full body text for fallback");

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe("Full body text for fallback");
    expect(blockToPlainText).toHaveBeenCalledWith(
      projectWithoutShortDesc.description,
    );
  });

  it("falls back to blockToPlainText(description) when shortDescription is undefined", async () => {
    const projectWithoutShortDesc = {
      ...mockProject,
      shortDescription: undefined,
      description: [
        {
          _type: "block",
          children: [{ text: "Undefined short desc fallback" }],
        },
      ],
    };
    (client.fetch as any).mockResolvedValue(projectWithoutShortDesc);
    vi.mocked(blockToPlainText).mockReturnValue(
      "Undefined short desc fallback",
    );

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe("Undefined short desc fallback");
    expect(blockToPlainText).toHaveBeenCalledWith(
      projectWithoutShortDesc.description,
    );
  });

  it("falls back to blockToPlainText(description) when shortDescription is empty string", async () => {
    const projectWithEmptyShortDesc = {
      ...mockProject,
      shortDescription: "",
      description: [
        { _type: "block", children: [{ text: "Empty string fallback" }] },
      ],
    };
    (client.fetch as any).mockResolvedValue(projectWithEmptyShortDesc);
    vi.mocked(blockToPlainText).mockReturnValue("Empty string fallback");

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe("Empty string fallback");
    expect(blockToPlainText).toHaveBeenCalledWith(
      projectWithEmptyShortDesc.description,
    );
  });

  it("truncates description to 157 chars + '...' when result exceeds 160 characters", async () => {
    const longText = "A".repeat(200);
    const projectWithLongDesc = {
      ...mockProject,
      shortDescription: null,
      description: [{ _type: "block", children: [{ text: longText }] }],
    };
    (client.fetch as any).mockResolvedValue(projectWithLongDesc);
    vi.mocked(blockToPlainText).mockReturnValue(longText);

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe("A".repeat(157) + "...");
  });

  it("does NOT truncate description at exactly 160 characters", async () => {
    const exactText = "B".repeat(160);
    const projectWithExactDesc = {
      ...mockProject,
      shortDescription: null,
      description: [{ _type: "block", children: [{ text: exactText }] }],
    };
    (client.fetch as any).mockResolvedValue(projectWithExactDesc);
    vi.mocked(blockToPlainText).mockReturnValue(exactText);

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe(exactText);
    expect(metadata.description?.length).toBe(160);
  });

  it("does NOT truncate description shorter than 160 characters", async () => {
    const shortText = "A short description";
    const projectWithShortDesc = {
      ...mockProject,
      shortDescription: null,
      description: [{ _type: "block", children: [{ text: shortText }] }],
    };
    (client.fetch as any).mockResolvedValue(projectWithShortDesc);
    vi.mocked(blockToPlainText).mockReturnValue(shortText);

    const params = Promise.resolve({ locale: "en", slug: "test-project" });
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe(shortText);
    expect(metadata.description?.length).toBe(shortText.length);
  });

  it("returns empty object when project is not found", async () => {
    (client.fetch as any).mockResolvedValue(null);

    const params = Promise.resolve({ locale: "en", slug: "nonexistent" });
    const metadata = await generateMetadata({ params });

    expect(metadata).toEqual({});
  });
});
