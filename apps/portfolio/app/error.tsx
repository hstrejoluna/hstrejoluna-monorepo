"use client";

import { useEffect } from "react";

/**
 * Root Error Boundary — app/error.tsx
 *
 * Catches layout-level failures (fonts, i18n, GTM, NextIntlClientProvider)
 * that occur before any locale-scoped rendering. Renders a minimalist shell
 * because the full layout (including CSS, fonts, i18n) may not have loaded.
 *
 * Spec: portfolio-error-resilience / Requirement: Root Error Boundary
 * Design: ADR-2 — minimalist shell, "try again" link, non-200 response
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("RootError boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#131313",
          color: "#e2e2e2",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <main
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "28rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "1rem",
              color: "#e2e2e2",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "rgba(226, 226, 226, 0.6)",
              marginBottom: "2rem",
            }}
          >
            An unexpected error occurred. Please try reloading the page.
          </p>

          <button
            onClick={() => reset()}
            style={{
              background: "rgba(255, 180, 165, 0.1)",
              border: "1px solid rgba(255, 180, 165, 0.2)",
              color: "#ffb4a5",
              padding: "0.75rem 2rem",
              fontSize: "0.8125rem",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              cursor: "pointer",
              borderRadius: "0 1rem 1rem 0",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
