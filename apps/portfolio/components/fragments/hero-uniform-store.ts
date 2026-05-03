/**
 * Singletons for WebGL uniform state that must be read by `useFrame`
 * without triggering React re-renders (design §3.1, §3.3, §3.4).
 *
 * - `burstStore`: one-shot entrance burst (0→1→0 over 1200ms, once per page load)
 * - `scrollStore`: scroll progress [0, 1] — written by framer-motion, read by useFrame
 */

const BURST_KEY = "hero-liquid-burst-played";

export interface BurstStore {
  value: number;
  set: (v: number) => void;
  markPlayed: () => void;
  hasPlayed: () => boolean;
}

export interface ScrollStore {
  value: number;
  set: (v: number) => void;
}

export const createBurstStore = (
  storage: Pick<Storage, "getItem" | "setItem"> = typeof window !== "undefined"
    ? window.sessionStorage
    : (null as unknown as Storage),
): BurstStore => {
  const state = { value: 0 };
  return {
    get value() {
      return state.value;
    },
    set(v: number) {
      state.value = v;
    },
    /** Mark the burst as played so it never replays this page load. */
    markPlayed() {
      try {
        storage.setItem(BURST_KEY, "1");
      } catch {
        // sessionStorage may be unavailable (e.g., SSR, private browsing)
      }
    },
    /** Check if the burst has already played on this page load. */
    hasPlayed(): boolean {
      try {
        return storage.getItem(BURST_KEY) === "1";
      } catch {
        return false;
      }
    },
  };
};

export const createScrollStore = (): ScrollStore => {
  const state = { value: 0 };
  return {
    get value() {
      return state.value;
    },
    set(v: number) {
      state.value = v;
    },
  };
};

// Module-scoped singleton instances
let _burstStore: BurstStore | null = null;
let _scrollStore: ScrollStore | null = null;

export const getBurstStore = (): BurstStore => {
  if (!_burstStore) {
    _burstStore = createBurstStore();
  }
  return _burstStore;
};

export const getScrollStore = (): ScrollStore => {
  if (!_scrollStore) {
    _scrollStore = createScrollStore();
  }
  return _scrollStore;
};

/**
 * Pure function — burst easing over a 1200ms window.
 *
 * Phase: 0→0.5 = ease out cubic ramp up, 0.5→1 = ease in cubic ramp down.
 * After t ≥ 1, returns 0 (burst complete).
 */
export const computeBurstValue = (t: number): number => {
  if (t >= 1) return 0;
  if (t < 0.5) {
    // easeOutCubic on [0, 1] → then double the result
    return 1 - Math.pow(1 - t * 2, 3);
  }
  // easeInCubic on [0, 1] → 2*((t-0.5)*2)^3 → subtract from 1
  const phase2 = (t - 0.5) * 2;
  return 1 - Math.pow(phase2, 3);
};
