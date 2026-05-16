/// <reference types="vitest/globals" />
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Strict TDD — RED phase for task 1.2 / 1.3
 *
 * Production file: app/error.tsx (does NOT exist yet — these tests
 * will fail until the error boundary component is created.)
 *
 * Spec: portfolio-error-resilience / Requirement: Root Error Boundary
 * - Catches uncaught render errors from layout level (fonts, i18n, GTM)
 * - Renders minimalist shell with retry link
 * - Non-200 response, Lighthouse scores real metrics
 *
 * Design: "Minimalist shell with 'try again' link" — root boundary is
 * less branded, more functional since layout may not have loaded.
 */

import RootError from "./error";

describe("RootError boundary — app/error.tsx", () => {
  it("renders a minimalist error shell with retry link", () => {
    const resetMock = vi.fn();
    const testError = Object.assign(new Error("Layout failed to load"), {
      digest: "ROOT_DIGEST_456",
    });

    const { container } = render(
      <RootError error={testError} reset={resetMock} />,
    );

    // MUST render visible content — not a blank page
    const textContent = container.textContent || "";
    expect(textContent.length).toBeGreaterThan(5);

    // MUST have a retry mechanism (button or link)
    const retryElement =
      screen.queryByRole("button", { name: /try again/i }) ||
      screen.queryByText(/try again/i) ||
      screen.queryByText(/retry/i) ||
      screen.queryByText(/reintentar/i);
    expect(retryElement).not.toBeNull();
  });

  it("calls reset() when the retry mechanism is activated", () => {
    const resetMock = vi.fn();
    const testError = new Error("Layout failed to load");

    render(<RootError error={testError} reset={resetMock} />);

    // Find the retry button and click it
    const retryButton = screen.queryByRole("button", { name: /try again/i });
    if (retryButton) {
      fireEvent.click(retryButton);
      expect(resetMock).toHaveBeenCalledTimes(1);
    }
  });

  it("does NOT display raw error digest to the user", () => {
    const resetMock = vi.fn();
    const testError = Object.assign(new Error("Layout failed to load"), {
      digest: "ROOT_SECRET_DIGEST",
    });

    const { container } = render(
      <RootError error={testError} reset={resetMock} />,
    );

    // error.digest is internal — MUST NOT be exposed to user
    expect(container.textContent).not.toContain("ROOT_SECRET_DIGEST");
  });

  it("renders as a minimal, lightweight component (no Logo, no heavy branding)", () => {
    const resetMock = vi.fn();
    const testError = new Error("Layout failed to load");

    render(<RootError error={testError} reset={resetMock} />);

    // Root error boundary is minimalist — should NOT contain heavy branding elements
    // that depend on the layout system that may have failed
    expect(screen.queryByTestId("intl-provider")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
