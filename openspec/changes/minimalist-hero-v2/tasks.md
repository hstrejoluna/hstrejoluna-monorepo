# Tasks: Minimalist Hero v2

## Review Workload Forecast

| Field                   | Value                                                           |
| ----------------------- | --------------------------------------------------------------- |
| Estimated changed lines | ~2500 (2064 deleted + ~450 modified/added)                      |
| 400-line budget risk    | High                                                            |
| Chained PRs recommended | Yes                                                             |
| Suggested split         | PR 1: Removal → PR 2: Core Rebuild → PR 3: Integration & Verify |
| Delivery strategy       | auto-chain                                                      |
| Chain strategy          | feature-branch-chain                                            |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                                               | Likely PR | Notes                               |
| ---- | -------------------------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| 1    | Delete all WebGL/framer-motion code + packages; remove mocks from surviving tests                  | PR 1      | Autonomous; verify via `npm test`   |
| 2    | Rebuild HeroText as complete hero; replace ObsidianStream framer-motion with CSS; wire page/layout | PR 2      | Core visual change; depends on PR 1 |
| 3    | Migrate remaining framer-motion components; E2E; bundle grep; final verify                         | PR 3      | Verification gate; depends on PR 2  |

---

## Phase 1: Removal (PR 1)

**RED (TDD — make tests fail first):**

- [x] 1.1 Remove `vi.mock("framer-motion",…)` from `ObsidianStream.test.tsx`, `SkillsOverview.test.tsx`, `ExperienceOverview.test.tsx`, `ExperienceFragment.test.tsx` → confirm `npm test` fails
  - NOTE: Tests did NOT fail at RED phase because framer-motion is jsdom-compatible and hoisted from `@hstrejoluna/ui`. True RED manifested at task 1.6 when packages removed from package.json.

**GREEN:**

- [x] 1.2 Delete `check-hero-webgl-bundle.mjs`
- [x] 1.3 Delete `HeroLiquidField`, `HeroLiquidWebGL`, `hero-uniform-store` + their tests
- [x] 1.4 Delete `MotionProvider.tsx` + test
- [x] 1.5 Delete `SkillsGrid.tsx`, `ObsidianStreamLoader.tsx` (ObsidianStreamLoader did not exist on master — already absent)
- [x] 1.6 Remove `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei` from `package.json`
- [x] 1.7 `npm test` → 49/51 suites pass, 313 tests pass. 2 expected failures (layout.test → deleted MotionProvider, HeroSection.test → deleted HeroLiquidField) — these are Phase 2 tasks.

---

## Phase 2: Core Rebuild (PR 2)

**RED:**

- [ ] 2.1 `ObsidianStream.test.tsx`: assert `<div>` (not `m.div`), CSS animation class, no `createPortal`
- [ ] 2.2 `HeroSection.test.tsx`: assert no `HeroLiquidField` import/JSX

**GREEN:**

- [ ] 2.3 `HeroText.tsx`: remove `<div id="hero-visual-mount"/>`; blobs stay, HeroText is complete hero
- [ ] 2.4 `ObsidianStream.tsx`: `m.div→div`, `useScroll/useTransform→background-attachment:fixed`, entrance→`@keyframes`, scroll-bar→`IntersectionObserver`+CSS, remove `createPortal` & `HeroLiquidField` import
- [ ] 2.5 `page.tsx`: import `ObsidianStream` directly, remove `ObsidianStreamLoader` + `skipHero`
- [ ] 2.6 `layout.tsx`: unwrap `MotionProvider`, remove import
- [ ] 2.7 `HeroSection.tsx`: remove `HeroLiquidField` import + JSX

**REFACTOR:**

- [ ] 2.8 `npm test` → Phase 2 green; verify zero framer-motion imports in core hero path

---

## Phase 3: Component Migration (PR 3)

**RED:**

- [ ] 3.1 `ExperienceOverview.test.tsx`, `SkillsOverview.test.tsx`: assert plain HTML, CSS transition classes, no `m.div`/`AnimatePresence`

**GREEN:**

- [ ] 3.2 `ExperienceOverview.tsx` + `SkillsOverview.tsx`: `m.div/AnimatePresence→CSS transitions+:hover`
- [ ] 3.3 `ExperienceFragment.tsx` + `SkillsFragment.tsx`: `m.*→CSS`
- [ ] 3.4 `CookieBanner.tsx`: `m.div/AnimatePresence→max-height` collapse + `@keyframes` fade

---

## Phase 4: Integration & Verify (PR 3 continued)

- [ ] 4.1 `HeroSection.stories.tsx`: remove `LazyMotion`/`domAnimation`
- [ ] 4.2 `e2e/hero.spec.ts`: assert zero `<canvas>`, unskip `axe`, preserve LCP
- [ ] 4.3 Bundle: `grep -r "framer-motion\|three" apps/portfolio/components/` → zero
- [ ] 4.4 Full suite: `npm test && npm run qa:e2e --workspace=apps/portfolio` → green
- [ ] 4.5 Verify `NEXT_PUBLIC_HERO_LIQUID` flag guards rollback (same flag, new target)
