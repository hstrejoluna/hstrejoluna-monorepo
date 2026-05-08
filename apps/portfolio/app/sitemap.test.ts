/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("react", () => ({
  cache: (fn: (...args: any[]) => any) => fn,
}));

vi.mock("@/lib/sanity", () => ({
  client: {
    fetch: vi.fn(),
  },
}));

import { client } from "@/lib/sanity";
import sitemap from "./sitemap";

const mockProjectSlugs = [
  { slug: "quantum-physics-sim", _updatedAt: "2025-11-03T12:00:00Z" },
  { slug: "distributed-mesh", _updatedAt: "2024-07-21T08:30:00Z" },
  { slug: "ai-chat-platform", _updatedAt: undefined as unknown as string },
];

describe("sitemap — dynamic project slug generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = "https://test-portfolio.com";
    (client.fetch as any).mockResolvedValue(mockProjectSlugs);
  });

  it("includes static paths for all locales (en, es)", async () => {
    const entries = await sitemap();

    const staticPaths = ["", "/privacy", "/cookies", "/legal"];
    const locales = ["en", "es"];

    for (const locale of locales) {
      for (const path of staticPaths) {
        const found = entries.find(
          (e) => e.url === `https://test-portfolio.com/${locale}${path}`,
        );
        expect(found, `Missing: /${locale}${path}`).toBeDefined();
      }
    }
  });

  it("sets priority 1.0 for root path and 0.5 for legal/info pages", async () => {
    const entries = await sitemap();

    const rootEn = entries.find(
      (e) => e.url === "https://test-portfolio.com/en",
    );
    const privacyEn = entries.find(
      (e) => e.url === "https://test-portfolio.com/en/privacy",
    );

    expect(rootEn?.priority).toBe(1);
    expect(privacyEn?.priority).toBe(0.5);
  });

  it("generates URLs for all published project slugs in both locales", async () => {
    const entries = await sitemap();

    const projectUrls = entries
      .filter((e) => e.url.includes("/projects/"))
      .map((e) => e.url);

    // 3 slugs × 2 locales = 6 project URLs
    expect(projectUrls).toHaveLength(6);

    expect(projectUrls).toContain(
      "https://test-portfolio.com/en/projects/quantum-physics-sim",
    );
    expect(projectUrls).toContain(
      "https://test-portfolio.com/en/projects/distributed-mesh",
    );
    expect(projectUrls).toContain(
      "https://test-portfolio.com/en/projects/ai-chat-platform",
    );
    expect(projectUrls).toContain(
      "https://test-portfolio.com/es/projects/quantum-physics-sim",
    );
    expect(projectUrls).toContain(
      "https://test-portfolio.com/es/projects/distributed-mesh",
    );
    expect(projectUrls).toContain(
      "https://test-portfolio.com/es/projects/ai-chat-platform",
    );
  });

  it("sets priority 0.8 and changeFrequency 'monthly' for project pages", async () => {
    const entries = await sitemap();

    const projectEntry = entries.find(
      (e) =>
        e.url === "https://test-portfolio.com/en/projects/quantum-physics-sim",
    );

    expect(projectEntry).toBeDefined();
    expect(projectEntry?.priority).toBe(0.8);
    expect(projectEntry?.changeFrequency).toBe("monthly");
  });

  it("uses _updatedAt as lastmod for project pages when available", async () => {
    const entries = await sitemap();

    const projectEntry = entries.find(
      (e) =>
        e.url === "https://test-portfolio.com/en/projects/quantum-physics-sim",
    );

    const lastMod = projectEntry?.lastModified;
    expect(lastMod).toBeInstanceOf(Date);
    expect((lastMod as Date).toISOString()).toBe("2025-11-03T12:00:00.000Z");
  });

  it("falls back to current date as lastmod when _updatedAt is undefined", async () => {
    const entries = await sitemap();

    const projectEntry = entries.find(
      (e) =>
        e.url === "https://test-portfolio.com/en/projects/ai-chat-platform",
    );

    expect(projectEntry?.lastModified).toBeInstanceOf(Date);
    const lastModMs = (projectEntry!.lastModified as Date).getTime();
    expect(Date.now() - lastModMs).toBeLessThan(5000);
  });

  it("includes locale alternates (xhtml:link) for each project page", async () => {
    const entries = await sitemap();

    const enEntry = entries.find(
      (e) =>
        e.url === "https://test-portfolio.com/en/projects/distributed-mesh",
    );
    const esEntry = entries.find(
      (e) =>
        e.url === "https://test-portfolio.com/es/projects/distributed-mesh",
    );

    // English entry should have Spanish alternate
    expect(enEntry?.alternates?.languages).toBeDefined();
    expect(enEntry?.alternates?.languages?.es).toBe(
      "https://test-portfolio.com/es/projects/distributed-mesh",
    );
    // Must NOT include self-referencing alternate
    expect(enEntry?.alternates?.languages?.en).toBeUndefined();

    // Spanish entry should have English alternate
    expect(esEntry?.alternates?.languages).toBeDefined();
    expect(esEntry?.alternates?.languages?.en).toBe(
      "https://test-portfolio.com/en/projects/distributed-mesh",
    );
    // Must NOT include self-referencing alternate
    expect(esEntry?.alternates?.languages?.es).toBeUndefined();
  });

  it("handles empty project list gracefully (no Sanity projects)", async () => {
    (client.fetch as any).mockResolvedValue([]);

    const entries = await sitemap();

    // Should still include static paths (4 paths × 2 locales = 8 entries)
    const projectEntries = entries.filter((e) => e.url.includes("/projects/"));
    expect(projectEntries).toHaveLength(0);

    const staticEntries = entries.filter((e) => !e.url.includes("/projects/"));
    expect(staticEntries).toHaveLength(8);
  });

  it("handles Sanity fetch failure gracefully", async () => {
    (client.fetch as any).mockRejectedValue(new Error("Sanity unavailable"));

    const entries = await sitemap();

    // On fetch failure, project slugs should be empty
    const projectEntries = entries.filter((e) => e.url.includes("/projects/"));
    expect(projectEntries).toHaveLength(0);

    // Static paths should still exist
    const staticEntries = entries.filter((e) => !e.url.includes("/projects/"));
    expect(staticEntries).toHaveLength(8);
  });

  it("does not include alternates for static paths", async () => {
    const entries = await sitemap();

    const rootEn = entries.find(
      (e) => e.url === "https://test-portfolio.com/en",
    );
    expect(rootEn?.alternates).toBeUndefined();
  });
});
