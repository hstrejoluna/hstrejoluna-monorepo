# Delta for liquid-glass-hero

## REMOVED Requirements

### Requirement: WebGL refraction layer (capability-gated, lazy)

**Reason**: Three.js/R3F eliminated (~230KB JS removed). HeroText static CSS blobs provide visual depth without WebGL2 probes or capability gates.

### Requirement: Entrance burst splash

**Reason**: Depends on WebGL `computeBurstValue`. No burst concept remains in CSS-only hero.

### Requirement: Scroll-driven distortion

**Reason**: Depends on WebGL `uScroll` uniform + framer-motion `useScroll`. Replaced by CSS `background-attachment: fixed`.

## MODIFIED Requirements

### Requirement: Hero visual layer

The HeroText Server Component SHALL render three static `radial-gradient` blobs in SSR HTML with `filter: blur()` at fixed `left`/`top`/`right`/`bottom` positions. No client JS: no `pointermove` listener, no CSS `--mx`/`--my` vars, no SVG `<filter>`, no `backdrop-filter` glass card, no `@keyframes` on blobs.

_(Prev: Animated cursor-follow blobs via `useLiquidPointer`, SVG goo/refraction filters, `backdrop-filter` glass card, CSS keyframe drift.)_

#### Scenario: Static blobs render server-side

- **GIVEN** request to `/en` or `/es`
- **WHEN** page server-renders
- **THEN** three blur-blob divs SHALL appear in `section#hero` at fixed style positions with `aria-hidden="true"`

#### Scenario: Reduced-motion produces identical output

- **GIVEN** `prefers-reduced-motion: reduce`
- **WHEN** hero renders
- **THEN** visual output SHALL be identical to full-motion (blobs are static by design)

### Requirement: ObsidianStream CSS animations

`ObsidianStream` SHALL replace all framer-motion with CSS: `@keyframes fadeIn` via `animation-timeline:view()` (IntersectionObserver fallback), `background-attachment: fixed` watermark, `max-height` + `overflow:hidden` expand/collapse, `:hover` + `transition` hover effects. `@media (prefers-reduced-motion: reduce)` SHALL suppress entrance animations.

_(Prev: `m.div` with `useScroll`/`useTransform`/`AnimatePresence`/`whileInView`/`whileHover`, `LazyMotion` provider wrapping layout.)_

#### Scenario: Sections fade in on scroll

- **GIVEN** `ObsidianStream` hydrated, section below fold
- **WHEN** section enters viewport (≥40%)
- **THEN** it SHALL fade `opacity:0→1` via CSS; under `prefers-reduced-motion` SHALL render at `opacity:1` immediately

#### Scenario: Zero framer-motion in bundle

- **GIVEN** production build of `apps/portfolio`
- **WHEN** JS bundle inspected
- **THEN** zero `framer-motion` imports, zero `m.*` / `AnimatePresence` JSX SHALL exist

### Requirement: Performance budgets

Portfolio JS SHALL decrease ≥200 KB gzipped vs baseline. WebGL chunk budget removed. LCP ≤2.5s. TBT ≤200ms. CLS ≤0.1.

_(Prev: JS ≤+5KB, WebGL chunk ≤300KB, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1. TBT budget is new.)_

#### Scenario: Bundle shrinks

- **GIVEN** `qa:gate` in CI
- **WHEN** total JS gzipped vs baseline measured
- **THEN** JS SHALL be ≥200 KB smaller; no WebGL chunk check SHALL execute

#### Scenario: TBT ≤200ms

- **GIVEN** `qa:lighthouse` on slow-4G mobile
- **WHEN** report generated
- **THEN** TBT ≤200ms AND main-thread blocker SHALL NOT be `framer-motion`/`three`/`@react-three/*`

### Requirement: Accessibility

Zero axe violations. Decorative layers `aria-hidden="true"`. Text contrast ≥4.5:1. Visible focus indicators. Tab order: skip-link → CTAs.

_(Prev: Contrast verified against glass card + WebGL over four states. Simplified: white text on dark bg — passes WCAG AA as verified in lighthouse-perf-66-to-90.)_

#### Scenario: a11y audit clean

- **GIVEN** hero rendered in any locale
- **WHEN** `axe.run()` invoked in Playwright
- **THEN** zero violations reported

### Requirement: Rollback flag

`NEXT_PUBLIC_HERO_LIQUID` build-time flag SHALL guard minimalist hero vs legacy `HeroFragment`. Unselected branch tree-shaken.

_(Prev: Guarded animated liquid-glass hero. Now guards minimalist hero v2 — same flag, same contract.)_

## PRESERVED Requirements

| Requirement               | Notes                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Semantic SSR shell        | h1/lead/CTAs/eyebrow, `aria-labelledby`, HeroText unchanged, LCP candidate unchanged  |
| SEO surface               | Single `<h1>`, JSON-LD `Person`, Lighthouse SEO ≥95                                   |
| First Paint Unblocked     | h1 visible at first paint, no boot sequence, `NEXT_PUBLIC_SKIP_BOOT_SEQUENCE` honored |
| CTA Accessible Name Match | Accessible name includes visible text                                                 |
