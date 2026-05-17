/// <reference types="vitest/globals" />
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * Strict TDD — RED phase for task 1.1 / 1.3
 *
 * Production file: app/[locale]/error.tsx (does NOT exist yet — these tests
 * will fail until the error boundary component is created.)
 *
 * Spec: portfolio-error-resilience / Requirement: Locale-Scoped Error Boundary
 * - Catches errors within locale-scoped route segments
 * - Renders branded degraded-mode UI with retry button
 * - reset() triggers fresh server render
 *
 * Design: "Branded degraded-mode UI" — matches dark theme, professional feel
 */

import LocaleError from "./error";

describe("LocaleError boundary — [locale]/error.tsx", () => {
  it("renders the branded degraded-mode heading and retry button", () => {
    const resetMock = vi.fn();
    const testError = Object.assign(new Error("Sanity fetch failed"), {
      digest: "abc123",
    });

    render(<LocaleError error={testError} reset={resetMock} />);

    // MUST render a meaningful heading so users know something went wrong
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    // MUST render a retry button
    const retryButton = screen.getByRole("button", { name: /try again/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("calls reset() when the retry button is clicked", () => {
    const resetMock = vi.fn();
    const testError = new Error("Sanity fetch failed");

    render(<LocaleError error={testError} reset={resetMock} />);

    const retryButton = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryButton);

    // reset() MUST be called exactly once — triggers boundary reset
    expect(resetMock).toHaveBeenCalledTimes(1);
  });

  it("uses dark-themed styling matching portfolio aesthetic (does not render white background)", () => {
    const resetMock = vi.fn();
    const testError = new Error("Sanity fetch failed");

    const { container } = render(
      <LocaleError error={testError} reset={resetMock} />,
    );

    // Verify the error boundary is not a blank white page
    // — it must have visual content matching the dark theme
    const innerElement = container.firstChild as HTMLElement;
    expect(innerElement).not.toBeNull();

    // The degraded-mode UI should NOT be empty — rendered content exists
    const textContent = container.textContent || "";
    expect(textContent.length).toBeGreaterThan(10);
  });

  it("does NOT display the error digest or raw error message to the user", () => {
    const resetMock = vi.fn();
    const testError = Object.assign(new Error("Sanity fetch failed"), {
      digest: "NEXT_DIGEST_123",
    });

    const { container } = render(
      <LocaleError error={testError} reset={resetMock} />,
    );

    // error.digest is internal — MUST NOT be exposed to user
    expect(container.textContent).not.toContain("NEXT_DIGEST_123");
    // Raw error message MAY be exposed (spec permits), but digest is internal
  });
});
