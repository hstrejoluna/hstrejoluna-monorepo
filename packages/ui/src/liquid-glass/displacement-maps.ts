/**
 * Inline displacement-map data URLs for the <feDisplacementMap> reference
 * image of each LiquidGlass variant. Each map is a tiny SVG that paints a
 * red/green normal-map gradient (R = x-displacement, G = y-displacement)
 * over the variant's geometry profile.
 *
 * Refined implementation based on https://kube.io/blog/liquid-glass-css-svg/
 * - RGB(128,128,x) is neutral (no displacement).
 * - Red > 128 pushes right, Red < 128 pushes left.
 * - Green > 128 pushes down, Green < 128 pushes up.
 * We use gradients to create a "lens" effect: flat center (128,128),
 * strong distortion at the edges to simulate glass thickness and refraction.
 */
import type { LiquidGlassVariant } from "./types";

const encode = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

// Panel: Soft rounded rectangle lens. Flat center, pushes outward at edges.
const panelSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="rgb(128,128,128)" />
      <stop offset="60%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(64,192,128)" />
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)" />
</svg>
`;

// Pill: Horizontal cylindrical lens. Flat middle band, distorts strongly top/bottom and far edges.
const pillSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gX" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgb(64,128,128)" />
      <stop offset="20%" stop-color="rgb(128,128,128)" />
      <stop offset="80%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(192,128,128)" />
    </linearGradient>
    <linearGradient id="gY" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgb(128,64,128)" />
      <stop offset="30%" stop-color="rgb(128,128,128)" />
      <stop offset="70%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(128,192,128)" />
    </linearGradient>
    <filter id="combine">
      <feImage href="#y-rect" result="y-map"/>
      <feBlend mode="screen" in="SourceGraphic" in2="y-map" />
    </filter>
  </defs>
  <rect id="y-rect" width="100" height="100" fill="url(#gY)" />
  <rect width="100" height="100" fill="url(#gX)" filter="url(#combine)" />
</svg>
`;

// Dock: Wide convex bar. Similar to pill but more rigid.
const dockSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gY" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgb(128,96,128)" />
      <stop offset="15%" stop-color="rgb(128,128,128)" />
      <stop offset="85%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(128,160,128)" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#gY)" />
</svg>
`;

// Circle: Perfect spherical lens.
const circleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgb(128,128,128)" />
      <stop offset="40%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(64,64,128)" />
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)" />
</svg>
`;

// Dialog: Large soft convex lens.
const dialogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="80%">
      <stop offset="0%" stop-color="rgb(128,128,128)" />
      <stop offset="70%" stop-color="rgb(128,128,128)" />
      <stop offset="100%" stop-color="rgb(96,160,128)" />
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#g)" />
</svg>
`;

export const LG_DISPLACEMENT_MAPS: Readonly<
  Record<LiquidGlassVariant, string>
> = Object.freeze({
  panel: encode(panelSvg),
  pill: encode(pillSvg),
  dock: encode(dockSvg),
  circle: encode(circleSvg),
  dialog: encode(dialogSvg),
});
