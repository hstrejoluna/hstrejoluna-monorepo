"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface LiquidPointerState {
  /** Normalized X position 0..1 within the target (or viewport). */
  mx: number;
  /** Normalized Y position 0..1 within the target (or viewport). */
  my: number;
  /** Normalized X velocity (delta per frame) clamped to [-1, 1]. */
  vx: number;
  /** Normalized Y velocity clamped to [-1, 1]. */
  vy: number;
}

export interface UseLiquidPointerOptions {
  /** Element to scope coordinates to. Defaults to the viewport. */
  targetRef?: RefObject<HTMLElement | null>;
  /** Element to receive `--mx/--my/--vx/--vy` CSS custom properties. Falls back to `targetRef` then `document.documentElement`. */
  cssTargetRef?: RefObject<HTMLElement | null>;
}

export interface UseLiquidPointerResult {
  pointerRef: RefObject<LiquidPointerState>;
}

const INITIAL: LiquidPointerState = { mx: 0.5, my: 0.5, vx: 0, vy: 0 };
const VELOCITY_DAMPING = 0.85;
const VELOCITY_GAIN = 4;

const isBrowser = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function";

const prefersReducedMotion = (): boolean => {
  if (!isBrowser()) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export function useLiquidPointer(
  options: UseLiquidPointerOptions = {},
): UseLiquidPointerResult {
  const pointerRef = useRef<LiquidPointerState>({ ...INITIAL });
  const optsRef = useRef(options);
  optsRef.current = options;

  useEffect(() => {
    if (!isBrowser()) return;
    if (prefersReducedMotion()) return;

    let rafId = 0;
    let pendingX = 0;
    let pendingY = 0;
    let hasPending = false;
    let lastMx = INITIAL.mx;
    let lastMy = INITIAL.my;

    const writeFrame = () => {
      rafId = 0;
      if (!hasPending) return;
      hasPending = false;

      const target = optsRef.current.targetRef?.current ?? null;
      let width = window.innerWidth;
      let height = window.innerHeight;
      let originX = 0;
      let originY = 0;
      if (target) {
        const rect = target.getBoundingClientRect();
        width = rect.width || width;
        height = rect.height || height;
        originX = rect.left;
        originY = rect.top;
      }

      const mx = clamp((pendingX - originX) / Math.max(width, 1), 0, 1);
      const my = clamp((pendingY - originY) / Math.max(height, 1), 0, 1);
      const rawVx = (mx - lastMx) * VELOCITY_GAIN;
      const rawVy = (my - lastMy) * VELOCITY_GAIN;
      const vx = clamp(
        pointerRef.current.vx * VELOCITY_DAMPING + rawVx,
        -1,
        1,
      );
      const vy = clamp(
        pointerRef.current.vy * VELOCITY_DAMPING + rawVy,
        -1,
        1,
      );

      pointerRef.current.mx = mx;
      pointerRef.current.my = my;
      pointerRef.current.vx = vx;
      pointerRef.current.vy = vy;
      lastMx = mx;
      lastMy = my;

      const cssTarget =
        optsRef.current.cssTargetRef?.current ??
        optsRef.current.targetRef?.current ??
        document.documentElement;
      cssTarget.style.setProperty("--mx", mx.toFixed(3));
      cssTarget.style.setProperty("--my", my.toFixed(3));
      cssTarget.style.setProperty("--vx", vx.toFixed(3));
      cssTarget.style.setProperty("--vy", vy.toFixed(3));
    };

    const onPointerMove = (event: PointerEvent) => {
      pendingX = event.clientX;
      pendingY = event.clientY;
      hasPending = true;
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(writeFrame);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return { pointerRef };
}
