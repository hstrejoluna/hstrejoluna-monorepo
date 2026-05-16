/// <reference types="vitest/globals" />
import { describe, expect, it } from "vitest";
import path from "node:path";

/**
 * Strict TDD — RED → GREEN for task 5.3
 *
 * Snapshot test for lighthouserc.cjs config values.
 * Verifies thresholds match the design specification
 * (tasks.md is authoritative over specs for implementation).
 *
 * Spec: lighthouse-ci-gate / Requirement: Calibrated Thresholds
 * Design: ADR — relaxed thresholds for SSR portfolio
 * Tasks: Phase 5, task 5.1 / 5.3
 *
 * Thresholds per tasks.md:
 * - Perf: 0.7 warn / 0.6 error
 * - A11y: 0.9 warn / 0.8 error
 * - BestPractices: 0.9 warn / 0.8 error
 * - SEO: 0.95 warn / 0.9 error
 * - FCP: 5000ms warn (no error asserted)
 * - LCP: 4000ms error (no warn)
 * - SI: 4000ms error (no warn)
 * - TBT: 600ms warn / 1000ms error
 * - CLS: 0.1 warn / 0.25 error
 * - URL: /en (direct, no redirect)
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
        | Array<[string, { minScore: number }]>
        | [string, { maxNumericValue: number }]
        | Array<[string, { maxNumericValue: number }]>
      >;
    };
    upload: { target: string };
  };
};

describe("lighthouserc.cjs — calibrated thresholds (Phase 5 lighthouse-fix-all)", () => {
  it("URL targets /en directly (no redirect overhead)", () => {
    expect(lhConfig.ci.collect.url).toEqual(["http://127.0.0.1:4173/en"]);
  });

  it("collects 3 runs for statistical stability", () => {
    expect(lhConfig.ci.collect.numberOfRuns).toBe(3);
  });

  it("performance thresholds: 0.7 warn, 0.6 error", () => {
    const assertions = lhConfig.ci.assert.assertions["categories:performance"];
    expect(assertions).toEqual([
      ["warn", { minScore: 0.7 }],
      ["error", { minScore: 0.6 }],
    ]);
  });

  it("accessibility thresholds: 0.9 warn, 0.8 error", () => {
    const assertions =
      lhConfig.ci.assert.assertions["categories:accessibility"];
    expect(assertions).toEqual([
      ["warn", { minScore: 0.9 }],
      ["error", { minScore: 0.8 }],
    ]);
  });

  it("best-practices thresholds: 0.9 warn, 0.8 error", () => {
    const assertions =
      lhConfig.ci.assert.assertions["categories:best-practices"];
    expect(assertions).toEqual([
      ["warn", { minScore: 0.9 }],
      ["error", { minScore: 0.8 }],
    ]);
  });

  it("SEO thresholds: 0.95 warn, 0.9 error", () => {
    const assertions = lhConfig.ci.assert.assertions["categories:seo"];
    expect(assertions).toEqual([
      ["warn", { minScore: 0.95 }],
      ["error", { minScore: 0.9 }],
    ]);
  });

  it("FCP: 5000ms warn threshold", () => {
    const assertions =
      lhConfig.ci.assert.assertions["first-contentful-paint"];
    expect(assertions).toEqual(["warn", { maxNumericValue: 5000 }]);
  });

  it("LCP: 4000ms error threshold (matches design budget ≤4.0s)", () => {
    const assertions =
      lhConfig.ci.assert.assertions["largest-contentful-paint"];
    expect(assertions).toEqual(["error", { maxNumericValue: 4000 }]);
  });

  it("Speed Index: 4000ms error threshold", () => {
    const assertions = lhConfig.ci.assert.assertions["speed-index"];
    expect(assertions).toEqual(["error", { maxNumericValue: 4000 }]);
  });

  it("TBT: 600ms warn, 1000ms error", () => {
    const assertions = lhConfig.ci.assert.assertions["total-blocking-time"];
    expect(assertions).toEqual([
      ["warn", { maxNumericValue: 600 }],
      ["error", { maxNumericValue: 1000 }],
    ]);
  });

  it("CLS: 0.1 warn, 0.25 error", () => {
    const assertions =
      lhConfig.ci.assert.assertions["cumulative-layout-shift"];
    expect(assertions).toEqual([
      ["warn", { maxNumericValue: 0.1 }],
      ["error", { maxNumericValue: 0.25 }],
    ]);
  });

  it("upload target is temporary-public-storage", () => {
    expect(lhConfig.ci.upload.target).toBe("temporary-public-storage");
  });

  it("desktop preset is configured", () => {
    expect(lhConfig.ci.collect.settings.preset).toBe("desktop");
  });
});
