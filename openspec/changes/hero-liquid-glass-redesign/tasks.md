# Tasks: hero-liquid-glass-redesign (DELTA — supersedes original)

This file replaces the previous tasks.md after PR #33 (`liquid-glass-immersion`) merged primitives that overlap with our locked design. See `explore-delta.md` for the full delta. Reuse merged primitives. Drop redundant work.

## Strict TDD Mode
ENABLED. Test runner: `npm test` (vitest from root → apps/portfolio). E2E: `npm run qa:e2e --workspace=apps/portfolio`. Each implementation task is preceded by a failing-test task (RED) and followed by REFACTOR where applicable.

## Re-architecture Summary

**KEEP** (already merged): `<LiquidGlass>` panel/pill, `<LiquidGlassFilters>`, `useLiquidGlassGates`, `useDisplacementScaleAnimation`, `MotionProvider` global LazyMotion strict, `LG_FILTER_IDS.gooey`.

**DROP** from old plan: `LiquidGlassBackdrop` shared primitive, `useLiquidCapability` standalone hook, LazyMotion wrapper in `ObsidianStream.tsx`, `useSpotlightTracking` in HeroFragment.

**NEW**: `HeroSection` (RSC), `HeroLiquidField` (client, hero-specific), `HeroLiquidWebGL` (lazy r3f+drei), `useLiquidPointer` (packages/ui), `useLiquidHeroCapability` (packages/ui composing useLiquidGlassGates + 5 missing checks).

---

## Phase 1 — Infrastructure & Scaffolding

- [ ] 1.1 Add `NEXT_PUBLIC_HERO_LIQUID` to `.env.example` (default `false`). Document in `apps/portfolio/README` if relevant.
- [ ] 1.2 Bundle-size cap script `scripts/check-hero-webgl-bundle.mjs` reading Turbopack manifest. Fail if WebGL chunk > 200 KB gz. Wire into `qa:gate`.
- [ ] 1.3 Add bundle-size config (`size-limit` or `bundlewatch`) + CI step.
- [ ] 1.4 Playwright project for `reducedMotion: 'reduce'` in `apps/portfolio/playwright.config.ts`.
- [ ] 1.5 Lighthouse CI assertions: SEO ≥ 95, Performance ≥ 90 desktop / ≥ 85 mobile, LCP ≤ 2.5s. Update `apps/portfolio/lighthouserc.cjs`.

## Phase 2 — Library Verification (Context7 — gate to Phase 3)

- [ ] 2.1 Context7 resolve `@react-three/fiber`. Capture: Canvas frameloop demand mode, useFrame in r3f v9, React 19 + Next.js 16 RSC dynamic-import compatibility.
- [ ] 2.2 Context7 resolve `@react-three/drei`. Capture: `MeshTransmissionMaterial` complete prop list (transmission, thickness, ior, chromaticAberration, distortion, distortionScale, temporalDistortion, samples, resolution, backside) + subpath import path for tree-shaking.
- [ ] 2.3 Context7 resolve `framer-motion` 12. Capture: `useScroll({ target, offset })` v12 signature; `LazyMotion + domAnimation + strict` interaction with `useScroll` and `useTransform`.
- [ ] 2.4 Context7 resolve `next-intl` 4.9. Capture: `useTranslations` in Server Component vs `getTranslations`, async pattern.
- [ ] 2.5 Context7 resolve Next.js 16. Capture: `next/dynamic({ ssr: false })` placement rules under RSC + Turbopack tree-shake of `@react-three/drei`.
- [ ] 2.6 Save findings to engram as `sdd/hero-liquid-glass-redesign/context7` for apply phase to reference.
- [ ] 2.7 Install verified versions of `three`, `@react-three/fiber`, `@react-three/drei` into `apps/portfolio/package.json` (NOT `packages/ui` — hero-specific). Verify peer compatibility with React 19 + framer-motion 12.

## Phase 3 — Shared Hooks in packages/ui (TDD)

- [ ] 3.1 RED: `packages/ui/src/hooks/useLiquidPointer.test.ts` — single rAF listener, writes `--mx/--my/--vx/--vy` CSS vars + ref store, NO React re-renders, teardown removes listener, respects reduced-motion (no listener attached).
- [ ] 3.2 GREEN: implement `packages/ui/src/hooks/useLiquidPointer.ts`.
- [ ] 3.3 Re-export `useLiquidPointer` from `packages/ui/src/index.ts`.
- [ ] 3.4 RED: `packages/ui/src/hooks/useLiquidHeroCapability.test.ts` — composes `useLiquidGlassGates()` + viewport ≥ 1024px + hardwareConcurrency ≥ 4 + saveData false + WebGL2 probe + IntersectionObserver. Returns discriminated union `static | css-only | css+webgl`. Mocks matchMedia, navigator.connection, navigator.hardwareConcurrency, IntersectionObserver, WebGL probe canvas.
- [ ] 3.5 GREEN: implement `packages/ui/src/hooks/useLiquidHeroCapability.ts` composing `useLiquidGlassGates()` + missing checks.
- [ ] 3.6 Re-export `useLiquidHeroCapability` from `packages/ui/src/index.ts`.
- [ ] 3.7 REFACTOR: extract WebGL2 probe utility if reused; ensure tests stay green.

## Phase 4 — Hero components in apps/portfolio (TDD)

- [ ] 4.1 RED: `apps/portfolio/components/fragments/HeroSection.test.tsx` — renders single `<h1 id="hero-title">` with name+role text, eyebrow `<p>`, lead `<p>`, primary `<a>` CTA, secondary `<a>` CTA, `<section aria-labelledby="hero-title">`. All copy from messages.
- [ ] 4.2 GREEN: implement `apps/portfolio/components/fragments/HeroSection.tsx` as RSC. Use server-side i18n pattern from Context7 task 2.4. Wraps `HeroLiquidField` (client) + `HeroLiquidWebGL` (lazy).
- [ ] 4.3 RED: lead Sanity fallback test — `profile?.headline` overrides `messages.hero.lead`; h1 stays static (never depends on Sanity).
- [ ] 4.4 GREEN: thread `profile` prop into HeroSection lead.
- [ ] 4.5 RED: `apps/portfolio/components/fragments/HeroLiquidField.test.tsx` — renders aria-hidden, three blob divs styled by CSS vars, `<LiquidGlass variant="panel">` card, subscribes to `useLiquidPointer`, applies displacement via `useDisplacementScaleAnimation` bound to scrollYProgress, entrance-burst tween plays once, freezes under reduced-motion.
- [ ] 4.6 GREEN: implement `apps/portfolio/components/fragments/HeroLiquidField.tsx` (`"use client"`). Use `m.*` from framer-motion (NOT `motion.*` — global LazyMotion strict). Render blob divs styled by CSS vars + scroll-bound displacement.
- [ ] 4.7 RED: `apps/portfolio/components/fragments/HeroLiquidWebGL.test.tsx` — renders r3f Canvas only when capability === "css+webgl"; else renders nothing. Mocks `useLiquidHeroCapability`.
- [ ] 4.8 GREEN: implement `apps/portfolio/components/fragments/HeroLiquidWebGL.tsx` skeleton (r3f Canvas + Plane + MeshTransmissionMaterial with placeholder uniforms uMx, uMy, uScroll, uBurst, uTime).
- [ ] 4.9 RED: entrance-burst test — uBurst ramps 0→1→idle once per page load (sessionStorage flag).
- [ ] 4.10 GREEN: implement burst tween inside `useFrame`.
- [ ] 4.11 RED: scroll-driven distortion test — uScroll updates via mocked scrollYProgress.
- [ ] 4.12 GREEN: wire framer-motion `useScroll` + `useTransform` into a ref store consumed by `useFrame`.
- [ ] 4.13 REFACTOR: tree-shake drei import to subpath form. Verify with bundle-size script.
- [ ] 4.14 Add Storybook stories `apps/portfolio/components/fragments/HeroSection.stories.tsx` (default / reduced-motion / no-WebGL / hover / scroll).
- [ ] 4.15 Update `scripts/audit-liquid-glass.ts` MIGRATED_FILES to include `HeroSection.tsx` (alongside `HeroFragment.tsx` until flag flip).

## Phase 5 — i18n + page integration

- [ ] 5.1 RED: i18n parity test extension covering new hero keys (`hero.eyebrow`, `hero.h1Name`, `hero.h1Role`, `hero.lead`, `hero.cta`, `hero.ctaAriaLabel`, `hero.secondaryLabel`) in `apps/portfolio/messages/en.test.ts` + `apps/portfolio/messages/es.test.ts`.
- [ ] 5.2 GREEN: add new keys to `apps/portfolio/messages/en.json` + `apps/portfolio/messages/es.json`. Keep deprecated `hero.titleLine1`, `hero.titleLine2`, `hero.headline`, `hero.subheadline`, `hero.telemetryLatency`, `hero.telemetryFramework`, `brand.systemReady`, `brand.uplink`, `brand.descent` until cleanup phase.
- [ ] 5.3 RED: `apps/portfolio/components/ObsidianStream.test.tsx` extension — flag true renders `<HeroSection>`, flag false/unset renders `<HeroFragment>`. Inner `LazyMotion` wrapper removed.
- [ ] 5.4 GREEN: update `apps/portfolio/components/ObsidianStream.tsx` — drop inner `LazyMotion features={domAnimation}` (already provided by `MotionProvider`), branch on `process.env.NEXT_PUBLIC_HERO_LIQUID === "true"`, remove outer `<section id="hero">` wrapper (HeroSection now owns the section element).
- [ ] 5.5 RED: page.tsx JSON-LD test — `Person` schema includes `image` + `mainEntityOfPage`.
- [ ] 5.6 GREEN: extend JSON-LD in `apps/portfolio/app/[locale]/page.tsx` — `image` from Sanity URL helper, `mainEntityOfPage` set.

## Phase 6 — Styles & SEO

- [ ] 6.1 Add `@layer utilities` rules in `apps/portfolio/app/globals.css` for `.hero-blob`, `.hero-card-tint`, default `--mx/--my`. Tinted backdrop layer behind h1 + lead for contrast.
- [ ] 6.2 Verify contrast manually (WCAG 2.2 AA ≥ 4.5:1) at idle / hover / scroll mid-way states. Document the tint values.
- [ ] 6.3 Confirm h1 is the LCP candidate using Performance API in a Playwright spec (added in Phase 7).
- [ ] 6.4 OPTIONAL: extend `packages/ui/src/liquid-glass/filter-defs.tsx` with `renderHeroTurbulenceFilter()` and `lg-hero-flow` filter id ONLY if gooey filter does not give the right organic distortion. Skip if gooey suffices.

## Phase 7 — End-to-End Tests (TDD)

- [ ] 7.1 RED: `apps/portfolio/e2e/hero.spec.ts` — desktop 1440x900, canvas mounts within 5s of viewport intersection.
- [ ] 7.2 GREEN: verify capability gate causes Canvas to mount.
- [ ] 7.3 RED: mobile 375x812 — no `<canvas>` in hero section.
- [ ] 7.4 GREEN: verify mobile path via gate.
- [ ] 7.5 RED: reduced-motion project — no canvas, no pointermove, blobs static.
- [ ] 7.6 GREEN: verify reduced-motion path.
- [ ] 7.7 RED: axe a11y test — 0 violations on hero.
- [ ] 7.8 GREEN: resolve any axe violations.
- [ ] 7.9 RED: pixel contrast spec at h1 region (multiple cursor positions).
- [ ] 7.10 GREEN: tune backdrop tint to meet contrast.
- [ ] 7.11 RED: Playwright LCP assertion — LCP element id is `hero-title`.
- [ ] 7.12 GREEN: verify h1 wins LCP.
- [ ] 7.13 RED: memory-leak stress test (mount/unmount, heap delta < threshold). Document threshold.
- [ ] 7.14 GREEN: implement WebGL teardown (dispose renderer, cancel rAF, remove listeners).

## Phase 8 — Lighthouse + Bundle Validation

- [ ] 8.1 Run `qa:lighthouse`. Verify SEO ≥ 95, Perf ≥ 90 desktop / ≥ 85 mobile, LCP ≤ 2.5s.
- [ ] 8.2 Run bundle-size script. Verify lazy WebGL chunk ≤ 200 KB gz, initial JS delta ≤ +5 KB gz.
- [ ] 8.3 If over budget: fall back to plan-B `ogl` + custom shader (proposal-documented). Re-run.

## Phase 9 — Rollout

- [ ] 9.1 Land PR with flag default `false`. Reviewers verify legacy hero unchanged.
- [ ] 9.2 Enable flag in preview deployment. Manual QA + Lighthouse comparison.
- [ ] 9.3 Flip flag in production. Monitor RUM (LCP / INP / CLS) for 48h.

## Phase 10 — Cleanup (post-stable-release)

- [ ] 10.1 Remove `apps/portfolio/components/fragments/HeroFragment.tsx` + `HeroFragment.test.tsx`.
- [ ] 10.2 Remove `useSpotlightTracking` hook.
- [ ] 10.3 Drop deprecated `hero.titleLine1`, `hero.titleLine2`, `hero.headline`, `hero.subheadline`, `hero.telemetryLatency`, `hero.telemetryFramework`, `brand.systemReady`, `brand.uplink`, `brand.descent` keys. Update parity tests.
- [ ] 10.4 Remove `HeroFragment` from `scripts/audit-liquid-glass.ts` MIGRATED_FILES.
- [ ] 10.5 Remove `NEXT_PUBLIC_HERO_LIQUID` flag and the branch in `ObsidianStream.tsx`.

## Decisions to lock during apply
- Final h1 wording (recommend: `Héctor Trejo Luna — Senior Software Architect`).
- Final eyebrow microcopy en + es.
- Image asset for OG / JSON-LD `image` field.
- Whether `lg-hero-flow` turbulence filter is needed (start with `LG_FILTER_IDS.gooey`).

## Skill Resolution
context7-strict baked into Phase 2.
