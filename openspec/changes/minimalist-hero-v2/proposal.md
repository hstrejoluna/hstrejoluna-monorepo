# Proposal: Minimalist Hero v2

**Status**: proposed

## Intent

Remove framer-motion, Three.js, and @hstrejoluna/ui liquid-glass hero hooks from the portfolio, replacing them with pure CSS. This eliminates the 770-1230ms TBT caused by JS bundle parse/execute of these libraries in the deferred chunk, while preserving the semantic SSR shell (HeroText) that already delivers LCP at 0.8s.

## Scope

### In Scope

- Delete HeroLiquidField, HeroLiquidWebGL, hero-uniform-store, SkillsGrid, MotionProvider (8 files, ~1800+ lines)
- Remove framer-motion + Three.js + R3F/drei from `package.json`
- Replace all `m.*` animations with CSS equivalents (transitions, @keyframes, @supports fallbacks)
- Remove `#hero-visual-mount` portal from ObsidianStream + HeroText
- Update 17 files: tests, stories, e2e, bundle check script, layout

### Out of Scope

- HeroText.tsx changes (stays as-is — proven SSR shell)
- Sanity data fetching or content model
- Section components beyond animation replacement
- i18n or locale routing
- Any @hstrejoluna/ui component used outside the hero (LiquidGlass, LiquidNav, GlitchText, etc.)

## Capabilities

### New Capabilities

None — pure simplification.

### Modified Capabilities

- `liquid-glass-hero`: Removes WebGL refraction layer, cursor reactivity, entrance burst, scroll-driven distortion. Simplifies CSS layer to static radial blobs. Updates performance budgets (bundle drops ~230-250KB gzipped).

## Approach

**Phase 1 — Remove dead code**: Delete 8 files (hero visual + MotionProvider + SkillsGrid). Remove `three`, `@react-three/fiber`, `@react-three/drei` from deps. Clean all imports.

**Phase 2 — CSS replacements**: Each `m.div` → plain `div` + CSS. Scroll-driven: `animation-timeline:view()` with `@supports` + IntersectionObserver fallback for Firefox/Safari. Expand/collapse: `max-height` + `overflow:hidden` transition. Hover effects: `:hover` + `transition`. Respect `prefers-reduced-motion` throughout.

**Phase 3 — Cleanup**: Remove `framer-motion` from deps, update all test mocks, strip MotionProvider from layout, update e2e tests, remove WebGL bundle check.

## Affected Areas

| Area                                                      | Impact              | Count   |
| --------------------------------------------------------- | ------------------- | ------- |
| `components/fragments/HeroLiquidField.*`                  | Deleted             | 3 files |
| `components/fragments/HeroLiquidWebGL.*`                  | Deleted             | 2 files |
| `components/fragments/hero-uniform-store.*`               | Deleted             | 2 files |
| `components/providers/MotionProvider.tsx`                 | Deleted             | 1 file  |
| `components/SkillsGrid.tsx`                               | Deleted (dead code) | 1 file  |
| `components/ObsidianStream.tsx` + loader + test           | Modified            | 3 files |
| Hero text/section + tests + stories                       | Modified            | 4 files |
| Fragment animations (Exp, Skills, Cookie) + tests         | Modified            | 7 files |
| `app/[locale]/layout.tsx`                                 | Modified            | 1 file  |
| `e2e/hero.spec.ts`, `scripts/check-hero-webgl-bundle.mjs` | Modified            | 2 files |
| `package.json`                                            | Modified            | 1 file  |

## Risks

| Risk                                                          | Likelihood | Mitigation                                                              |
| ------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| CSS `animation-timeline:view()` unsupported in Firefox/Safari | High       | `@supports` fallback to IntersectionObserver + class toggle             |
| `max-height` transition jank with variable content            | Low        | Set `max-height` to generous ceiling (2000px)                           |
| Visual regression (no more animated blobs)                    | Med        | HeroText SSR blobs already serve as static fallback; LCP/CLS unaffected |
| Test breakage from framer-motion mock removal                 | Low        | Update mocks in same commit as source changes                           |
| Storybook decorator breakage                                  | Low        | Remove `LazyMotion` from decorators                                     |

## Rollback Plan

1. `git revert` the merge commit — all changes in one branch
2. `npm install` to restore removed dependencies
3. Verify `npm run build` passes, Lighthouse LCP ≤ 2.5s

## Dependencies

None — builds on `lighthouse-perf-66-to-90` but is standalone. No API or infrastructure changes.

## Success Criteria

- [ ] Zero `framer-motion` imports in `apps/portfolio`
- [ ] Zero `three` / `@react-three/*` imports in `apps/portfolio`
- [ ] TBT ≤ 200ms (down from 770-1230ms)
- [ ] LCP stays ≤ 0.9s (HeroText unchanged)
- [ ] CLS = 0 (HeroText unchanged)
- [ ] ~230-250 KB gzipped removed from bundle
- [ ] All unit tests pass (`npm test --workspace=apps/portfolio`)
- [ ] All e2e tests pass (`npm run qa:e2e --workspace=apps/portfolio`)
- [ ] Lighthouse Perf ≥ 90
- [ ] axe-core zero violations
