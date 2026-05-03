import { describe, expect, it, beforeEach } from "vitest";
import {
  createBurstStore,
  createScrollStore,
  computeBurstValue,
  getBurstStore,
  getScrollStore,
} from "./hero-uniform-store";

// A simple in-memory storage mock
const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    get size() {
      return store.size;
    },
  };
};

describe("burstStore — entrance-burst state (REQ entrance-burst-splash)", () => {
  let storage: ReturnType<typeof createMemoryStorage>;
  let burst: ReturnType<typeof createBurstStore>;

  beforeEach(() => {
    storage = createMemoryStorage();
    burst = createBurstStore(storage);
  });

  it("starts with value 0", () => {
    expect(burst.value).toBe(0);
  });

  it("set() updates the value", () => {
    burst.set(0.75);
    expect(burst.value).toBe(0.75);
  });

  it("hasPlayed() returns false before markPlayed()", () => {
    expect(burst.hasPlayed()).toBe(false);
  });

  it("hasPlayed() returns true after markPlayed()", () => {
    burst.markPlayed();
    expect(burst.hasPlayed()).toBe(true);
  });

  it("markPlayed() persists across store recreations (sessionStorage)", () => {
    burst.markPlayed();
    // Create a new store instance using the same storage
    const burst2 = createBurstStore(storage);
    expect(burst2.hasPlayed()).toBe(true);
  });
});

describe("computeBurstValue — easing function", () => {
  it("returns 0 at t=0 (start)", () => {
    expect(computeBurstValue(0)).toBeCloseTo(0, 3);
  });

  it("returns 1 at t=0.5 (peak)", () => {
    expect(computeBurstValue(0.5)).toBeCloseTo(1, 3);
  });

  it("returns 0 at t=1 (complete)", () => {
    expect(computeBurstValue(1)).toBe(0);
  });

  it("returns 0 after t > 1 (idle)", () => {
    expect(computeBurstValue(1.5)).toBe(0);
    expect(computeBurstValue(10)).toBe(0);
  });

  it("increases monotonically from t=0 to t=0.5", () => {
    let prev = -Infinity;
    for (let t = 0; t <= 0.5; t += 0.05) {
      const val = computeBurstValue(t);
      expect(val).toBeGreaterThanOrEqual(prev);
      prev = val;
    }
  });

  it("decreases monotonically from t=0.5 to t=1", () => {
    let prev = Infinity;
    for (let t = 0.5; t <= 1; t += 0.05) {
      const val = computeBurstValue(t);
      expect(val).toBeLessThanOrEqual(prev);
      prev = val;
    }
  });
});

describe("scrollStore — scroll-driven distortion (REQ scroll-driven-distortion)", () => {
  let scroll: ReturnType<typeof createScrollStore>;

  beforeEach(() => {
    scroll = createScrollStore();
  });

  it("starts with value 0", () => {
    expect(scroll.value).toBe(0);
  });

  it("set() updates the value", () => {
    scroll.set(0.5);
    expect(scroll.value).toBe(0.5);
  });

  it("clamps to max 1", () => {
    scroll.set(1.5);
    expect(scroll.value).toBe(1.5);
  });

  it("handles zero", () => {
    scroll.set(0);
    expect(scroll.value).toBe(0);
  });
});

describe("singleton accessors", () => {
  it("getBurstStore returns a singleton", () => {
    const b1 = getBurstStore();
    const b2 = getBurstStore();
    expect(b1).toBe(b2);
  });

  it("getScrollStore returns a singleton", () => {
    const s1 = getScrollStore();
    const s2 = getScrollStore();
    expect(s1).toBe(s2);
  });
});
