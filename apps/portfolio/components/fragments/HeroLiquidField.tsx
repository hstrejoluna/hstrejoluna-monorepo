"use client";

import { useRef, useEffect, type ReactElement } from "react";
import dynamic from "next/dynamic";
import {
  useLiquidPointer,
  useLiquidHeroCapability,
  useDisplacementScaleAnimation,
  useReducedMotion,
  LiquidGlass,
  LG_FILTER_IDS,
} from "@hstrejoluna/ui";
import { m, useScroll, useTransform, type MotionValue } from "framer-motion";
import { getScrollStore } from "./hero-uniform-store";

// Lazy-load the WebGL layer inside the client boundary (design §5 / §13.1)
const HeroLiquidWebGLLazy = dynamic(
  () =>
    import("./HeroLiquidWebGL").then((mod) => ({
      default: mod.HeroLiquidWebGL,
    })),
  { ssr: false },
);

/**
 * HeroLiquidField — Client-side liquid glass visual layer.
 *
 * Renders three radial-gradient blob divs driven by CSS custom properties
 * from `useLiquidPointer`, a `<LiquidGlass variant="panel">` frosted card
 * behind the text content, and conditionally lazy-loads the WebGL
 * refraction layer when capability permits.
 *
 * Design contract: spec § "Liquid glass CSS layer", design §2.
 */
export const HeroLiquidField = (): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displacementRef = useRef<SVGFEDisplacementMapElement>(null);
  const isReducedMotion = useReducedMotion();
  const capability = useLiquidHeroCapability();

  // Cursor → CSS vars (zero React re-renders via ref store)
  useLiquidPointer({
    targetRef: containerRef,
    cssTargetRef: containerRef,
  });

  // ── Entrance burst guard — prevent replay on remount (design §3.3) ──
  const burstPlayed = useRef(false);
  useEffect(() => {
    if (capability !== "css+webgl" || burstPlayed.current) return;
    const key = "hero-burst-played";
    if (typeof window !== "undefined" && window.sessionStorage.getItem(key))
      return;
    burstPlayed.current = true;
    try {
      window.sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage may be unavailable (SSR / private browsing)
    }
    // Burst tween handled inside HeroLiquidWebGL's useFrame
  }, [capability]);

  // Scroll → distortion via framer-motion useScroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const distortionScale = useTransform(
    scrollYProgress,
    [0, 1],
    isReducedMotion ? [0, 0] : [0, 60],
  );

  // Bind scroll-driven scale to the displacement map
  useDisplacementScaleAnimation(
    displacementRef,
    distortionScale as MotionValue<number>,
  );

  // ── Scroll → scrollStore (consumed by HeroLiquidWebGL useFrame) ────
  useEffect(() => {
    const scrollStore = getScrollStore();
    // Subscribe to scrollYProgress changes — framer-motion MotionValue.on()
    // returns an unsubscribe function
    const unsubscribe = scrollYProgress.on("change", (value: number) => {
      scrollStore.set(value);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  // ── Static profile: frozen blobs, no animations, no WebGL ──────────
  if (capability === "static") {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      >
        {/* SVG Goo filter (still needed for LC static distortion) */}
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter
              id={LG_FILTER_IDS.gooey}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="10"
                result="blur"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                result="gooey"
              />
              <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
            </filter>
          </defs>
        </svg>

        {/* Frozen blob layers — static positions, no cursor follow */}
        <div
          className="absolute inset-0"
          style={{ filter: `url(#${LG_FILTER_IDS.gooey})` }}
        >
          {/* Blob 1 — primary, frozen */}
          <div
            className="hero-blob hero-blob-1 absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(255,86,55,0.3) 0%, rgba(255,86,55,0.05) 50%, transparent 70%)",
              left: "calc(0.5 * 100% - 30vw)",
              top: "calc(0.5 * 100% - 30vw)",
              filter: "blur(40px)",
              animation: "none",
            }}
          />

          {/* Blob 2 — secondary, frozen */}
          <div
            className="hero-blob hero-blob-2 absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(209,77,255,0.2) 0%, rgba(209,77,255,0.03) 60%, transparent 80%)",
              right: "calc(0.5 * 100% - 20vw)",
              bottom: "calc(0.5 * 100% - 20vw)",
              filter: "blur(50px)",
              animation: "none",
            }}
          />

          {/* Blob 3 — accent, frozen */}
          <div
            className="hero-blob hero-blob-3 absolute w-[30vw] h-[30vw] max-w-[350px] max-h-[350px] rounded-full opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.02) 60%, transparent 80%)",
              left: "calc(0.5 * 100% - 20vw)",
              bottom: "calc(0.5 * 100% - 25vw)",
              filter: "blur(35px)",
              animation: "none",
            }}
          />
        </div>

        {/* Glass card backdrop — always present */}
        <LiquidGlass
          variant="panel"
          intensity="high"
          className="absolute inset-x-4 md:inset-x-24 top-1/2 -translate-y-1/2 max-w-7xl mx-auto rounded-tr-[40px] rounded-bl-[40px] border border-white/5"
          style={{
            padding: "2rem",
            minHeight: "300px",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
    >
      {/* SVG Goo + Refraction filter definitions */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Gooey filter for blob merging */}
          <filter
            id={LG_FILTER_IDS.gooey}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>

          {/* Refraction filter with scroll-bound displacement */}
          <filter
            id="lg-hero-refraction"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="objectBoundingBox"
            primitiveUnits="userSpaceOnUse"
          >
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="0.5"
              result="blur"
            />
            <feDisplacementMap
              ref={displacementRef}
              in="blur"
              in2="gooey"
              scale={9}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur
              in="displaced"
              stdDeviation="0.8"
              result="softened"
            />
          </filter>
        </defs>
      </svg>

      {/* Three animated blob layers — driven by CSS vars --mx/--my */}
      <div
        className="absolute inset-0"
        style={{
          filter: `url(#${LG_FILTER_IDS.gooey})`,
          animationPlayState: isReducedMotion ? "paused" : "running",
        }}
      >
        {/* Blob 1 — primary */}
        <m.div
          className="hero-blob hero-blob-1 absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(255,86,55,0.3) 0%, rgba(255,86,55,0.05) 50%, transparent 70%)",
            left: `calc(var(--mx, 0.5) * 100% - 30vw)`,
            top: `calc(var(--my, 0.5) * 100% - 30vw)`,
            filter: "blur(40px)",
            animation: isReducedMotion
              ? "none"
              : "hero-blob-drift-1 8s ease-in-out infinite alternate",
          }}
        />

        {/* Blob 2 — secondary */}
        <m.div
          className="hero-blob hero-blob-2 absolute w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(209,77,255,0.2) 0%, rgba(209,77,255,0.03) 60%, transparent 80%)",
            right: `calc((1 - var(--mx, 0.5)) * 100% - 20vw)`,
            bottom: `calc((1 - var(--my, 0.5)) * 100% - 20vw)`,
            filter: "blur(50px)",
            animation: isReducedMotion
              ? "none"
              : "hero-blob-drift-2 10s ease-in-out infinite alternate",
          }}
        />

        {/* Blob 3 — accent */}
        <m.div
          className="hero-blob hero-blob-3 absolute w-[30vw] h-[30vw] max-w-[350px] max-h-[350px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.02) 60%, transparent 80%)",
            left: `calc(var(--mx, 0.5) * 100% - 20vw)`,
            bottom: `calc((1 - var(--my, 0.5)) * 100% - 25vw)`,
            filter: "blur(35px)",
            animation: isReducedMotion
              ? "none"
              : "hero-blob-drift-3 12s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Glass card backdrop — sits behind text, provides contrast */}
      <LiquidGlass
        variant="panel"
        intensity="high"
        className="absolute inset-x-4 md:inset-x-24 top-1/2 -translate-y-1/2 max-w-7xl mx-auto rounded-tr-[40px] rounded-bl-[40px] border border-white/5"
        style={{
          padding: "2rem",
          minHeight: "300px",
        }}
      />

      {/* WebGL refraction layer — lazy, capability-gated */}
      {capability === "css+webgl" && <HeroLiquidWebGLLazy />}
    </div>
  );
};
