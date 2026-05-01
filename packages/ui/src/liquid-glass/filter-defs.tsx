/**
 * Filter id constants and JSX builders for the document-global
 * <LiquidGlassFilters /> defs.
 *
 * - `LG_VARIANTS`: the canonical ordered tuple of variants.
 * - `LG_FILTER_IDS`: stable id per variant — referenced by CSS via
 *   `backdrop-filter: url(#lg-refraction-{variant})` (REQ-2 S2.2).
 * - `LG_RESTING_SCALE`: pixel amplitude of the refraction at rest, per
 *   variant. The default `<feDisplacementMap scale>` attribute is
 *   initialized from this lookup (design §3 and §7).
 * - `renderFilter`: returns the JSX subtree for one filter — kept here so
 *   <LiquidGlassFilters /> can map over LG_VARIANTS without inlining
 *   filter graphs.
 */
import { Fragment, type ReactElement } from "react";
import { LG_DISPLACEMENT_MAPS } from "./displacement-maps";
import type { LiquidGlassVariant } from "./types";

export const LG_VARIANTS = [
  "panel",
  "pill",
  "dock",
  "circle",
  "dialog",
] as const satisfies readonly LiquidGlassVariant[];

export const LG_FILTER_IDS: Readonly<Record<LiquidGlassVariant | "gooey", string>> =
  Object.freeze({
    panel: "lg-refraction-panel",
    pill: "lg-refraction-pill",
    dock: "lg-refraction-dock",
    circle: "lg-refraction-circle",
    dialog: "lg-refraction-dialog",
    gooey: "lg-gooey",
  });

/**
 * Filter for the "gooey" effect.
 * Combines a high blur with a color matrix that sharpens the alpha channel
 * to create the melting/fusing look between elements.
 */
export const renderGooeyFilter = (): ReactElement => (
  <filter id={LG_FILTER_IDS.gooey} x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
    <feColorMatrix
      in="blur"
      mode="matrix"
      values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
      result="gooey"
    />
    <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
  </filter>
);

/** Pixel amplitude of the refraction at rest, per variant (design §3). */
export const LG_RESTING_SCALE: Readonly<Record<LiquidGlassVariant, number>> =
  Object.freeze({
    panel: 9,
    pill: 6,
    dock: 12,
    circle: 8,
    dialog: 9,
  });

/**
 * Build the <filter> JSX for a single variant. Animations imperatively
 * mutate ONLY the `scale` attribute on the <feDisplacementMap> via a stable
 * ref (REQ-6). The map's <feImage> child is never rebuilt.
 */
export const renderFilter = (
  variant: LiquidGlassVariant,
  restingScale: number = LG_RESTING_SCALE[variant],
): ReactElement => (
  <filter
    key={LG_FILTER_IDS[variant]}
    id={LG_FILTER_IDS[variant]}
    x="-20%"
    y="-20%"
    width="140%"
    height="140%"
    filterUnits="objectBoundingBox"
    primitiveUnits="userSpaceOnUse"
  >
    <Fragment>
      {/* 1. Load the physical normal map (R/G vectors) */}
      <feImage
        href={LG_DISPLACEMENT_MAPS[variant]}
        x="0"
        y="0"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        result="dispMap"
      />
      
      {/* 2. Apply refraction using the normal map */}
      <feDisplacementMap
        in="SourceGraphic"
        in2="dispMap"
        scale={restingScale}
        xChannelSelector="R"
        yChannelSelector="G"
        result="refracted"
      />
      
      {/* 3. Soften the refracted image slightly */}
      <feGaussianBlur in="refracted" stdDeviation="0.8" result="softened" />
      
      {/* 4. Generate physically-based specular highlights from the same normal map */}
      <feColorMatrix
        in="dispMap"
        type="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 0 0 -1"
        result="bumpMap"
      />
      <feSpecularLighting
        in="bumpMap"
        surfaceScale="5"
        specularConstant="1.2"
        specularExponent="30"
        lightingColor="#ffffff"
        result="specularLight"
      >
        <fePointLight x="50" y="-50" z="200" />
      </feSpecularLighting>
      
      {/* 5. Composite everything together */}
      <feComposite
        in="specularLight"
        in2="softened"
        operator="arithmetic"
        k1="0"
        k2="1"
        k3="1"
        k4="0"
        result="litSurface"
      />
      
      <feMerge>
        <feMergeNode in="litSurface" />
      </feMerge>
    </Fragment>
  </filter>
);
