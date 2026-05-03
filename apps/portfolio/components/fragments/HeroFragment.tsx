"use client";

import { useEffect, useRef, useState } from "react";
import { m, type Variants } from "framer-motion";
import { Profile } from "@/types/sanity";
import { GlitchText, LiquidGlass } from "@hstrejoluna/ui";
import { useTranslations } from "next-intl";

interface HeroFragmentProps {
  profile: Profile | null;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 20 },
  },
};

const useSpotlightTracking = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const nextPositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      nextPositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        setMousePosition(nextPositionRef.current);
        rafRef.current = null;
      });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      container.addEventListener("mouseenter", handleMouseEnter);
      container.addEventListener("mouseleave", handleMouseLeave);
    }
    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { mousePosition, isHovering, containerRef };
};

const TelemetryPanel = ({
  uplink,
  latency,
  framework,
}: {
  uplink: string;
  latency: string;
  framework: string;
}) => (
  <div
    aria-hidden="true"
    className="absolute top-12 right-12 hidden xl:flex flex-col items-end font-mono text-[9px] text-white/30 tracking-[0.3em] uppercase"
  >
    <div className="mb-1 flex items-center gap-2">
      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
      {uplink}
    </div>
    <div className="mb-1">{latency}</div>
    <div>{framework}</div>
  </div>
);

const ScrollIndicator = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <m.button
    type="button"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2, duration: 1.5 }}
    className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer z-20 bg-transparent border-0 p-0"
    onClick={onClick}
  >
    <LiquidGlass
      as="span"
      variant="pill"
      intensity="low"
      className="flex flex-col items-center gap-3 rounded-full border border-white/10 px-3 py-4"
    >
      <span className="font-mono text-[8px] tracking-[0.5em] text-white/40 uppercase [writing-mode:vertical-lr] rotate-180">
        {label}
      </span>
      <div className="relative h-12 w-[1px] overflow-hidden md:h-16 bg-white/10">
        <m.div
          animate={{ y: [-48, 64] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="absolute top-0 h-8 w-full bg-gradient-to-b from-transparent via-ember to-transparent"
        />
      </div>
    </LiquidGlass>
  </m.button>
);

export const HeroFragment = ({ profile }: HeroFragmentProps) => {
  const tHero = useTranslations("hero");
  const tBrand = useTranslations("brand");
  const { mousePosition, isHovering, containerRef } = useSpotlightTracking();
  const titleLines = [tHero("titleLine1"), tHero("titleLine2")];

  const handleCTA = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };
  const heroHeadline = profile?.headline ?? tHero("headline");

  return (
    <section
      ref={containerRef}
      className="stream-fragment flex flex-col justify-end lg:justify-center pb-24 md:pb-32 px-4 sm:px-6 md:px-24 relative bg-void overflow-hidden min-h-[100svh]"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 hidden md:block"
        style={{
          opacity: isHovering ? 0.6 : 0,
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 86, 55, 0.08), transparent 50%)`,
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px] mix-blend-overlay"
      />

      <m.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="z-10 relative flex flex-col items-start w-full max-w-7xl mx-auto"
      >
        <m.div
          variants={itemVariants}
          className="font-mono text-[10px] md:text-xs tracking-[0.5em] text-ember mb-6 w-full uppercase flex items-center gap-4"
        >
          <span className="w-8 h-[1px] bg-ember/40 relative">
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-ember shadow-[0_0_10px_var(--color-ember)] rounded-full animate-pulse" />
          </span>
          {tBrand("systemReady")}
        </m.div>

        <m.div
          variants={itemVariants}
          className="flex flex-col gap-0 lg:gap-2 mb-8 md:mb-12"
        >
          {titleLines.map((part, i) => (
            <div key={part} className="relative w-max overflow-visible">
              <GlitchText
                text={part}
                active={i === 0}
                className={`text-[clamp(3.5rem,10vw,8.5rem)] font-black tracking-tighter leading-[0.85] uppercase italic group-hover:text-white/20 transition-colors duration-700 block w-full ${i === 1 ? "text-white/10" : "text-white"}`}
              />
            </div>
          ))}
        </m.div>

        <m.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:items-end w-full max-w-5xl"
        >
          <LiquidGlass
            variant="panel"
            className="relative p-5 md:p-8 rounded-tr-[40px] rounded-bl-[40px] border border-white/5 overflow-hidden group w-full lg:w-auto flex-1"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-ember to-transparent" />

            <p className="text-sm md:text-lg text-white/70 font-light leading-relaxed">
              {heroHeadline}
              <br />
              <span className="text-white/90 font-medium">
                {tHero("subheadline")}
              </span>
            </p>
          </LiquidGlass>

          <m.button
            onClick={handleCTA}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative overflow-hidden shrink-0 px-8 md:px-12 py-4 md:py-6 bg-transparent border border-ember/30 text-ember font-mono tracking-[0.3em] uppercase text-[10px] md:text-sm font-bold transition-all duration-300 hover:border-ember hover:text-white hover:shadow-[0_0_40px_rgba(255,86,55,0.2)] rounded-tl-[16px] rounded-br-[16px]"
          >
            <span className="relative z-10 transition-colors duration-300">
              {tHero("cta")}
            </span>
            <div className="absolute inset-0 bg-ember translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
          </m.button>
        </m.div>
      </m.div>

      <TelemetryPanel
        uplink={tBrand("uplink")}
        latency={tHero("telemetryLatency")}
        framework={tHero("telemetryFramework")}
      />

      <div
        aria-hidden="true"
        className="absolute bottom-6 right-6 md:bottom-12 md:right-12 font-mono text-[8px] md:text-[9px] text-white/20 tracking-[0.3em] text-right uppercase z-0"
      >
        <div className="mb-1">COORDS: 0.00.00° ALPHA</div>
        <div>OS: THE_VOID</div>
      </div>

      <ScrollIndicator onClick={handleCTA} label={tBrand("descent")} />
    </section>
  );
};
