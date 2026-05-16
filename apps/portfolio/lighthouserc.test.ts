/// <reference types="vitest/globals" />
import { describe, expect, it } from "vitest";
import path from "node:path";

/**
 * Snapshot test for lighthouserc.cjs config values.
 *
 * Thresholds are calibrated against the production portfolio's measured
 * Lighthouse runs. See PR #90 (perf floor) and PR #92 (audit /en target).
 *
 * Single-tier "error" thresholds are intentional: this is a CI gate, not
 * a tracked-warning surface. Warnings without error backing would be silent.
 */

const configPath = path.resolve(__dirname, "lighthouserc.cjs");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const lhConfig = require(configPath) as {
  ci: {
    collect: {
      numberOfRuns: number;
      url: string[];
      startServerCommand: string;
      startServerReadyPattern: string;
      startServerReadyTimeout: number;
      settings: { preset: string };
    };
    assert: {
      assertions: Record<
        string,
        | [string, { minScore: number }]
        | [string, { maxNumericValue: number }]
      >;
    };
    upload: { target: string };
  };
};

describe("lighthouserc.cjs — calibrated thresholds", () => {
  it("URL targets /en directly (no redirect overhead)", () => {
    expect(lhConfig.ci.collect.url).toEqual(["http://127.0.0.1:4173/en"]);
  });

  it("collects 3 runs for statistical stability", () => {
    expect(lhConfig.ci.collect.numberOfRuns).toBe(3);
  });

  it("performance threshold: 0.65 error", () => {
    expect(lhConfig.ci.assert.assertions["categories:performance"]).toEqual([
      "error",
      { minScore: 0.65 },
    ]);
  });

  it("accessibility threshold: 0.95 error", () => {
    expect(lhConfig.ci.assert.assertions["categories:accessibility"]).toEqual([
      "error",
      { minScore: 0.95 },
    ]);
  });

  it("best-practices threshold: 0.9 warn", () => {
    expect(lhConfig.ci.assert.assertions["categories:best-practices"]).toEqual([
      "warn",
      { minScore: 0.9 },
    ]);
  });

  it("SEO threshold: 0.95 error", () => {
    expect(lhConfig.ci.assert.assertions["categories:seo"]).toEqual([
      "error",
      { minScore: 0.95 },
    ]);
  });

  it("FCP: 3000ms error threshold", () => {
    expect(
      lhConfig.ci.assert.assertions["first-contentful-paint"],
    ).toEqual(["error", { maxNumericValue: 3000 }]);
  });

  it("LCP: 2500ms error threshold", () => {
    expect(
      lhConfig.ci.assert.assertions["largest-contentful-paint"],
    ).toEqual(["error", { maxNumericValue: 2500 }]);
  });

  it("Speed Index: 4000ms error threshold", () => {
    expect(lhConfig.ci.assert.assertions["speed-index"]).toEqual([
      "error",
      { maxNumericValue: 4000 },
    ]);
  });

  it("upload target is temporary-public-storage", () => {
    expect(lhConfig.ci.upload.target).toBe("temporary-public-storage");
  });

  it("desktop preset is configured", () => {
    expect(lhConfig.ci.collect.settings.preset).toBe("desktop");
  });
});
