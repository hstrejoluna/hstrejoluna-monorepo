# Design: Minimalist Hero v2

## Technical Approach

Remove ALL framer-motion, Three.js, and @react-three/_ from the portfolio app by replacing every `m._`/`useScroll`/`useTransform`/`AnimatePresence`with pure CSS.`HeroText`(RSC) already renders the 3 static blobs + text — it becomes the COMPLETE hero (no mounting portal needed).`ObsidianStream`sheds`next/dynamic` and becomes a lightweight client component with CSS-only animations (`animation-timeline:view()`, `max-height`transitions,`:hover`/`transition`).

The net effect: ~230-250KB gzipped removed from JS bundle, TBT drops from 770-1230ms to ≤200ms, LCP/CLS unaffected (HeroText unchanged).

## Architecture Decisions

| #   | Decision                                                       | Trade-off                                                                                                               | Choice                                                                                                           |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 1   | `animation-timeline:view()` vs IntersectionObserver JS         | `view()` is declarative, zero-JS, but Firefox/Safari don't support it                                                   | `view()` with `@supports` fallback to `IntersectionObserver` + CSS class toggle                                  |
| 2   | `max-height` + `overflow:hidden` vs collapsing height via JS   | max-height transition has slight "snap" feel but zero JS; JS gives smooth animation but needs rAF                       | CSS `max-height` with generous ceiling (2000px) — zero JS, good-enough UX                                        |
| 3   | `background-attachment: fixed` vs `useScroll` parallax         | Fixed bg is pure CSS, no JS; `useScroll` gives precise transform control                                                | CSS `background-attachment: fixed` — spec requires it, matches visual intent, zero JS                            |
| 4   | HeroText absorbs ALL hero visuals vs separate visual component | HeroText already has 3 static blobs; adding visual mount point to it keeps 2-component model but adds portal complexity | HeroText IS the full hero — its existing blobs are the visual layer. No portal. No separate visual component.    |
| 5   | `next/dynamic` removed vs kept for ObsidianStream              | Dynamic import protects initial bundle if ObsidianStream were still heavy. Post-framer-motion removal, it's trivial.    | Remove `next/dynamic` — ObsidianStream becomes a regular async import (still `'use client'`, still in Suspense). |

## Data Flow

```
page.tsx (RSC)
├── HeroText (RSC) ←── complete hero: text + 3 static radial-blobs
│   └── No portal, no JS, no <HeroLiquidField>
└── <Suspense>
    └── ObsidianStream (client component, ~30KB gzipped)
        ├── Parallax watermark via CSS background-attachment: fixed
        ├── StreamSection (scroll-driven opacity via animation-timeline:view())
        ├── ExperienceOverview (max-height expand/collapse, :hover transitions)
        ├── SkillsOverview (max-height + CSS width transition for proficiency bar)
        └── CookieBanner (CSS slide-up @keyframes, opacity transition)
```

No render props, no ref stores, no stores at all. The `hero-uniform-store.ts`, `useLiquidPointer`, `useLiquidHeroCapability`, `useDisplacementScaleAnimation` are all deleted — no uniform state to bridge.

## File Changes

| File                                  | Action     | Description                                                                                                                                                                                |
| ------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HeroLiquidField.tsx` + test          | **Delete** | ~318 lines WebGL/CSS visual + cursor reactivity                                                                                                                                            |
| `HeroLiquidWebGL.tsx` + test          | **Delete** | ~166 lines R3F/Three.js canvas                                                                                                                                                             |
| `hero-uniform-store.ts` + test        | **Delete** | Burst/scroll singletons                                                                                                                                                                    |
| `MotionProvider.tsx` + test           | **Delete** | `LazyMotion` wrapper                                                                                                                                                                       |
| `SkillsGrid.tsx`                      | **Delete** | Dead code (unused, still imports framer-motion)                                                                                                                                            |
| `HeroText.tsx`                        | **Modify** | Remove `#hero-visual-mount` portal div (line 69) — HeroText is now complete                                                                                                                |
| `HeroSection.tsx` + test + stories    | **Modify** | Remove `HeroLiquidField` import/render; strip `LazyMotion` from storybook decorators                                                                                                       |
| `ObsidianStream.tsx` + test           | **Modify** | Remove ALL framer-motion; remove portal logic; replace `m.div` → `div` + CSS; replace `useScroll`/`useTransform` with `background-attachment: fixed`; replace scroll progress bar with CSS |
| `ObsidianStreamLoader.tsx`            | **Delete** | No longer needed — ObsidianStream is lightweight                                                                                                                                           |
| `ExperienceOverview.tsx`              | **Modify** | Replace `m.div` + `AnimatePresence` with `max-height` transition + `overflow:hidden`                                                                                                       |
| `SkillsOverview.tsx`                  | **Modify** | Replace `m.div` + `AnimatePresence` expand/collapse + `m.div` proficiency bar with CSS                                                                                                     |
| `ExperienceFragment.tsx`              | **Modify** | Replace `m.div` `whileInView`/`initial` with CSS `animation-timeline:view()`                                                                                                               |
| `SkillsFragment.tsx`                  | **Modify** | Replace `m.div` `whileInView`/`whileHover` with CSS                                                                                                                                        |
| `CookieBanner.tsx`                    | **Modify** | Replace `m.div` + `AnimatePresence` with CSS `@keyframes slideUp` + opacity                                                                                                                |
| `page.tsx`                            | **Modify** | Import `ObsidianStream` directly (no `ObsidianStreamLoader` wrapper)                                                                                                                       |
| `[locale]/layout.tsx`                 | **Modify** | Remove `MotionProvider` import + wrapping                                                                                                                                                  |
| `package.json`                        | **Modify** | Remove `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`                                                                                                                 |
| `e2e/hero.spec.ts`                    | **Modify** | Replace WebGL canvas assertions with CSS blob assertions; unskip and fix axe contrast test                                                                                                 |
| `scripts/check-hero-webgl-bundle.mjs` | **Delete** | WebGL bundle no longer exists                                                                                                                                                              |
| `ObsidianStream.test.tsx`             | **Modify** | Remove framer-motion mocks; update assertions for CSS-driven markup                                                                                                                        |
| `layout.test.tsx`                     | **Modify** | Remove `MotionProvider` mock references                                                                                                                                                    |

## CSS Animation Map

| Old (framer-motion)                                     | New (CSS)                                                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `m.div initial/animate={{ opacity: 0 → 1 }}`            | `@keyframes fadeIn { from { opacity: 0 } }` with `animation: fadeIn 0.5s ease`                                |
| `useScroll({ target })` parallax on watermark           | `background-attachment: fixed` on watermark div                                                               |
| `m.div style={{ scaleX: scrollYProgress }}`             | Removed (progress bar is decorative noise; if kept, use `animation-timeline:scroll()` CSS)                    |
| `AnimatePresence` + `m.div` expand (ExperienceOverview) | `max-height: 0/2000px` + `overflow:hidden` with `transition: max-height 0.3s`                                 |
| `AnimatePresence` + `m.div` expand (SkillsOverview)     | Same max-height pattern; proficiency bar uses `width` transition                                              |
| `m.div whileInView={{ opacity: 0→1 }}`                  | `animation-timeline:view()` with `animation-range: entry 20%`; `@supports` fallback to `IntersectionObserver` |
| `m.div whileHover={{ scale: 1.05 }}`                    | `transition: transform 0.3s` + `:hover { transform: scale(1.05) }`                                            |
| `AnimatePresence` + `m.div` slideUp (CookieBanner)      | `@keyframes slideUp` + `transition: opacity 0.3s, transform 0.3s`                                             |

## Testing Strategy

| Layer               | What                                               | Approach                                                                                |
| ------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Unit (vitest+jsdom) | HeroText renders blobs, no portal                  | Assert blob divs exist with `aria-hidden="true"`; assert `#hero-visual-mount` absent    |
| Unit (vitest+jsdom) | ObsidianStream renders without framer-motion       | Remove `framer-motion` mock — component parses without it; assert `>div` (not `m.div`)  |
| Unit (vitest+jsdom) | Expand/collapse via max-height                     | `fireEvent.click` on toggle button → check `max-height` style and `aria-expanded`       |
| Unit (vitest+jsdom) | CSS animation class applied when `@supports` fails | Mock `CSS.supports()` to return false → verify `IntersectionObserver` fallback triggers |
| E2E (Playwright)    | Hero renders without canvas                        | Assert zero `<canvas>` elements in hero section on ALL viewports                        |
| E2E (Playwright)    | Axe violations = 0                                 | Remove `test.fixme`; axe scan hero section → `expect(violations).toEqual([])`           |
| E2E (Playwright)    | LCP = h1#hero-title                                | Existing test preserved; no change needed                                               |
| Bundle              | No framer-motion/three in JS output                | `grep -r 'framer-motion\|three' .next/static/chunks` → zero matches                     |

## Migration / Rollout

No DB migration, no feature flags. The `NEXT_PUBLIC_HERO_LIQUID` build-time flag already guards the hero path. The change is a direct replacement within the existing flag path. Rollback: `git revert`.

## Key Risks and Mitigations

1. **Firefox/Safari lack `animation-timeline:view()`** → `@supports (animation-timeline: view()) { ... }` with `IntersectionObserver` class-toggle fallback at component mount
2. **`max-height` transition jank** → Use generous ceiling (2000px); content always fits
3. **Storybook decorators break** → Strip `LazyMotion` from HeroSection.stories.tsx decorators, replace with plain wrapper
4. **Test assertion changes cascade** → Update all test mocks in same PR to keep `npm test` green throughout
