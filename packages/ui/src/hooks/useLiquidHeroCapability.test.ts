/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useLiquidHeroCapability } from "./useLiquidHeroCapability";

interface CapabilityFakeMatchers {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  reducedData: boolean;
  desktopFloor: boolean;
  hdViewport: boolean;
}

interface InstallOptions {
  matchers: Partial<CapabilityFakeMatchers>;
  hardwareConcurrency: number;
  saveData: boolean;
  webgl2: boolean;
  intersection: boolean;
}

const defaultMatchers: CapabilityFakeMatchers = {
  reducedMotion: false,
  reducedTransparency: false,
  reducedData: false,
  desktopFloor: true,
  hdViewport: true,
};

const queryFor = (
  matchers: CapabilityFakeMatchers,
  query: string,
): boolean => {
  if (query.includes("prefers-reduced-motion")) return matchers.reducedMotion;
  if (query.includes("prefers-reduced-transparency"))
    return matchers.reducedTransparency;
  if (query.includes("prefers-reduced-data")) return matchers.reducedData;
  if (query.includes("min-width: 1024")) return matchers.hdViewport;
  if (query.includes("min-width: 480")) return matchers.desktopFloor;
  return false;
};

const install = (options: InstallOptions) => {
  const matchers = { ...defaultMatchers, ...options.matchers };

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: queryFor(matchers, query),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });

  Object.defineProperty(navigator, "hardwareConcurrency", {
    configurable: true,
    value: options.hardwareConcurrency,
  });

  Object.defineProperty(navigator, "connection", {
    configurable: true,
    value: { saveData: options.saveData },
  });

  if (typeof CSS === "undefined") {
    Object.defineProperty(window, "CSS", {
      configurable: true,
      writable: true,
      value: {},
    });
  }
  Object.defineProperty(window.CSS as object, "supports", {
    configurable: true,
    writable: true,
    value: () => true,
  });

  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(
    contextId: string,
  ) {
    if (contextId === "webgl2") return options.webgl2 ? ({} as never) : null;
    return null;
  } as typeof HTMLCanvasElement.prototype.getContext;

  if (options.intersection) {
    class FakeIO implements IntersectionObserver {
      readonly root = null;
      readonly rootMargin = "";
      readonly thresholds = [];
      constructor(_cb: IntersectionObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    Object.defineProperty(window, "IntersectionObserver", {
      configurable: true,
      writable: true,
      value: FakeIO,
    });
  } else {
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
  }

  return () => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  };
};

describe("useLiquidHeroCapability", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    cleanup = undefined;
  });

  afterEach(() => {
    cleanup?.();
    vi.restoreAllMocks();
  });

  it("returns 'css+webgl' when desktop, hardwareConcurrency >= 4, no saveData, WebGL2 available, IO available", () => {
    cleanup = install({
      matchers: {},
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("css+webgl");
  });

  it("downgrades to 'css-only' when WebGL2 missing", () => {
    cleanup = install({
      matchers: {},
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: false,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("css-only");
  });

  it("downgrades to 'css-only' when viewport < 1024px", () => {
    cleanup = install({
      matchers: { hdViewport: false },
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("css-only");
  });

  it("downgrades to 'css-only' when hardwareConcurrency < 4", () => {
    cleanup = install({
      matchers: {},
      hardwareConcurrency: 2,
      saveData: false,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("css-only");
  });

  it("downgrades to 'css-only' when saveData is on", () => {
    cleanup = install({
      matchers: {},
      hardwareConcurrency: 8,
      saveData: true,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("css-only");
  });

  it("downgrades to 'static' when prefers-reduced-motion is on", () => {
    cleanup = install({
      matchers: { reducedMotion: true },
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("static");
  });

  it("downgrades to 'static' when prefers-reduced-transparency is on", () => {
    cleanup = install({
      matchers: { reducedTransparency: true },
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: true,
      intersection: true,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("static");
  });

  it("downgrades to 'static' when IntersectionObserver is missing", () => {
    cleanup = install({
      matchers: {},
      hardwareConcurrency: 8,
      saveData: false,
      webgl2: true,
      intersection: false,
    });

    const { result } = renderHook(() => useLiquidHeroCapability());
    expect(result.current).toBe("static");
  });
});
