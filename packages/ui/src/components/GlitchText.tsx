"use client";

import { useReducedMotion } from "@hstrejoluna/ui";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  active?: boolean;
}

/**
 * GlitchText Component
 * Implements a cinematic digital interference effect using CSS animations and chromatic aberration.
 * Respects 'prefers-reduced-motion' for accessibility.
 */
export const GlitchText = ({
  text,
  className = "",
  as: Component = "span",
  active = false,
}: GlitchTextProps) => {
  const isReducedMotion = useReducedMotion();
  const glitchClass =
    "absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none transition-opacity duration-100";

  // Only animate if reduced motion is NOT enabled
  const shouldAnimate = !isReducedMotion;

  return (
    <Component
      className={`relative inline-block group select-none ${className}`}
      data-text={text}
    >
      {/* Main Text Layer */}
      <span className="relative z-10 block">{text}</span>

      {/* Cyan Glitch Layer (Aberration) */}
      <span
        className={`
          ${glitchClass} 
          text-glitch-cyan 
          -left-[2px] 
          z-0 
          group-hover:opacity-70 
          ${shouldAnimate && active ? "opacity-70 animate-[glitch-anim-1_2s_infinite_linear_alternate-reverse]" : ""}
          ${shouldAnimate && !active ? "group-hover:animate-[glitch-anim-1_2s_infinite_linear_alternate-reverse]" : ""}
        `}
        aria-hidden="true"
      >
        {text}
      </span>

      {/* Magenta Glitch Layer (Aberration) */}
      <span
        className={`
          ${glitchClass} 
          text-glitch-magenta 
          left-[2px] 
          z-0 
          group-hover:opacity-70 
          ${shouldAnimate && active ? "opacity-70 animate-[glitch-anim-2_3s_infinite_linear_alternate-reverse]" : ""}
          ${shouldAnimate && !active ? "group-hover:animate-[glitch-anim-2_3s_infinite_linear_alternate-reverse]" : ""}
        `}
        aria-hidden="true"
      >
        {text}
      </span>
    </Component>
  );
};
