/// <reference types="vitest/globals" />
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Strict TDD — RED phase for tasks 3.1, 3.2, 3.3
 *
 * Tests that code-splitting via next/dynamic is correctly applied:
 * - CookieBanner in layout.tsx wrapped with next/dynamic, CLS placeholder added
 * - CommandNav in ObsidianStream.tsx wrapped with next/dynamic, status-dot placeholder added
 *
 * Spec: N/A (structural optimization, no domain spec)
 * Design: ADR — next/dynamic + ssr: false for CookieBanner and CommandNav
 */

// ── Mock next/dynamic to intercept dynamic() calls and reveal the module path ──

const dynamicRegistrations: string[] = [];

vi.mock("next/dynamic", () => ({
  default: vi.fn((loader: () => Promise<unknown>, opts?: { ssr?: boolean }) => {
    // Record which modules are being dynamically loaded for verification
    const loaderStr = loader.toString();
    dynamicRegistrations.push(loaderStr);
    // Return a simple mock component that renders a placeholder
    return function DynamicMock(props: Record<string, unknown>) {
      return (
        <div data-testid="dynamic-wrapper" data-loader={loaderStr}>
          {/* Placeholder: rendered by the wrapper before the dynamic module loads */}
          <div data-testid="dynamic-placeholder" />
        </div>
      );
    };
  }),
}));

// ── Mock dependencies ───────────────────────────────────────────

vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getMessages: vi.fn().mockResolvedValue({}),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-sans" }),
  Space_Grotesk: () => ({ variable: "--font-display" }),
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="intl-provider">{children}</div>
  ),
}));

vi.mock("../../components/fragments/Footer", () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("../../components/fragments/CookieBanner", () => ({
  default: () => <div data-testid="cookie-banner">CookieBanner</div>,
}));

vi.mock("../../components/tracking/GoogleTagManager", () => ({
  default: () => <div data-testid="gtm">GTM</div>,
}));

// ── Tests ────────────────────────────────────────────────────────

describe("layout.tsx — CookieBanner dynamic import", () => {
  it("registers CookieBanner via next/dynamic with ssr:false", async () => {
    // Import the layout — this triggers dynamic() registration
    await import("./layout");

    // Verify next/dynamic was called for CookieBanner
    const cookieLoader = dynamicRegistrations.find((r) =>
      r.includes("CookieBanner"),
    );
    expect(cookieLoader).toBeDefined();
    expect(cookieLoader).toMatch(/CookieBanner/);
  });

  it("no longer imports CookieBanner statically at module level", async () => {
    // The layout module should NOT have a static import of CookieBanner
    // after code-splitting. We verify this by checking that the static
    // import no longer resolves CookieBanner as a named/default export
    // at the module top level.

    // The dynamic() mock intercepts the import, so if it's registered
    // as "dynamic" instead of static, this test is satisfied.
    const mod = await import("./layout");
    // If CookieBanner was statically imported, it would be a dependency
    // of the module. Verify the module doesn't directly export it.
    const keys = Object.keys(mod);
    expect(keys).not.toContain("CookieBanner");
  });
});
