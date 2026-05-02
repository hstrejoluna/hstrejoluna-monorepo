# Delta Exploration: hero-liquid-glass-redesign

Original explore.md assumed a greenfield Liquid Glass surface area in `apps/portfolio` and `packages/ui`. PR #33 ("Apple iOS 26 Liquid Glass redesign", change `liquid-glass-immersion`) landed on master while PR #35 was merging the SDD planning artifacts. PR #33 ships a full Liquid Glass primitive set, mounts the SVG defs into the locale layout, and migrates the existing `HeroFragment` to consume the primitive. This delta scans the merged code and re-maps what is already done vs. what the locked design for `hero-liquid-glass-redesign` still needs.

---

## 1. What primitives now exist

Module: `packages/ui/src/liquid-glass/`

### `<LiquidGlass />` (LiquidGlass.tsx)
- **API**: polymorphic via `as`, props `{ variant: "panel"|"pill"|"dock"|"circle"|"dialog"; intensity?: "low"|"med"|"high"; className?; children?; ...native attrs }`. Forward ref. Writes `data-lg-variant`, `data-lg-intensity`, `data-lg-refraction`, `data-lg-fallback` data-attrs and a `--lg-backdrop-filter` CSS custom property.
- **Capability**: client component. Calls `useLiquidGlassGates`. CSS-first gating; JS hook only mirrors state to two narrow uses (refraction url + reduced-motion bridge). Does NOT gate hardwareConcurrency, viewport ≥ 1024px, WebGL2, saveData. Does gate `(min-width: 480px)` mobile floor + `prefers-reduced-transparency` / `prefers-reduced-motion` / `prefers-reduced-data`.
- **Performance**: zero JS animation. Pure CSS `backdrop-filter` + SVG `<filter>` graphs (feImage + feDisplacementMap + feSpecularLighting + feComposite). No rAF, no listeners.
- **Tests**: `__tests__/LiquidGlass.test.tsx`, `LiquidGlassFilters.mount.test.tsx`, `animation.test.tsx`, `filter-defs.test.ts`, `tokens.test.ts`, `use-liquid-glass-gates.test.tsx`. Cover variant→filter-id mapping, polymorphism, fallback states, gates SSR defaults, animation bridge with stub MotionValue.
- **Gaps for our locked design**: not a hero backdrop. It is a translucent surface for cards/pills/docks/dialogs. Does NOT manage cursor-reactive blobs, `--mx`/`--my` variables, scroll-driven distortion, or entrance burst.

### `<LiquidGlassFilters />` (LiquidGlassFilters.tsx)
- **API**: zero-prop component. Renders a hidden global `<svg><defs>` with one `<filter>` per variant + a `lg-gooey` filter. Already mounted in `apps/portfolio/app/[locale]/layout.tsx:71`.
- **Gooey filter**: `feGaussianBlur stdDeviation=10` + `feColorMatrix` alpha-sharpen + `feComposite atop`. Designed for melting/fusing — usable for our gooey blob layer with caveats.
- **Gaps**: no turbulence-driven displacement. The merged gooey filter melts shapes; does NOT model the random fluid distortion needed for cursor-reactive blob fields.

### `useLiquidGlassGates()` (use-liquid-glass-gates.ts)
- Returns `{ supportsRefraction, reduceTransparency, reduceMotion, reduceData, isMobile }`. `isMobile` = `(min-width: 480px)` does NOT match.
- Uses `useSyncExternalStore` with module-scoped fingerprint cache for stable snapshots.
- SSR-safe via `LIQUID_GLASS_SSR_DEFAULTS`.
- **Gaps vs. locked capability matrix**: missing `(min-width: 1024px)`, `hardwareConcurrency >= 4`, `connection.saveData`, WebGL2 probe, `IntersectionObserver` viewport check.

### `useDisplacementScaleAnimation` (use-displacement-scale-animation.ts)
- Imperative bridge: subscribes a `MotionValue<number>` to a stable `<feDisplacementMap>` node ref and writes `scale` attribute. Pure functions `applyDisplacementScale` + `bindDisplacementScale` exposed for unit tests. `useReducedMotion()` short-circuits.
- **Reusable**: yes — drives any hover/scroll-modulated displacement intensity.

### `filter-defs.tsx`
- Exports `LG_VARIANTS`, `LG_FILTER_IDS` (panel/pill/dock/circle/dialog/gooey ids), `LG_RESTING_SCALE`, `renderFilter`, `renderGooeyFilter`. Filter graph: feImage → feDisplacementMap → feGaussianBlur → feColorMatrix bumpMap → feSpecularLighting → feComposite arithmetic.
- **Gap**: filters scoped to variant geometries; no whole-viewport refraction filter and no `feTurbulence` source.

### `displacement-maps.ts`
- Inline SVG data-URI normal maps per variant. Not a turbulence source.

### `liquid-glass.css`
- Cascade: universal baseline (blur+saturate+box-shadow inset) → @supports refraction upgrade → reduced-data drops url() → reduced-transparency wins. Variant geometry hooks via `data-lg-variant`. JS-mirrored `data-lg-fallback="solid"` mirror.
- **Reusable**: hero's headline+lead container can use `<LiquidGlass variant="panel">` directly and inherit WCAG-tinted bg.

### `LiquidGlass.stories.tsx`, `README.md`
- Storybook coverage for variants×intensities, fallback matrix, polymorphic `as`. README documents mount-once contract and graceful fallbacks.

### Other UI changes shipped by PR #33
- **Added** `packages/ui/src/components/LiquidNav.tsx` — full liquid-glass nav primitive (uses `LiquidGlass` + framer-motion AnimatePresence). Replaces old SectionDock.
- **Removed** `packages/ui/src/components/SectionTimeline.tsx`.
- **Added** `packages/ui/src/utils/cn.ts` (+ test).
- **Added** tests for CommandSurface, GlassNav, HudChip migrated to LiquidGlass.
- `packages/ui/src/index.ts` re-exports `./liquid-glass` (full barrel) plus `LiquidNav`, etc.

---

## 2. Where does HeroFragment stand now

`apps/portfolio/components/fragments/HeroFragment.tsx` (post-PR-#33):
- Still **`"use client"`**, still ~250 lines.
- Still **NO `<h1>` anywhere**. Title lines remain inside `<GlitchText>` spans inside `<div>`s. `rg <h1` against `apps/portfolio` returns ZERO matches. The original SEO finding STANDS — PR #33 did not address it.
- Now consumes `<LiquidGlass variant="panel">` for the headline+subheadline card and `<LiquidGlass variant="pill">` for the scroll indicator. Replaced raw `backdrop-blur` Tailwind utilities (audit script enforces this).
- Still uses local `useSpotlightTracking` hook with rAF + `setMousePosition` (causes React re-renders on cursor — counter to locked "zero React rerenders" requirement).
- Still imports own `containerVariants`/`itemVariants` from framer-motion. No semantic landmark, no `aria-labelledby`.

`HeroFragment.test.tsx` (post-PR-#33):
- Asserts panel + pill `data-lg-variant` consumption (REQ-7 of liquid-glass-immersion change), absence of `backdrop-blur`, plus original aria-hidden isolation tests. No h1 test, no aria-labelledby test, no LCP / SSR assertions, no contract for cursor without re-renders.

---

## 3. Capability gates in place

| Gate (locked design) | `useLiquidGlassGates` covers? | Note |
|---|---|---|
| `prefers-reduced-motion: no-preference` | YES (`reduceMotion`) | direct match |
| `(min-width: 1024px)` | NO — only `(min-width: 480px)` | needs extension |
| `hardwareConcurrency >= 4` | NO | not probed |
| `connection.saveData !== true` | partial — `prefers-reduced-data` is honored at CSS level; `connection.saveData` not read explicitly | distinct hint sources |
| WebGL2 available | NO | not probed |
| `IntersectionObserver` ratio ≥ 0.1 | NO | not probed |

Already in place beyond locked design: `prefers-reduced-transparency`, `(min-width: 480px)` mobile-floor.

**Conclusion**: `useLiquidGlassGates` covers ~30% of the locked WebGL gate matrix. EXTEND, not duplicate. Cleanest path: a new `useLiquidHeroCapability()` hook composing `useLiquidGlassGates()` + missing checks.

---

## 4. WebGL/r3f layer status

- `apps/portfolio/package.json` deps (current): `framer-motion ^12.38.0`, `next-intl ^4.9.1`, `next-sanity ^12.2.1`, `next latest`, `react latest`. NO `three`, NO `@react-three/fiber`, NO `@react-three/drei`, NO `ogl`.
- `packages/ui/package.json`: peers `framer-motion ^12.38.0`, `react ^19.0.0`. NO three deps.
- Ripgrep for `three|@react-three|drei|ogl` returns only Storybook static bundles (false positives).

**Conclusion**: WebGL refraction layer remains 100% unimplemented. Full ~180 KB lazy chunk + capability gate + r3f scene + `MeshTransmissionMaterial` patching is still our work.

---

## 5. Test infrastructure delta

- `apps/portfolio/vitest.config.ts`: jsdom env, globals on, `setupFiles: ["./test/setup.ts"]`, includes `../../packages/ui/src/**/*.test.ts(x)`. Inline deps: `next-intl`. No coverage config.
- New tests: `apps/portfolio/test/components/{CookieBanner,Footer,LocaleSwitcher}.test.tsx`, `app/[locale]/layout.test.tsx`, `app/[locale]/projects/[slug]/page.test.tsx`, `components/fragments/ProjectFragment.test.tsx`. Sibling tests, not hero-specific.
- New audit harness `scripts/audit-liquid-glass.ts` rules: no userAgent in primitive, no runtime viewport listeners outside the gates hook, no raw backdrop-blur in migrated files, every migrated file imports `LiquidGlass`, no light theme variant, scope-boundary excludes maestros-del-salmon and studio.
- No new Playwright spec for hero. Lighthouse harness untouched.

---

## 6. Locked design — satisfied vs. pending

| Locked requirement | Status | Notes |
|---|---|---|
| Single `<h1>` in SSR HTML (LCP candidate) | NOT IMPLEMENTED | hero is still client-only, no h1 anywhere |
| `aria-labelledby="hero-title"` semantic landmark | NOT IMPLEMENTED | section has no aria-labelledby, no h1 to point at |
| next-intl translatable copy for hero strings | PARTIAL | existing keys cover old copy; new keys MUST be added in en + es |
| Sanity `profile.headline` fallback path | PARTIAL | currently overrides `tHero("headline")`; locked design says fallback lives in lead, h1 stays static |
| Always-on CSS liquid-glass layer (cursor-reactive, SVG goo) | PARTIAL | `LiquidGlass variant="panel"` used; cursor blobs + `--mx/--my` not implemented; gooey filter exists but not applied to a blob field |
| Lazy WebGL refraction layer (capability-gated) | NOT IMPLEMENTED | no deps installed, no component |
| Entrance burst splash | NOT IMPLEMENTED | no uniform, no animation |
| Scroll-driven distortion | NOT IMPLEMENTED | no `useScroll` mapping into displacement scale |
| Performance budgets (initial JS +5 KB / WebGL chunk ≤ 200 KB) | NOT MEASURED | bundle-size assertion not added to qa:gate |
| Accessibility (axe 0 violations, contrast 4.5:1) | NOT MEASURED | no Playwright a11y spec for hero |
| Rollback flag `NEXT_PUBLIC_HERO_LIQUID` | NOT IMPLEMENTED | flag not declared, ObsidianStream renders HeroFragment unconditionally |

---

## 7. Conflicts / re-architecture points

1. **`LiquidGlassBackdrop` (planned new) overlaps with `LiquidGlass` (merged)**
   - Locked design proposed `packages/ui/src/components/LiquidGlassBackdrop.tsx` to host CSS blobs + SVG goo + `backdrop-filter` glass card.
   - Merged `LiquidGlass` ALREADY provides the glass-card surface (variant="panel"). Building a separate "Backdrop" duplicates responsibility.
   - **Re-arch**: drop standalone "Backdrop". Split:
     - **Glass card** = reuse `<LiquidGlass variant="panel">` from `@hstrejoluna/ui`.
     - **Cursor-reactive blob field** = NEW thin component `HeroLiquidField.tsx` colocated in `apps/portfolio/components/fragments/` (hero-specific physics, NOT a reusable primitive).
     - **Gooey filter** = reuse `LG_FILTER_IDS.gooey` (already mounted via `<LiquidGlassFilters />`). Possibly add a NEW filter id for `feTurbulence`-driven cursor displacement if gooey doesn't produce the right organic distortion.

2. **`useLiquidPointer` (planned) overlaps with existing `useSpotlightTracking` in HeroFragment**
   - Merged `useSpotlightTracking` calls `setState` on rAF — causes React re-renders, violates locked "zero rerenders" requirement.
   - **Re-arch**: implement `useLiquidPointer` as a NEW hook in `packages/ui/src/hooks/` that writes only to `--mx`, `--my` CSS vars + ref store. Remove `useSpotlightTracking` from migrated hero. Keep hook reusable.

3. **`useHeroMotionPreferences` / `useLiquidCapability` overlaps with `useLiquidGlassGates`**
   - Locked design's `useLiquidCapability` and `useLiquidGlassGates` overlap on reduced-motion, reduced-data, mobile floor.
   - **Re-arch**: do NOT duplicate. Build `useLiquidHeroCapability()` composing `useLiquidGlassGates()` + missing five checks (`(min-width: 1024px)`, `hardwareConcurrency`, `connection.saveData`, WebGL2 probe, IO viewport). Single source of truth for reduced-motion comes from existing hook.

4. **`MotionProvider` already wraps the locale layout**
   - PR #33 added `apps/portfolio/components/providers/MotionProvider.tsx` wrapping in `<LazyMotion features={domAnimation} strict>`. Locked design assumed we would add LazyMotion — DONE.
   - **Re-arch**: drop the LazyMotion in `ObsidianStream.tsx` (currently double-wraps — `app/[locale]/layout.tsx` does it, then `ObsidianStream` again). Use `m.div` everywhere; global LazyMotion handles features. Strict mode catches `motion.*` regressions.

5. **`<LiquidGlassFilters />` mount point is already correct**
   - Mounted exactly once in `app/[locale]/layout.tsx`. Hero just consumes filter ids. Zero new work for SVG defs scaffolding. MAY need one new filter for cursor-driven turbulence; if so, extend `filter-defs.tsx` with `renderHeroTurbulenceFilter()` and add `lg-hero-flow` to `LG_FILTER_IDS`.

6. **Audit script will enforce migration discipline**
   - `scripts/audit-liquid-glass.ts` already lists `apps/portfolio/components/fragments/HeroFragment.tsx` in `MIGRATED_FILES`. When we replace with HeroSection, MUST update list. Keep parallel rule asserting `HeroSection.tsx` imports `LiquidGlass` and avoids `backdrop-blur`.

---

## 8. Refined recommendation — KEEP / REPLACE / NEW

### KEEP from the merged code
- `<LiquidGlass>` primitive — use directly for headline+lead card (`variant="panel"`), secondary CTA chip (`variant="pill"`), HUD chips for entrance choreography.
- `<LiquidGlassFilters>` mount in locale layout — consume filter ids.
- `useLiquidGlassGates()` — single source of truth for reduced-motion, reduced-transparency, reduced-data, mobile floor.
- `useDisplacementScaleAnimation` — drive scroll-mapped displacement intensity on a hero-specific filter id.
- `LG_FILTER_IDS.gooey` filter — apply to blob layer if visual matches; otherwise add new turbulence filter and keep gooey for elsewhere.
- `MotionProvider` global LazyMotion — drop duplicate in `ObsidianStream.tsx`.

### REPLACE / REMOVE from the locked design
- Drop planned `LiquidGlassBackdrop.tsx` shared primitive. Glass-card duty already in `LiquidGlass`. Hero-specific physics layer is hero-specific — do NOT promote to `packages/ui`.
- Drop planned `useLiquidCapability` standalone hook. Compose on top of `useLiquidGlassGates()`.
- Drop local `useSpotlightTracking` hook in HeroFragment when migrating to HeroSection.

### NEW work that still must ship
1. `apps/portfolio/components/fragments/HeroSection.tsx` — RSC shell with `<section aria-labelledby>`, `<p eyebrow>`, `<h1 id="hero-title">`, `<p lead>`, primary `<a>` CTA, secondary `<a>`. Wraps two client islands.
2. `apps/portfolio/components/fragments/HeroLiquidField.tsx` — `"use client"`, `aria-hidden`, three radial blobs styled by CSS vars, framer-motion entrance burst, scroll-bound displacement intensity. Uses `<LiquidGlass variant="panel">`. Subscribes to `useLiquidPointer`.
3. `apps/portfolio/components/fragments/HeroLiquidWebGL.tsx` — lazy via `next/dynamic({ ssr: false })`. r3f Canvas + drei `MeshTransmissionMaterial` plane. Patched uniforms `uMouse`, `uScroll`, `uBurst`, `uTime`. Capability-gated.
4. `packages/ui/src/hooks/useLiquidPointer.ts` — single rAF listener, writes `--mx`, `--my`, `--vx`, `--vy` CSS vars + ref store readable by r3f's `useFrame`. NO React state.
5. `packages/ui/src/hooks/useLiquidHeroCapability.ts` — composes `useLiquidGlassGates()` + `(min-width: 1024px)` + `hardwareConcurrency >= 4` + `connection.saveData !== true` + WebGL2 + IO ratio. Single source for "should we mount the WebGL layer".
6. `packages/ui/src/liquid-glass/filter-defs.tsx` — extend with hero-specific turbulence filter id IF existing gooey filter doesn't give the right look. Try without first.
7. `apps/portfolio/messages/en.json` + `es.json` — add `hero.eyebrow`, `hero.h1Name`, `hero.h1Role`, `hero.lead`, `hero.cta`, `hero.ctaAriaLabel`, `hero.secondaryLabel`. Keep old keys until flag flip.
8. `apps/portfolio/messages/en.test.ts` + `es.test.ts` — extend parity assertions.
9. `apps/portfolio/components/ObsidianStream.tsx` — drop inner `LazyMotion` wrapper, read `process.env.NEXT_PUBLIC_HERO_LIQUID`, choose `<HeroSection>` or `<HeroFragment>`. Remove `<section id="hero">` wrapper because HeroSection now owns the section element.
10. `apps/portfolio/app/[locale]/page.tsx` — extend JSON-LD `Person` with `image` and `mainEntityOfPage`.
11. `apps/portfolio/app/globals.css` — utilities for `.hero-blob`, `.hero-card-tint`, optional `--mx`/`--my` defaults.
12. `apps/portfolio/package.json` — add `three`, `@react-three/fiber`, `@react-three/drei`. Verify against Context7 in design phase.
13. `apps/portfolio/e2e/hero.spec.ts` — Playwright a11y + `expect(page.locator("h1")).toHaveCount(1)` + Lighthouse SEO ≥ 95.
14. `apps/portfolio/lighthouserc.cjs` — verify thresholds.
15. `apps/portfolio/components/fragments/HeroSection.stories.tsx` — Storybook coverage (default / reduced-motion / no-WebGL / hover / scroll).
16. `apps/portfolio/components/fragments/HeroSection.test.tsx` — vitest contract (h1 present and translatable, aria-labelledby, lead fallback to Sanity headline, no React re-render on cursor move).
17. `scripts/audit-liquid-glass.ts` — replace `HeroFragment.tsx` entry with `HeroSection.tsx` once flag flips; until then add HeroSection alongside.
18. `apps/portfolio/qa:gate` — add bundle-size assertion for WebGL chunk (≤ 200 KB gz).
19. `.env.example` — declare `NEXT_PUBLIC_HERO_LIQUID`.

### Cleanup deferred to Fase 2
- Remove `apps/portfolio/components/fragments/HeroFragment.tsx` and its test.
- Remove `useSpotlightTracking`.
- Drop old `hero.titleLine1`, `hero.titleLine2`, `hero.headline`, `hero.subheadline`, `hero.telemetryLatency`, `hero.telemetryFramework`, `brand.systemReady`, `brand.uplink`, `brand.descent` keys.
- Remove `HeroFragment` from `scripts/audit-liquid-glass.ts` MIGRATED_FILES.

---

## Risks (top 3 for re-architecture)

1. **Re-architecture cost vs. timeline**: shifting from `LiquidGlassBackdrop` model to "consume LiquidGlass + thin HeroLiquidField" means tasks.md must be rewritten. Some spec scenarios reference `LiquidGlassBackdrop` by name — rename pass needed for traceability. Mitigation: rewrite tasks BEFORE apply; spec text uses behavior-only language so renames are localized.
2. **Conflicting filter abstractions**: merged gooey filter is alpha-sharpen on Gaussian blur (good for melting nav items) but doesn't produce continuous turbulence-driven distortion. If hero blob field needs the latter, add a new filter and risk filter-graph cost on every redraw. Mitigation: prototype with gooey filter first; only extend `filter-defs.tsx` if look fails. Keep `feTurbulence` baseFrequency low (≤ 0.02) and primitive scale small.
3. **Double LazyMotion + framer-motion v12 strict**: PR #33's `MotionProvider` is `strict`. `ObsidianStream` ALSO wraps in `LazyMotion features={domAnimation}` (without strict). When dropping the inner one, any `motion.*` import that needs a feature outside `domAnimation` will throw at runtime under strict. Mitigation: audit motion usage in ObsidianStream subtree (currently `m.div` only — domAnimation covers that) before removing inner wrapper. New HeroSection should use `m.*` everywhere; never `motion.*`.

---

## Skill Resolution
context7-strict was injected. No library code touched. Context7 queries for `@react-three/fiber`, `@react-three/drei`, `framer-motion v12`, `next-intl`, and `next` (Next.js 16) remain pending — design phase will resolve before any apply phase touches code. The merged code base also confirms `framer-motion ^12.38.0` is in `peerDependencies` of `@hstrejoluna/ui`, so `apps/portfolio` MUST keep its direct dependency in sync.
