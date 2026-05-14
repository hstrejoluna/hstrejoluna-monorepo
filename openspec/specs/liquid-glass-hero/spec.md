# liquid-glass-hero Specification

## Purpose

Defines the behavior contract for the redesigned hero section. The hero MUST render semantic SSR content (h1, lead, CTAs) with liquid-glass visual layers (CSS + optional WebGL) while maintaining accessibility, SEO, and performance budgets. Archived from change `hero-liquid-glass-redesign` on 2026-05-07.

## Requirements

### Requirement: Semantic SSR shell

The hero section SHALL render a Server Component that emits in initial SSR HTML:

- Exactly one `<h1>` element with id `hero-title`.
- A `<section>` element with `aria-labelledby="hero-title"` enclosing the `<h1>`.
- A `<p>` lead paragraph carrying the role/value-prop sentence.
- Two `<a>` CTAs: a primary anchor pointing to `#projects` and a secondary anchor pointing to an external profile URL.
- An eyebrow `<p>` containing the translatable mono badge.

The `<h1>` text MUST contain the canonical name **and** a role keyword. The locked copy is:

- en: `Héctor Trejo Luna — Senior Software Architect`
- es: `Héctor Trejo Luna — Arquitecto Senior de Software`

The h1 MUST NOT depend on Sanity content; its text is sourced exclusively from `messages/{locale}.json` under `hero.*`.

#### Scenario: hero is rendered server-side

- **Given** a request to `/en` or `/es`
- **When** the page is server-rendered
- **Then** the response HTML SHALL contain exactly one `<h1>` element inside the hero section
- **And** that `<h1>` SHALL be the LCP candidate (text node, no `aria-hidden`, no `display:none`, no `visibility:hidden`, no `opacity:0` at first paint)
- **And** the enclosing `<section>` SHALL reference the h1 via `aria-labelledby="hero-title"`

#### Scenario: hero copy is translatable

- **Given** the i18n locale is `"en"`
- **When** the hero renders
- **Then** every visible string in the hero SHALL come from `messages/en.json` under the `hero.*` namespace
- **And** the same SHALL hold for locale `"es"` via `messages/es.json`
- **And** the `messages/en.test.ts` and `messages/es.test.ts` parity checks SHALL include all `hero.*` keys

#### Scenario: Sanity profile fallback (non-h1 paths only)

- **Given** Sanity returns a `profile` document with `headline` set
- **When** the lead paragraph renders
- **Then** the lead SHALL prefer `profile.headline` and fall back to `messages.hero.lead` when `headline` is null or undefined
- **And** the `<h1>` text SHALL never depend on Sanity (always static name + role from messages)

---

### Requirement: Liquid glass CSS layer (always-on)

A client component `LiquidGlassBackdrop` SHALL render `aria-hidden="true"` visual layers behind the semantic shell, providing:

- Three animated radial-gradient blobs drifting via CSS keyframes.
- An SVG `<filter>` exposing `feTurbulence` + `feDisplacementMap`, applied to blob layers as `filter: url(#liquid-goo)`.
- A glass card with `backdrop-filter: blur() saturate() brightness()` containing the h1 + lead.

This layer SHALL run on ALL viewports and ALL capability profiles, including reduced-motion (in which case animations are frozen but the visual treatment remains).

#### Scenario: cursor reactivity updates CSS variables only

- **Given** the user moves the pointer over the hero
- **When** the section receives a `pointermove` event
- **Then** exactly one rAF-throttled handler SHALL update CSS custom properties `--mx`, `--my`, `--vx`, `--vy` on the section element
- **And** no React component SHALL re-render as a consequence (verified by render-count assertion in tests)
- **And** blobs SHALL visually follow via CSS `transform: translate(...)` reading those variables

#### Scenario: reduced-motion freezes the CSS layer

- **Given** `prefers-reduced-motion: reduce` is honored by the browser
- **When** the hero mounts
- **Then** blob keyframe animations SHALL be paused or removed
- **And** the radial-gradient blobs SHALL be at fixed positions (no parallax, no cursor follow)
- **And** no `pointermove` listener SHALL be attached
- **And** the SVG goo filter SHALL still apply (purely visual, not animated)

---

### Requirement: WebGL refraction layer (capability-gated, lazy)

A client component `LiquidGlassWebGL` SHALL be loaded lazily and mounted only when ALL of the following are true:

1. `useReducedMotion()` returns false (i.e. `prefers-reduced-motion: no-preference`)
2. `window.matchMedia('(min-width: 1024px)').matches`
3. `navigator.hardwareConcurrency >= 4`
4. WebGL2 context creation succeeds on a probe canvas
5. `(navigator.connection?.saveData ?? false) === false`
6. The hero section enters the viewport (IntersectionObserver fires with ratio ≥ 0.1)

When mounted, this component SHALL render a fullscreen plane applying a transmission/refraction material to produce the liquid-glass effect.

The component SHALL NOT execute during SSR.

#### Scenario: WebGL skipped on small viewports

- **Given** a viewport width of 768px
- **When** the hero hydrates
- **Then** `LiquidGlassWebGL` SHALL NOT be loaded
- **And** the network log SHALL NOT include the WebGL chunk
- **And** the CSS layer SHALL be the only animated visual

#### Scenario: WebGL skipped under reduced-motion

- **Given** the user has `prefers-reduced-motion: reduce` set
- **When** the hero hydrates on a 1440px viewport with `hardwareConcurrency >= 8`
- **Then** `LiquidGlassWebGL` SHALL NOT mount
- **And** the entrance burst animation SHALL NOT play

#### Scenario: WebGL skipped on save-data connections

- **Given** `navigator.connection.saveData === true`
- **When** the hero hydrates on an otherwise capable device
- **Then** `LiquidGlassWebGL` SHALL NOT mount
- **And** the WebGL chunk SHALL NOT be requested

#### Scenario: WebGL skipped without WebGL2

- **Given** WebGL2 context creation fails on the probe canvas
- **When** the capability gate evaluates
- **Then** `LiquidGlassWebGL` SHALL NOT mount

#### Scenario: WebGL teardown on unmount

- **Given** the WebGL layer is mounted
- **When** the user navigates away from the hero (component unmounts)
- **Then** the WebGL renderer SHALL dispose its GPU resources (textures, geometries, materials, framebuffers)
- **And** all rAF subscriptions tied to the canvas SHALL be cancelled
- **And** all `resize`, `pointermove`, `scroll` listeners owned by the layer SHALL be removed
- **And** no measurable memory leak SHALL occur across 100 mount/unmount cycles in a Playwright stress test (heap delta within ±5% of baseline)

---

### Requirement: Entrance burst splash

On the first mount of `LiquidGlassWebGL` for a given page load, a one-shot "burst" animation SHALL play.

#### Scenario: burst plays once on initial mount

- **Given** the WebGL layer mounts for the first time on this page load
- **When** the canvas is ready (renderer initialized, material compiled)
- **Then** a burst signal SHALL ramp from `0` → `1` → idle over a duration of ≤ 1200ms
- **And** the burst SHALL play exactly once per page load (guarded by an in-memory or `sessionStorage` flag)
- **And** subsequent unmount/remount cycles within the same page load SHALL NOT replay the burst

#### Scenario: burst suppressed under reduced-motion

- **Given** `prefers-reduced-motion: reduce` is set
- **When** the hero loads
- **Then** the burst animation SHALL NOT play (because `LiquidGlassWebGL` does not mount)

---

### Requirement: Scroll-driven distortion

A scroll-linked signal SHALL bend the WebGL refraction while the hero is visible.

#### Scenario: scroll progress maps to distortion

- **Given** the WebGL layer is mounted and the hero is on screen
- **When** the user scrolls (scroll progress 0..1 across hero height)
- **Then** a uniform `uScroll` SHALL track scroll progress in the range [0, 1]
- **And** the refraction material's distortion (or temporal distortion) SHALL be modulated by `uScroll`
- **And** when `prefers-reduced-motion: reduce` is active, `uScroll` SHALL be clamped to `0` (no distortion change on scroll)

#### Scenario: scroll signal stops outside hero viewport

- **Given** the user has scrolled past the hero so it is no longer in viewport
- **When** further scrolling occurs
- **Then** `uScroll` SHALL NOT continue to update (frame loop SHALL pause or skip)
- **And** the canvas SHALL NOT consume frame budget while off-screen

---

### Requirement: Performance budgets

- Initial JavaScript for `apps/portfolio` SHALL increase by NO MORE than **5 KB gzipped** versus the baseline measured at proposal time.
- The lazy WebGL chunk SHALL be ≤ **300 KB gzipped**.
- Largest Contentful Paint (LCP) on a slow-4G mobile profile SHALL be ≤ **4.0 s**.
- Interaction to Next Paint (INP) on hero interactions (pointer move, CTA click) SHALL be ≤ **200 ms**.
- Cumulative Layout Shift (CLS) on initial hero render SHALL be ≤ **0.1**.
(Previously: LCP budget was ≤ 2.5 s — relaxed for realistic 3D-animated portfolio performance)

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

---

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

---

### Requirement: Accessibility

- The hero SHALL produce zero axe violations of any rule, any impact level.
- All decorative liquid-glass layers (CSS blobs, SVG filter, WebGL canvas) SHALL be marked `aria-hidden="true"`.
- The h1, lead, eyebrow, and CTAs SHALL maintain a contrast ratio ≥ **4.5:1** against their immediate background, including over the glass card surface.
- Focus states on CTAs SHALL be visible without relying on color alone (visible outline or ring).
- The hero SHALL be navigable via keyboard alone (Tab order: skip-link target → eyebrow link if any → CTAs in DOM order).

#### Scenario: a11y test passes

- **Given** the hero is rendered (in any locale, any capability profile)
- **When** `axe.run()` is invoked in a Playwright spec
- **Then** zero violations SHALL be reported

#### Scenario: contrast over fluid background

- **Given** any cursor position and any blob configuration
- **When** the glass card is overlaid on top of the blobs
- **Then** the background luminance behind the h1 + lead SHALL be muted enough (via the tinted/blurred backdrop) to maintain ≥ 4.5:1 contrast
- **And** this SHALL be verified against representative states: idle, cursor at left edge, cursor at right edge, scroll at 50% of hero height

#### Scenario: keyboard focus visibility

- **Given** the hero is rendered on a keyboard-only profile
- **When** the user tabs through the CTAs
- **Then** each focused CTA SHALL display a visible focus indicator that does not rely solely on color
- **And** the indicator SHALL be perceivable over the glass card surface

---

### Requirement: Rollback flag

The new hero SHALL be guarded by an environment flag named `NEXT_PUBLIC_HERO_LIQUID`. Toggling this flag SHALL allow zero-code rollback to the legacy hero.

#### Scenario: flag enabled renders new hero

- **Given** `NEXT_PUBLIC_HERO_LIQUID` is `"true"` at build time
- **When** the page renders
- **Then** the new `HeroSection` component tree SHALL render
- **And** the legacy `HeroFragment` SHALL NOT appear in the rendered tree

#### Scenario: flag disabled keeps legacy hero

- **Given** `NEXT_PUBLIC_HERO_LIQUID` is unset, empty, or `"false"`
- **When** the page renders
- **Then** the legacy `HeroFragment` SHALL render
- **And** no liquid-glass code (CSS layer, WebGL layer, hooks, feature messages) SHALL execute on the client

#### Scenario: flag value is build-time

- **Given** the flag is read via `process.env.NEXT_PUBLIC_HERO_LIQUID`
- **When** the bundle is produced
- **Then** the unselected branch SHALL be tree-shaken out of the production bundle (verified by chunk inspection in CI)

---

### Requirement: SEO surface

- The hero SHALL contribute exactly one `<h1>` to the document.
- The page SHALL emit JSON-LD `Person` structured data including `name`, `jobTitle`, `image`, and `mainEntityOfPage`.
- The Lighthouse SEO category SHALL score ≥ **95** in `qa:lighthouse`.

#### Scenario: single h1 per page

- **Given** the hero is rendered alongside the rest of the home page
- **When** the DOM is inspected
- **Then** exactly one `<h1>` element SHALL exist on the page
- **And** that `<h1>` SHALL be inside the hero section

#### Scenario: JSON-LD Person valid

- **Given** the page is rendered server-side
- **When** Google's structured-data validator (or equivalent JSON-LD lint) inspects the page
- **Then** the `Person` block SHALL parse without errors
- **And** SHALL contain `name`, `jobTitle`, `image`, and `mainEntityOfPage`
