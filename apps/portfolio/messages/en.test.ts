import { describe, expect, it } from "vitest";
import en from "./en.json";

const REQUIRED_NAMESPACES = [
  "common",
  "hero",
  "nav",
  "footer",
  "cookie",
  "seo",
  "brand",
  "legal",
] as const;

describe("messages/en.json", () => {
  it("is a valid parseable JSON object", () => {
    expect(en).toBeDefined();
    expect(typeof en).toBe("object");
    expect(en).not.toBeNull();
    expect(Array.isArray(en)).toBe(false);
  });

  it("contains all required namespaces", () => {
    const keys = Object.keys(en);
    for (const ns of REQUIRED_NAMESPACES) {
      expect(keys).toContain(ns);
    }
  });

  it("has no extra top-level keys beyond required namespaces", () => {
    const keys = Object.keys(en);
    for (const key of keys) {
      expect(REQUIRED_NAMESPACES as readonly string[]).toContain(key);
    }
  });

  it("has non-empty objects for each namespace", () => {
    for (const ns of REQUIRED_NAMESPACES) {
      const namespace = (en as Record<string, Record<string, unknown>>)[ns];
      expect(Object.keys(namespace).length).toBeGreaterThan(0);
    }
  });

  describe("brand namespace invariance", () => {
    it("contains HUD/cyberpunk terms as English-only values", () => {
      const brand = (en as Record<string, Record<string, unknown>>).brand;
      expect(brand.systemOverride).toBe("SYSTEM_OVERRIDE");
      expect(brand.systemReady).toBe("[SYSTEM_READY]: INITIALIZING_NEURAL_UPLINK");
      expect(brand.uplink).toBe("UPLINK_STATUS: OPTIMAL");
      expect(brand.descent).toBe("DESCENT");
    });

    it("has all brand values as uppercase English strings", () => {
      const brand = (en as Record<string, Record<string, unknown>>).brand;
      for (const [key, value] of Object.entries(brand)) {
        expect(typeof value).toBe("string");
        // Brand terms use only ASCII and allowed punctuation
        expect(value).toMatch(/^[A-Z0-9_\[\]:.\s]+$/);
      }
    });
  });
});
