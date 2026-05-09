import { describe, expect, it, vi } from "vitest";

// Mock createNextIntlPlugin to verify it's called correctly
const mockWithNextIntl = vi.fn((config: unknown) => config);
const mockCreatePlugin = vi.fn(() => mockWithNextIntl);

vi.mock("next-intl/plugin", () => ({
  default: mockCreatePlugin,
}));

describe("next.config.ts", () => {
  it("calls createNextIntlPlugin with the request config path", async () => {
    await import("./next.config");
    expect(mockCreatePlugin).toHaveBeenCalledWith("./i18n/request.ts");
  });

  it("wraps the config object through the plugin", async () => {
    await import("./next.config");
    expect(mockWithNextIntl).toHaveBeenCalledTimes(1);
    const wrappedConfig = mockWithNextIntl.mock.calls[0][0];
    expect(wrappedConfig).toHaveProperty("transpilePackages");
    expect(wrappedConfig).toHaveProperty("images");
    expect(wrappedConfig).toHaveProperty("rewrites");
  });

  it("includes all 6 security headers via async headers()", async () => {
    await import("./next.config");
    const wrappedConfig = mockWithNextIntl.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(wrappedConfig).toHaveProperty("headers");
    expect(typeof wrappedConfig.headers).toBe("function");

    const result = await (
      wrappedConfig.headers as () => Promise<
        Array<{
          source: string;
          headers: Array<{ key: string; value: string }>;
        }>
      >
    )();
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("/(.*)");

    const headerKeys = result[0].headers.map((h: { key: string }) => h.key);
    expect(headerKeys).toContain("Content-Security-Policy-Report-Only");
    expect(headerKeys).toContain("Strict-Transport-Security");
    expect(headerKeys).toContain("Cross-Origin-Opener-Policy");
    expect(headerKeys).toContain("X-Frame-Options");
    expect(headerKeys).toContain("X-Content-Type-Options");
    expect(headerKeys).toContain("Referrer-Policy");
  });

  it("CSP uses Report-Only header name and HSTS includes max-age", async () => {
    await import("./next.config");
    const wrappedConfig = mockWithNextIntl.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    const result = await (
      wrappedConfig.headers as () => Promise<
        Array<{
          source: string;
          headers: Array<{ key: string; value: string }>;
        }>
      >
    )();

    const cspHeader = result[0].headers.find(
      (h: { key: string }) => h.key === "Content-Security-Policy-Report-Only",
    );
    expect(cspHeader).toBeDefined();
    expect(cspHeader!.value).toContain("default-src 'self'");
    expect(cspHeader!.value).toContain("script-src");
    expect(cspHeader!.value).toContain("https://www.googletagmanager.com");
    expect(cspHeader!.value).toContain("img-src");
    expect(cspHeader!.value).toContain("https://cdn.sanity.io");

    const hstsHeader = result[0].headers.find(
      (h: { key: string }) => h.key === "Strict-Transport-Security",
    );
    expect(hstsHeader).toBeDefined();
    expect(hstsHeader!.value).toContain("max-age=63072000");
  });
});
