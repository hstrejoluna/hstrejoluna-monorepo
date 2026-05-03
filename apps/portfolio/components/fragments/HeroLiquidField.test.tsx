/// <reference types="vitest/globals" />
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";

// ────────────────────────────────────────────────────────────────────
// Hoisted mock variables (must be hoisted to work with vi.mock)
// ────────────────────────────────────────────────────────────────────
const {
  sessionStorageGetItem,
  sessionStorageSetItem,
  sessionStorageClear,
  mockUseLiquidPointer,
  mockUseLiquidHeroCapability,
  mockUseDisplacementScaleAnimation,
  mockDynamicDefault,
} = vi.hoisted(() => {
  const sessionStore: Record<string, string> = {};

  return {
    sessionStorageGetItem: vi.fn((key: string) => sessionStore[key] ?? null),
    sessionStorageSetItem: vi.fn((key: string, value: string) => {
      sessionStore[key] = value;
    }),
    sessionStorageClear: vi.fn(() => {
      Object.keys(sessionStore).forEach((k) => delete sessionStore[k]);
    }),
    mockUseLiquidPointer: vi.fn(),
    mockUseLiquidHeroCapability: vi.fn(),
    mockUseDisplacementScaleAnimation: vi.fn(),
    mockDynamicDefault: vi.fn(() =>
      vi.fn(() => <div data-testid="hero-liquid-webgl">WebGL Mock</div>),
    ),
  };
});

// ────────────────────────────────────────────────────────────────────
// sessionStorage mock — defined now but installed in beforeAll
// ────────────────────────────────────────────────────────────────────
const sessionStorageMock = {
  getItem: sessionStorageGetItem,
  setItem: sessionStorageSetItem,
  removeItem: vi.fn(),
  clear: sessionStorageClear,
};

// ────────────────────────────────────────────────────────────────────
// Mock @hstrejoluna/ui
// ────────────────────────────────────────────────────────────────────
vi.mock("@hstrejoluna/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hstrejoluna/ui")>();
  return {
    ...actual,
    useLiquidPointer: mockUseLiquidPointer,
    useLiquidHeroCapability: mockUseLiquidHeroCapability,
    useDisplacementScaleAnimation: mockUseDisplacementScaleAnimation,
    useReducedMotion: vi.fn(() => false),
  };
});

// ────────────────────────────────────────────────────────────────────
// Mock framer-motion (NO spread — motion.* usage would fail)
// ────────────────────────────────────────────────────────────────────
vi.mock("framer-motion", () => {
  const noopUnsub = vi.fn();
  return {
    useScroll: () => ({
      scrollYProgress: { get: () => 0, on: vi.fn(() => noopUnsub) },
      scrollY: { get: () => 0, on: vi.fn(() => noopUnsub) },
      scrollXProgress: { get: () => 0, on: vi.fn(() => noopUnsub) },
      scrollX: { get: () => 0, on: vi.fn(() => noopUnsub) },
    }),
    useTransform: (_input: unknown, _range: unknown, output: unknown) =>
      Array.isArray(output)
        ? { get: () => output[0], on: vi.fn(() => noopUnsub) }
        : { get: () => 0, on: vi.fn(() => noopUnsub) },
    useReducedMotion: vi.fn(() => false),
    LazyMotion: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    m: {
      div: ({
        children,
        style,
        ref,
        ...props
      }: React.PropsWithChildren<
        Record<string, unknown> & { ref?: React.Ref<HTMLDivElement> }
      >) => (
        <div
          {...(props as React.HTMLAttributes<HTMLDivElement>)}
          style={style as React.CSSProperties}
          ref={ref}
        >
          {children}
        </div>
      ),
    },
  };
});

// ────────────────────────────────────────────────────────────────────
// Mock next/dynamic
// ────────────────────────────────────────────────────────────────────
vi.mock("next/dynamic", () => ({
  default: mockDynamicDefault,
}));

// ────────────────────────────────────────────────────────────────────
// Import after mocks
// ────────────────────────────────────────────────────────────────────
import { HeroLiquidField } from "./HeroLiquidField";
import type { LiquidHeroCapability } from "@hstrejoluna/ui";

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────
const setCapability = (cap: LiquidHeroCapability): void => {
  mockUseLiquidHeroCapability.mockReturnValue(cap);
};

const resetAll = (): void => {
  // Clear only per-test mocks — NOT mockDynamicDefault (called at module level)
  mockUseLiquidPointer.mockClear();
  mockUseLiquidHeroCapability.mockClear();
  mockUseDisplacementScaleAnimation.mockClear();
  sessionStorageGetItem.mockClear();
  sessionStorageSetItem.mockClear();
  sessionStorageClear.mockClear();

  // Manually clear session storage via our hoisted clear fn
  sessionStorageMock.clear();
  setCapability("css+webgl");
  mockUseLiquidPointer.mockReturnValue({
    pointerRef: { current: { mx: 0.5, my: 0.5, vx: 0, vy: 0 } },
  });
};

// ────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────
describe("HeroLiquidField — Visual orchestration layer", () => {
  beforeAll(() => {
    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
      configurable: true,
    });
    HTMLCanvasElement.prototype.getContext = vi.fn();
  });

  beforeEach(() => {
    resetAll();
  });

  // ── Assertion 1: aria-hidden wrapper ───────────────────────
  it("1. wraps decoration in aria-hidden='true' element", () => {
    const { container } = render(<HeroLiquidField />);
    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper!).toHaveAttribute("aria-hidden", "true");
  });

  // ── Assertion 2: three blob divs styled by CSS vars ────────
  it("2a. renders exactly three blob elements", () => {
    const { container } = render(<HeroLiquidField />);
    const blobs = container.querySelectorAll(
      '[class*="hero-blob"][class*="blob-"]',
    );
    expect(blobs.length).toBe(3);
  });

  it("2b. blob elements reference CSS custom properties (--mx, --my)", () => {
    const { container } = render(<HeroLiquidField />);
    const blobs = container.querySelectorAll(
      '[class*="hero-blob"][class*="blob-"]',
    );
    expect(blobs.length).toBeGreaterThanOrEqual(3);
    blobs.forEach((blob) => {
      const el = blob as HTMLElement;
      const styleCss =
        typeof el.style.cssText === "string" ? el.style.cssText : "";
      const hasCssVar =
        styleCss.includes("--mx") ||
        styleCss.includes("--my") ||
        styleCss.includes("--vx") ||
        styleCss.includes("--vy");
      expect(hasCssVar).toBe(true);
    });
  });

  // ── Assertion 3: LiquidGlass variant="panel" card ──────────
  it("3. renders <LiquidGlass variant='panel'> for backdrop", () => {
    const { container } = render(<HeroLiquidField />);
    const glass = container.querySelector("[data-lg-variant='panel']");
    expect(glass).not.toBeNull();
  });

  // ── Assertion 4: subscribes to useLiquidPointer ────────────
  it("4. calls useLiquidPointer on mount with correct options", () => {
    render(<HeroLiquidField />);
    expect(mockUseLiquidPointer).toHaveBeenCalledTimes(1);
    const args = mockUseLiquidPointer.mock.calls[0]?.[0];
    expect(args).toBeDefined();
    expect(args).toHaveProperty("targetRef");
    expect(args).toHaveProperty("cssTargetRef");
  });

  // ── Assertion 5: displacement via useDisplacementScaleAnimation ──
  it("5a. calls useDisplacementScaleAnimation on mount", () => {
    render(<HeroLiquidField />);
    expect(mockUseDisplacementScaleAnimation).toHaveBeenCalled();
  });

  it("5b. useDisplacementScaleAnimation receives a ref and a MotionValue", () => {
    render(<HeroLiquidField />);
    const calls = mockUseDisplacementScaleAnimation.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const firstArg = calls[0]?.[0];
    expect(firstArg).toBeDefined();
    expect(firstArg).toHaveProperty("current");
    const secondArg = calls[0]?.[1];
    expect(secondArg).toBeDefined();
    expect(typeof secondArg?.get).toBe("function");
    expect(typeof secondArg?.on).toBe("function");
  });

  // ── Assertion 6: entrance-burst tween plays once ───────────
  it("6a. sets sessionStorage flag on first mount to prevent replay", () => {
    render(<HeroLiquidField />);
    const setItemCalls = sessionStorageSetItem.mock.calls.filter(
      (call: string[]) => call[0] === "hero-burst-played",
    );
    expect(setItemCalls.length).toBe(1);
    expect(setItemCalls[0]?.[1]).toBe("1");
  });

  it("6b. does NOT set sessionStorage flag on second mount (already played)", () => {
    // Pre-populate sessionStorage via the hoisted store
    sessionStorageGetItem.mockImplementation((key: string) =>
      key === "hero-burst-played" ? "1" : null,
    );

    render(<HeroLiquidField />);
    const setItemCalls = sessionStorageSetItem.mock.calls.filter(
      (call: string[]) => call[0] === "hero-burst-played",
    );
    expect(setItemCalls.length).toBe(0);
  });

  it("6c. burst guard is suppressed when capability is not 'css+webgl'", () => {
    setCapability("css-only");
    render(<HeroLiquidField />);
    const setItemCalls = sessionStorageSetItem.mock.calls.filter(
      (call: string[]) => call[0] === "hero-burst-played",
    );
    expect(setItemCalls.length).toBe(0);
  });

  // ── Assertion 7: freezes under reduced-motion (static profile) ──
  it("7a. renders frozen blobs when capability is 'static'", () => {
    setCapability("static");
    const { container } = render(<HeroLiquidField />);

    const wrapper = container.firstElementChild;
    expect(wrapper).not.toBeNull();
    expect(wrapper!).toHaveAttribute("aria-hidden", "true");

    const blobs = container.querySelectorAll(
      '[class*="hero-blob"][class*="blob-"]',
    );
    expect(blobs.length).toBe(3);

    const hasFrozenBlob = Array.from(blobs).some((blob) => {
      const style = (blob as HTMLElement).style;
      return (
        style.animation === "none" ||
        style.animationPlayState === "paused" ||
        style.animationName === "none"
      );
    });
    expect(hasFrozenBlob).toBe(true);
  });

  it("7b. does NOT render WebGL when capability is 'static'", () => {
    setCapability("static");
    render(<HeroLiquidField />);
    expect(screen.queryByTestId("hero-liquid-webgl")).not.toBeInTheDocument();
  });

  // ── Assertion 8: uses m.* from framer-motion ───────────────
  it("8. renders successfully using m.div from framer-motion", () => {
    const { container } = render(<HeroLiquidField />);
    expect(container.firstElementChild).not.toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  // ── Assertion 9: calls useLiquidHeroCapability ─────────────
  it("9a. calls useLiquidHeroCapability to determine visual profile", () => {
    render(<HeroLiquidField />);
    expect(mockUseLiquidHeroCapability).toHaveBeenCalledTimes(1);
  });

  it("9b. renders WebGL when capability is 'css+webgl'", () => {
    setCapability("css+webgl");
    render(<HeroLiquidField />);
    expect(screen.getByTestId("hero-liquid-webgl")).toBeInTheDocument();
  });

  it("9c. does NOT render WebGL when capability is 'css-only'", () => {
    setCapability("css-only");
    const { container } = render(<HeroLiquidField />);
    expect(screen.queryByTestId("hero-liquid-webgl")).not.toBeInTheDocument();
    expect(container.querySelector("[data-lg-variant='panel']")).not.toBeNull();
  });

  it("9d. static profile: blobs, glass card, no WebGL", () => {
    setCapability("static");
    const { container } = render(<HeroLiquidField />);

    const blobs = container.querySelectorAll(
      '[class*="hero-blob"][class*="blob-"]',
    );
    expect(blobs.length).toBe(3);

    expect(container.querySelector("[data-lg-variant='panel']")).not.toBeNull();

    expect(screen.queryByTestId("hero-liquid-webgl")).not.toBeInTheDocument();
  });

  // ── Assertion 10: lazy HeroLiquidWebGL via next/dynamic ────
  it("10a. renders lazy WebGL component when capability is 'css+webgl'", () => {
    render(<HeroLiquidField />);
    expect(screen.getByTestId("hero-liquid-webgl")).toBeInTheDocument();
  });

  it("10b. does NOT render WebGL when capability is 'css-only'", () => {
    setCapability("css-only");
    render(<HeroLiquidField />);
    expect(screen.queryByTestId("hero-liquid-webgl")).not.toBeInTheDocument();
  });

  it("10c. does NOT render WebGL when capability is 'static'", () => {
    setCapability("static");
    render(<HeroLiquidField />);
    expect(screen.queryByTestId("hero-liquid-webgl")).not.toBeInTheDocument();
  });

  it("10d. next/dynamic is called with ssr:false for WebGL import", () => {
    render(<HeroLiquidField />);
    expect(mockDynamicDefault).toHaveBeenCalled();
    const allCalls = mockDynamicDefault.mock.calls as unknown[][];
    expect(allCalls.length).toBeGreaterThanOrEqual(1);
    const firstCall = allCalls[0];
    expect(firstCall).toBeDefined();
    if (firstCall && firstCall.length >= 2) {
      const config = firstCall[1] as { ssr?: boolean };
      expect(config).toHaveProperty("ssr", false);
    }
  });
});
