/**
 * <LiquidGlassFilters />
 *
 * Single document-global mount of the SVG <defs> consumed by every
 * <LiquidGlass> instance via `backdrop-filter: url(#lg-refraction-{variant})`.
 *
 * Mount once near the top of the layout tree (apps/portfolio mounts it in
 * `app/[locale]/layout.tsx` per ADR-5 / REQ-2). Remounting is cheap because
 * the filter ids are stable and route transitions do not unmount layouts.
 *
 * The SVG itself is hidden from layout (zero box) and from accessibility
 * trees (`aria-hidden`). The `data-lg-filters` attribute is the canonical
 * selector for tests and audits (S2.1, S2.3).
 */
import type { CSSProperties, ReactElement } from "react";
import { LG_VARIANTS, renderFilter, renderGooeyFilter } from "./filter-defs";

const hiddenSvgStyle: CSSProperties = {
  position: "absolute",
  width: 0,
  height: 0,
  overflow: "hidden",
  pointerEvents: "none",
};

/**
 * <LiquidGlassFilters />
 *
 * Renders the global SVG <defs> required for the refraction effects.
 * This component MUST be mounted once at the root of the application
 * (e.g., in the root layout) for <LiquidGlass /> instances to function
 * correctly in browsers supporting SVG filters as backdrop-filters.
 *
 * @returns An SVG element hidden from layout and accessibility trees.
 */
export const LiquidGlassFilters = (): ReactElement => (
  <svg
    aria-hidden="true"
    data-lg-filters=""
    focusable="false"
    style={hiddenSvgStyle}
  >
    <defs>
      {LG_VARIANTS.map((variant) => renderFilter(variant))}
      {renderGooeyFilter()}
    </defs>
  </svg>
);
