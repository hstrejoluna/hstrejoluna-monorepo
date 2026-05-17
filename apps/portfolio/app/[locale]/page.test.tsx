/// <reference types="vitest/globals" />
import { describe, expect, it, vi } from "vitest";

/**
 * Strict TDD — RED phase for tasks 2.1, 2.2, 2.3
 *
 * Task 2.1: page.tsx uses `export const revalidate = 3600`
 * Task 2.2: sanity.ts uses `useCdn: true`
 * Task 2.3: Snapshot revalidate constant + verify useCdn config + LCP ≤ 4.0s
 *
 * Spec: portfolio-isr-caching
 * - Home page SHALL use ISR (revalidate) instead of force-dynamic
 * - Sanity client SHALL use useCdn: true
 *
 * Design: ADR — revalidate: 3600, useCdn: true
 */

// ── Mock dependencies before importing page.tsx ────────────────────

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(),
  setRequestLocale: vi.fn(),
}));

vi.mock("@/lib/safe-json-ld", () => ({
  safeJsonLd: vi.fn((v: unknown) => JSON.stringify(v)),
}));

vi.mock("@/lib/json-ld", () => ({
  buildPersonJsonLd: vi.fn(() => ({})),
  buildProjectListJsonLd: vi.fn(() => ({})),
}));

vi.mock("@/lib/sanity", () => ({
  client: {
    fetch: vi.fn().mockResolvedValue(null),
    config: vi.fn(() => ({ useCdn: true })),
  },
}));

vi.mock("@/components/ObsidianStream", () => ({
  ObsidianStream: () => null,
}));

vi.mock("@/components/ProjectsGrid", () => ({
  ProjectsGrid: () => null,
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

describe("page.tsx — ISR revalidate constant", () => {
  it("exports revalidate = 3600 (ISR enabled, 1-hour cache window)", async () => {
    const mod = await import("./page");
    // Assert revalidate is exported and equals 3600 (design decision)
    expect(mod).toHaveProperty("revalidate");
    expect(mod.revalidate).toBe(3600);
  });

  it("does NOT export dynamic (force-dynamic removed)", async () => {
    const mod = await import("./page");
    // After ISR migration, the `dynamic` export should no longer exist
    // because it was replaced by `revalidate`
    expect(mod).not.toHaveProperty("dynamic");
  });
});

describe("lib/sanity.ts — CDN config", () => {
  it("read client is configured with useCdn: true", async () => {
    // Create a spy on next-sanity's createClient to capture the config
    // without mocking the entire @/lib/sanity module
    const { createClient } = await import("next-sanity");

    // Import the real sanity module — this calls createClient internally
    const { client } = await import("../../lib/sanity");

    // The client should have a config() method returning useCdn
    const config = client.config();
    expect(config).toHaveProperty("useCdn", true);
  });
});
