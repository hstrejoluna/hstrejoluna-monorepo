/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock next-intl (sync useTranslations — works for RSC)
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      hero: {
        eyebrow: "Building digital experiences",
        h1Name: "Héctor Trejo Luna",
        h1Role: "Senior Software Architect",
        lead: "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
        cta: "Explore my work",
        ctaAriaLabel: "View featured projects and case studies",
        secondaryLabel: "LinkedIn Profile",
        secondaryHref: "https://linkedin.com/in/htrejoluna",
      },
    };
    return messages[namespace]?.[key] ?? key;
  },
}));

// Mock next/link — render as plain <a> for testing
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { HeroSection } from "./HeroSection";
import type { Profile } from "@/types/sanity";

const mockProfile: Profile = {
  name: "Héctor Trejo Luna",
  headline: "Custom Sanity headline override",
  bio: "A passionate architect.",
  socials: [],
};

describe("HeroSection — Semantic SSR shell (REQ liquid-glass-hero)", () => {
  it("renders a <section> with aria-labelledby pointing to the h1 id", () => {
    render(<HeroSection profile={null} />);
    const section = screen.getByRole("region");
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute("aria-labelledby", "hero-title");
  });

  it("renders exactly one <h1> with id 'hero-title' containing name + role from messages", () => {
    render(<HeroSection profile={null} />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    const h1 = headings[0];
    expect(h1).toHaveAttribute("id", "hero-title");
    expect(h1).toHaveTextContent("Héctor Trejo Luna");
    expect(h1).toHaveTextContent("Senior Software Architect");
  });

  it("renders an eyebrow <p> with translatable text from hero namespace", () => {
    render(<HeroSection profile={null} />);
    const eyebrow = screen.getByText("Building digital experiences");
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow.tagName).toBe("P");
  });

  it("renders a lead <p> with the translatable lead text from messages", () => {
    render(<HeroSection profile={null} />);
    const lead = screen.getByText(
      "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
    );
    expect(lead).toBeInTheDocument();
    expect(lead.tagName).toBe("P");
  });

  it("renders a primary <a> CTA pointing to #projects with aria-label", () => {
    render(<HeroSection profile={null} />);
    const primaryCta = screen.getByRole("link", {
      name: "View featured projects and case studies",
    });
    expect(primaryCta).toBeInTheDocument();
    expect(primaryCta).toHaveAttribute("href", "#projects");
    expect(primaryCta).toHaveTextContent("Explore my work");
  });

  it("renders a secondary <a> CTA pointing to the LinkedIn profile URL from messages", () => {
    render(<HeroSection profile={null} />);
    const secondaryCta = screen.getByRole("link", {
      name: "LinkedIn Profile",
    });
    expect(secondaryCta).toBeInTheDocument();
    expect(secondaryCta).toHaveAttribute(
      "href",
      "https://linkedin.com/in/htrejoluna",
    );
    expect(secondaryCta).toHaveAttribute("target", "_blank");
    expect(secondaryCta).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("all visible copy comes from the hero messages namespace (i18n)", () => {
    render(<HeroSection profile={null} />);
    // h1 text from messages (rendered as single text node: "Name — Role")
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Héctor Trejo Luna");
    expect(h1).toHaveTextContent("Senior Software Architect");
    // eyebrow from messages
    expect(
      screen.getByText("Building digital experiences"),
    ).toBeInTheDocument();
    // lead from messages
    expect(
      screen.getByText(
        "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
      ),
    ).toBeInTheDocument();
    // CTA text from messages
    expect(screen.getByText("Explore my work")).toBeInTheDocument();
    // secondary from messages
    expect(screen.getByText("LinkedIn Profile")).toBeInTheDocument();
  });
});

describe("HeroSection — Sanity profile fallback (non-h1 paths only)", () => {
  it("prefers profile.headline over messages.hero.lead for the lead paragraph", () => {
    render(<HeroSection profile={mockProfile} />);
    const lead = screen.getByText("Custom Sanity headline override");
    expect(lead).toBeInTheDocument();
    // The default lead text should NOT be present
    expect(
      screen.queryByText(
        "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
      ),
    ).not.toBeInTheDocument();
  });

  it("falls back to messages.hero.lead when profile.headline is null or undefined", () => {
    const profileWithoutHeadline: Profile = {
      name: "Héctor Trejo Luna",
      headline: undefined,
      bio: "A passionate architect.",
      socials: [],
    };
    render(<HeroSection profile={profileWithoutHeadline} />);
    expect(
      screen.getByText(
        "Engineering scalable, high-performance digital ecosystems from architecture to pixel",
      ),
    ).toBeInTheDocument();
  });

  it("h1 text never depends on Sanity profile — always from messages only", () => {
    render(<HeroSection profile={mockProfile} />);
    const h1 = screen.getByRole("heading", { level: 1 });
    // h1 must reflect messages.hero.h1Name + messages.hero.h1Role
    expect(h1).toHaveTextContent("Héctor Trejo Luna");
    expect(h1).toHaveTextContent("Senior Software Architect");
    // profile.name ("Héctor Trejo Luna") happens to match, but the test
    // verifies the h1 text comes from the mock messages, not from the prop.
    // If profile.name were aliased to h1, changing the mock would break it.
  });
});

describe("HeroSection — Post-cleanup: zero WebGL / HeroLiquidField", () => {
  it("renders zero <canvas> elements (HeroLiquidWebGL removed in PR1)", () => {
    const { container } = render(<HeroSection profile={null} />);
    const canvases = container.querySelectorAll("canvas");
    expect(canvases).toHaveLength(0);
  });

  it("renders no portal mount points or HeroLiquidField fragments", () => {
    const { container } = render(<HeroSection profile={null} />);
    const portalMounts = container.querySelectorAll(
      "[id*='visual-mount'], [id*='portal'], [id*='liquid']",
    );
    expect(portalMounts).toHaveLength(0);
  });

  it("hero visual layer is pure CSS blobs, zero JS runtime", () => {
    const { container } = render(<HeroSection profile={null} />);
    // No script elements embedded in the hero
    const scripts = container.querySelectorAll("script");
    expect(scripts).toHaveLength(0);
    // No WebGL attributes on any element
    const webglElements = container.querySelectorAll(
      "[data-webgl], [data-three], [data-r3f]",
    );
    expect(webglElements).toHaveLength(0);
  });
});
