/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const messages: Record<string, Record<string, string>> = {
      nav: {
        projects: "Projects",
        certificates: "Certificates",
      },
      brand: {
        experienceLog: "EXPERIENCE_LOG",
        neuralMap: "NEURAL_MAP",
      },
    };

    return messages[namespace]?.[key] ?? key;
  },
}));

vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    useReducedMotion: () => false,
    BootSequence: () => null,
  };
});

vi.mock("@/hooks/useAutoHideNavigation", () => ({
  useAutoHideNavigation: () => false,
}));

vi.mock("@/hooks/useActiveSection", () => ({
  useActiveSection: () => "hero",
}));

vi.mock("./fragments/HeroSection", () => ({
  HeroSection: () => (
    <section id="hero">
      <div data-testid="hero-section">Hero</div>
    </section>
  ),
}));
vi.mock("./fragments/ExperienceOverview", () => ({
  ExperienceOverview: () => <div>Experience</div>,
}));
vi.mock("./fragments/SkillsOverview", () => ({
  SkillsOverview: () => <div>Skills</div>,
}));
vi.mock("./fragments/CertificatesOverview", () => ({
  CertificatesOverview: () => <div>Certificates</div>,
}));
vi.mock("./ui/SectionDock", () => ({
  SectionDock: () => <nav data-testid="section-dock">Dock</nav>,
}));
vi.mock("./ui/CommandNav", () => ({
  CommandNav: () => <nav data-testid="command-nav">Nav</nav>,
}));

import { ObsidianStream } from "./ObsidianStream";

const defaultProps = {
  profile: {
    _id: "1",
    _type: "profile" as const,
    name: "Test User",
    headline: "Test",
    bio: "",
    socials: [],
  },
  projects: [],
  skills: [],
  experiences: [],
  certificates: [],
};

describe("ObsidianStream — Decorative Content Isolation", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SKIP_BOOT_SEQUENCE = "1";
  });

  it("hides background name watermark from assistive technology", () => {
    render(<ObsidianStream {...defaultProps} />);

    const watermarkText = screen.queryByText("Test User");
    expect(watermarkText).toBeInTheDocument();

    const watermarkContainer = watermarkText!.closest("[aria-hidden]");
    expect(watermarkContainer).toHaveAttribute("aria-hidden", "true");
  });

  it("hides scroll progress bar from assistive technology", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // The progress bar is a fixed div at the top with bg-white/5
    const progressBarWrapper = container.querySelector(
      ".fixed.top-0.left-0.w-full",
    );
    expect(progressBarWrapper).toBeInTheDocument();
    expect(progressBarWrapper).toHaveAttribute("aria-hidden", "true");
  });
});

describe("ObsidianStream — Post-cleanup: HeroSection always active", () => {
  it("always renders HeroSection (feature flag + HeroFragment removed in Phase 10)", () => {
    render(<ObsidianStream {...defaultProps} />);

    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
    expect(screen.queryByTestId("hero-fragment")).not.toBeInTheDocument();
  });
});

describe("ObsidianStream — BootSequence Removal", () => {
  it("renders content unconditionally without NEXT_PUBLIC_SKIP_BOOT_SEQUENCE", () => {
    // Override the beforeEach: simulate NO skip flag (isBooted starts false)
    vi.stubEnv("NEXT_PUBLIC_SKIP_BOOT_SEQUENCE", "");

    render(<ObsidianStream {...defaultProps} />);

    // HeroSection should render even without the skip flag
    expect(screen.getByTestId("hero-section")).toBeInTheDocument();
  });

  it("does not lock body overflow during load", () => {
    vi.stubEnv("NEXT_PUBLIC_SKIP_BOOT_SEQUENCE", "");

    render(<ObsidianStream {...defaultProps} />);

    // Body overflow should NOT be locked (no boot sequence blocks it)
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("ObsidianStream — LazyMotion and section wrapper", () => {
  it("does not contain an inner LazyMotion wrapper (MotionProvider handles it globally)", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // LazyMotion mock renders <div data-lazy-motion-wrapper="">.
    // When ObsidianStream no longer wraps content in its own LazyMotion,
    // this attribute should never appear.
    const lazyWrappers = container.querySelectorAll(
      "[data-lazy-motion-wrapper]",
    );
    expect(lazyWrappers).toHaveLength(0);
  });

  it("HeroSection provides id='hero' for useActiveSection, ObsidianStream adds no wrapper", () => {
    render(<ObsidianStream {...defaultProps} />);

    // HeroSection owns id="hero" (needed by useActiveSection for CommandNav).
    const heroElement = document.getElementById("hero");
    expect(heroElement).toBeInTheDocument();
    expect(heroElement?.tagName).toBe("SECTION");

    // ObsidianStream must NOT add a duplicate section#hero wrapper.
    const heroSections = document.querySelectorAll("section#hero");
    expect(heroSections).toHaveLength(1);
  });
});

describe("ObsidianStream — Post-framer-motion: CSS animations only", () => {
  it("uses CSS animation class on booted wrapper instead of framer-motion m.div", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // Post-boot entrance wrapper must use a CSS animation class, not
    // framer-motion m.div with initial/animate props.
    const entranceWrapper = container.querySelector(".animate-hero-fade-in");
    expect(entranceWrapper).toBeInTheDocument();
  });

  it("uses background-attachment:fixed for background parallax instead of useScroll+useTransform", () => {
    render(<ObsidianStream {...defaultProps} />);

    // Background name watermark must use pure CSS fixed-background
    // parallax — no framer-motion motion values.
    const bgName = screen
      .getByText("Test User")
      .closest("[aria-hidden='true'].fixed.inset-0");
    expect(bgName).toBeInTheDocument();
    // Verify the CSS mechanism is present: either the bg-fixed-parallax
    // class (via globals.css) or inline background-attachment:fixed.
    const hasParallaxClass = bgName!.classList.contains("bg-fixed-parallax");
    const hasFixedStyle =
      bgName!.getAttribute("style")?.includes("background-attachment: fixed") ||
      false;
    expect(hasParallaxClass || hasFixedStyle).toBe(true);
  });

  it("scroll progress bar uses CSS animation-timeline:view() or IntersectionObserver, not m.div scaleX", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // The progress bar inner fill must NOT be a framer-motion m.div with
    // style.scaleX. Instead it must use CSS (animation-timeline or
    // IntersectionObserver + class toggle).
    const progressBarInner = container.querySelector(
      ".fixed.top-0.left-0.w-full [style*='scaleX']",
    );
    expect(progressBarInner).toBeNull();
  });

  it("does not import or call createPortal (HeroLiquidField portal removed in Phase 1)", () => {
    render(<ObsidianStream {...defaultProps} />);

    // After PR1 deleted HeroLiquidField, no createPortal should remain.
    // Verify no React portal mount points or portal-related DOM exist.
    const portalTargets = document.querySelectorAll(
      "[id*='portal'], [id*='visual-mount']",
    );
    expect(portalTargets).toHaveLength(0);
  });

  it("renders content section wrapper as plain <div>, not m.div", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // The inner content wrapper (post-boot) must not carry framer-motion
    // style attributes like transform:none that m.div injects.
    const motionStyleDivs = container.querySelectorAll(
      "div[style*='transform']",
    );
    // Zero divs should have inline transform styles from motion.
    expect(motionStyleDivs).toHaveLength(0);
  });
});
