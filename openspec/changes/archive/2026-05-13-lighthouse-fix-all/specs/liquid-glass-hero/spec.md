# Delta for liquid-glass-hero

## MODIFIED Requirements

### Requirement: Performance budgets

- Initial JavaScript for `apps/portfolio` SHALL increase by NO MORE than **5 KB gzipped** versus the baseline measured at proposal time.
- The lazy WebGL chunk SHALL be ≤ **300 KB gzipped**.
- Largest Contentful Paint (LCP) on a slow-4G mobile profile SHALL be ≤ **4.0 s**.
- Interaction to Next Paint (INP) on hero interactions (pointer move, CTA click) SHALL be ≤ **200 ms**.
- Cumulative Layout Shift (CLS) on initial hero render SHALL be ≤ **0.1**.
(Previously: LCP budget was ≤ 2.5 s)

#### Scenario: bundle-size assertion fails on regression

- **Given** a developer adds a heavy dependency that pushes the WebGL chunk above 300 KB gz
- **When** CI runs `qa:gate`
- **Then** the bundle-size step SHALL fail with a non-zero exit code
- **And** the PR SHALL be blocked from merging

#### Scenario: initial JS budget is enforced

- **Given** the PR introduces an unrelated heavy import that ships in initial JS
- **When** `qa:gate` measures the initial bundle of `apps/portfolio`
- **Then** if the delta exceeds +5 KB gz versus baseline, the step SHALL fail

#### Scenario: Lighthouse LCP threshold

- **Given** `qa:lighthouse` runs against the production build
- **When** the mobile profile is scored
- **Then** LCP SHALL be ≤ 4.0 s
- **And** the LCP element SHALL be a text node inside the hero `<h1>`, not a canvas

## ADDED Requirements

### Requirement: No CSS Opacity on LCP Candidates

The hero SHALL NOT apply CSS `opacity` animations, transitions, or keyframes to the `<h1>` element or its containing ancestors during the LCP measurement window.

#### Scenario: h1 is immediately visible at first paint

- GIVEN the hero renders server-side
- WHEN the browser performs first paint
- THEN the `<h1>` SHALL have computed `opacity: 1`
- AND no CSS animation or transition targeting `opacity` SHALL be active on the `<h1>` or its ancestors
- AND Lighthouse SHALL identify the `<h1>` text as the LCP element

#### Scenario: fade-in animation removed from hero text

- GIVEN the `animate-hero-fade-in` CSS class existed previously
- WHEN the page renders after this change
- THEN that class SHALL NOT be applied to h1, lead, eyebrow, or CTAs
- AND if any entrance animation remains, it SHALL complete within ≤ 150ms
- AND the animation SHALL use `transform` or `filter`, not `opacity`
