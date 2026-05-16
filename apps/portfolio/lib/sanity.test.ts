/// <reference types="vitest/globals" />
import { describe, expect, it } from "vitest";

/**
 * Strict TDD — RED phase for task 2.2 / 2.3
 *
 * Verifies the Sanity read client uses `useCdn: true` for production.
 *
 * Spec: portfolio-isr-caching / Requirement: Sanity CDN Usage
 * - Sanity client SHALL use useCdn: true for all public-facing data fetches
 *
 * Design: ADR — useCdn: true on read client, reduces TTFB ~40%
 */

describe("lib/sanity.ts — read client CDN config", () => {
  it("exports client configured with useCdn: true", async () => {
    const { client } = await import("./sanity");

    // Sanity client exposes config() returning the configuration used at creation
    const config = client.config();
    expect(config).toHaveProperty("useCdn");
    expect(config.useCdn).toBe(true);
  });

  it("write client remains with useCdn: false for mutations", async () => {
    const { writeClient } = await import("./sanity");

    const config = writeClient.config();
    // Write client targets the Sanity API directly — mutations must NOT go through CDN
    expect(config).toHaveProperty("useCdn", false);
  });
});
