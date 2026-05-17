/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Strict TDD — RED phase for task 3.2 / 3.3
 *
 * Tests that ObsidianStream wraps CommandNav with next/dynamic.
 * The existing ObsidianStream test mocks CommandNav directly —
 * this test verifies the dynamic import registration.
 */

// vi.hoisted runs before vi.mock, ensuring dynamicRegistrations exists
// when the mock factory executes during module evaluation
const { dynamicRegistrations } = vi.hoisted(() => ({
  dynamicRegistrations: [] as string[],
}));

vi.mock("next/dynamic", () => ({
  default: vi.fn((loader: () => Promise<unknown>) => {
    dynamicRegistrations.push(loader.toString());
    return function DynamicMock(props: Record<string, unknown>) {
      return (
        <div data-testid="dynamic-cmdnav-wrapper">
          <div data-testid="dynamic-cmdnav-placeholder" />
        </div>
      );
    };
  }),
}));

// ── Mock all ObsidianStream dependencies at module level ──────────

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    useReducedMotion: () => false,
    BootSequence: () => null,
  };
});

vi.mock("@/hooks/useActiveSection", () => ({
  useActiveSection: () => "hero",
}));

vi.mock("./fragments/HeroSection", () => ({
  HeroSection: () => <section id="hero">Hero</section>,
}));
vi.mock("./fragments/ExperienceOverview", () => ({
  ExperienceOverview: () => null,
}));
vi.mock("./fragments/SkillsOverview", () => ({
  SkillsOverview: () => null,
}));
vi.mock("./fragments/CertificatesOverview", () => ({
  CertificatesOverview: () => null,
}));
vi.mock("./ui/SectionDock", () => ({
  SectionDock: () => null,
}));

// Note: CommandNav is NOT mocked here — we want to verify it's loaded dynamically

vi.mock("@/lib/sections", () => ({
  navSections: [],
  navSectionIds: [],
  streamSectionIds: [],
}));

vi.mock("@/lib/navigation", () => ({
  scrollToSection: vi.fn(),
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

describe("ObsidianStream — CommandNav dynamic import", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SKIP_BOOT_SEQUENCE = "1";
  });

  it("registers CommandNav via next/dynamic instead of static import", () => {
    render(<ObsidianStream {...defaultProps} />);

    // After rendering, next/dynamic should have been called
    // for CommandNav (not mocked directly in this test file)
    const cmdNavLoader = dynamicRegistrations.find((r) =>
      r.includes("CommandNav"),
    );
    expect(cmdNavLoader).toBeDefined();
  });

  it("renders a placeholder element before CommandNav hydrates", () => {
    const { container } = render(<ObsidianStream {...defaultProps} />);

    // The dynamic mock renders a placeholder div
    const placeholder = screen.queryByTestId("dynamic-cmdnav-placeholder");
    expect(placeholder).toBeInTheDocument();
  });
});
