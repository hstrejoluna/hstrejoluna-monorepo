"use client";

import { useEffect } from "react";

/**
 * Locale-Scoped Error Boundary — app/[locale]/error.tsx
 *
 * Catches Sanity fetch failures and other render errors within locale-scoped
 * route segments (page.tsx). Renders branded degraded-mode UI that matches
 * the portfolio's dark cinematic aesthetic instead of a blank page.
 *
 * Spec: portfolio-error-resilience / Requirement: Locale-Scoped Error Boundary
 * Design: ADR-2 — branded UI, retry button, non-200 response
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("LocaleError boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-on-background font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          {/* Degraded-mode indicator — branded, not alarming */}
          <div
            aria-hidden="true"
            className="mb-8 h-1.5 w-16 rounded-full bg-gradient-to-r from-primary to-primary/30"
          />

          <h1 className="mb-4 font-display text-fluid-h3 font-black uppercase tracking-tighter text-on-surface">
            Something went wrong
          </h1>

          <p className="mb-8 max-w-md text-base leading-relaxed text-on-surface-variant">
            We couldn&apos;t load the page content right now. This is usually
            temporary — a quick retry should get things back to normal.
          </p>

          <button
            onClick={() => reset()}
            className="rounded-br-xl rounded-tl-xl border border-primary/20 bg-primary/10 px-8 py-3 font-mono text-sm uppercase tracking-widest text-primary transition-all hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Try again
          </button>

          <p className="mt-12 text-xs text-on-surface-variant/50">
            If the problem persists, please try again later.
          </p>
        </main>
      </body>
    </html>
  );
}
