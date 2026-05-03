"use client";

import { useEffect, useState } from "react";

import { useLiquidGlassGates } from "../liquid-glass/use-liquid-glass-gates";

export type LiquidHeroCapability = "static" | "css-only" | "css+webgl";

const HARDWARE_FLOOR = 4;
const HD_QUERY = "(min-width: 1024px)";

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const isBrowser = (): boolean => typeof window !== "undefined";

const probeWebGL2 = (): boolean => {
  if (!isBrowser()) return false;
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
};

const hdViewportMatches = (): boolean => {
  if (!isBrowser()) return false;
  try {
    return window.matchMedia(HD_QUERY).matches;
  } catch {
    return false;
  }
};

const hasIntersectionObserver = (): boolean =>
  isBrowser() &&
  typeof (window as unknown as { IntersectionObserver?: unknown })
    .IntersectionObserver === "function";

const saveDataOn = (): boolean => {
  if (!isBrowser()) return false;
  const conn = (navigator as NavigatorWithConnection).connection;
  return Boolean(conn?.saveData);
};

const hardwareEnough = (): boolean => {
  if (!isBrowser()) return false;
  const cores = navigator.hardwareConcurrency ?? 0;
  return cores >= HARDWARE_FLOOR;
};

export function useLiquidHeroCapability(): LiquidHeroCapability {
  const gates = useLiquidGlassGates();
  const [capability, setCapability] = useState<LiquidHeroCapability>("static");

  useEffect(() => {
    if (gates.reduceMotion || gates.reduceTransparency) {
      setCapability("static");
      return;
    }
    if (!hasIntersectionObserver()) {
      setCapability("static");
      return;
    }
    if (
      !hdViewportMatches() ||
      !hardwareEnough() ||
      saveDataOn() ||
      gates.reduceData ||
      !gates.supportsRefraction ||
      !probeWebGL2()
    ) {
      setCapability("css-only");
      return;
    }
    setCapability("css+webgl");
  }, [
    gates.reduceMotion,
    gates.reduceTransparency,
    gates.reduceData,
    gates.supportsRefraction,
    gates.isMobile,
  ]);

  return capability;
}
