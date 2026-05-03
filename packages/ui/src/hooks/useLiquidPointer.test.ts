/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useLiquidPointer } from "./useLiquidPointer";

const installMatchMedia = (reducedMotion: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches:
        query.includes("prefers-reduced-motion") && reducedMotion ? true : false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  });
};

const dispatchPointerMove = (clientX: number, clientY: number) => {
  const event = new Event("pointermove") as PointerEvent;
  Object.assign(event, { clientX, clientY });
  window.dispatchEvent(event);
};

const flushRaf = () => {
  vi.runOnlyPendingTimers();
};

describe("useLiquidPointer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    installMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.documentElement.removeAttribute("style");
  });

  it("returns a stable ref store and does not rerender on pointer move", () => {
    let renderCount = 0;
    const { result } = renderHook(() => {
      renderCount += 1;
      return useLiquidPointer();
    });

    const initialRenders = renderCount;
    expect(result.current.pointerRef.current).toEqual({
      mx: 0.5,
      my: 0.5,
      vx: 0,
      vy: 0,
    });

    act(() => {
      dispatchPointerMove(800, 400);
      flushRaf();
    });

    expect(renderCount).toBe(initialRenders);
    expect(result.current.pointerRef.current.mx).not.toBe(0.5);
  });

  it("writes CSS custom properties --mx, --my, --vx, --vy on the target element", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({
        left: 0,
        top: 0,
        width: 1000,
        height: 500,
        right: 1000,
        bottom: 500,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    });

    const targetRef = { current: target };
    renderHook(() => useLiquidPointer({ targetRef }));

    act(() => {
      dispatchPointerMove(500, 250);
      flushRaf();
    });

    expect(target.style.getPropertyValue("--mx")).toBe("0.500");
    expect(target.style.getPropertyValue("--my")).toBe("0.500");
    expect(target.style.getPropertyValue("--vx")).not.toBe("");
    expect(target.style.getPropertyValue("--vy")).not.toBe("");

    target.remove();
  });

  it("removes the pointer listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLiquidPointer());
    unmount();
    const removed = removeSpy.mock.calls.some(
      ([type]) => type === "pointermove",
    );
    expect(removed).toBe(true);
  });

  it("skips listener attachment when prefers-reduced-motion is on", () => {
    installMatchMedia(true);
    const addSpy = vi.spyOn(window, "addEventListener");

    renderHook(() => useLiquidPointer());

    const attached = addSpy.mock.calls.some(
      ([type]) => type === "pointermove",
    );
    expect(attached).toBe(false);
  });
});
