# Exploration: Lighthouse CI Failures — Root Cause Analysis

## Current State

The portfolio app (`apps/portfolio`) has a Lighthouse CI gate that fails on every PR. The page is a Next.js 16 App Router site using `next-intl` for i18n, Sanity as a headless CMS, framer-motion for animations, and a custom `@hstrejoluna/ui` package with "Liquid Glass" SVG filter effects.

**Rendering chain for `/en`:**
1. `middleware.ts` redirects `/` → `/en` (307)
2. Layout (`app/[locale]/layout.tsx`) renders: fonts (Inter, Space Grotesk, JetBrains Mono), `LiquidGlassFilters` (SVG `<defs>` with displacement maps), skip link, header, `<main>`, `<Footer>`, `<CookieBanner>`, `<GoogleTagManager>`
3. Page (`app/[locale]/page.tsx`) fetches 5 Sanity queries in parallel via `Promise.all`, passes all data to `<ObsidianStream>` client component
4. `ObsidianStream` renders: BootSequence (skipped via `NEXT_PUBLIC_SKIP_BOOT_SEQUENCE=1`), `<CommandNav>`, `<HeroSection>`, 4 `<StreamSection>` components (Projects, Experience, Skills, Certificates), `<ScrollProgressBar>`

**Page configuration:**
- `export const dynamic = "force-dynamic"` — SSR on every request, zero caching
- No `error.tsx` — any unhandled error crashes the page

**Measured HTML size:** 291KB (291,173 bytes)
**Measured TTFB:** ~0.9s (locally)
**DOM elements:** ~1,000
**JS chunks total:** 932KB (largest: 226KB framer-motion)

## Root Causes (by impact severity)

### CRITICAL — #1: 291KB HTML Response (single biggest performance killer)
The page SSR's ALL content into the initial HTML: 16 projects with full descriptions and `<img>` srcSets, 13+ experiences, all skills, all certificates, all Liquid Glass SVG filter defs with base64 displacement maps. This causes:
- Slow TTFB (server spends time composing 291KB)
- Slow FCP (browser must parse 291KB HTML)
- Lighthouse "Avoids an excessive DOM size" audit fails
- This alone drops performance below 0.9

### CRITICAL — #2: `force-dynamic` with No Caching
Every Lighthouse run hits the origin with 5 parallel Sanity queries. No ISR, no CDN caching, no static generation. The page could be ISR'd with `revalidate` or use `export const revalidate = 3600`.

### CRITICAL — #3: No Error Boundary (No `error.tsx`)
If any of the 5 Sanity queries fail (network timeout, token issue in CI), the entire page crashes with an unhandled error, showing a blank page. This could explain the **NaN performance** on PR #77 — Lighthouse sees a completely blank/crashed page and can't compute any metrics.

### CRITICAL — #4: 0.5s Opacity Animation on LCP
`animate-hero-fade-in` starts content at `opacity: 0` and fades to 1 over 0.5s. During this time, Lighthouse's LCP measurement may see no visible content (or register delayed LCP), contributing to poor scores and potentially NaN if the animation starts late.

### HIGH — #5: framer-motion in Critical Path (226KB chunk)
- `CookieBanner.tsx` — imports `m, AnimatePresence` from framer-motion (always on page)
- `CommandNav.tsx` → `LiquidNav` (from `@hstrejoluna/ui`) — imports `m, AnimatePresence`
- `SkillsOverview.tsx` — imports `m, AnimatePresence` (below fold but eagerly loaded)
- `ExperienceOverview.tsx` — imports `m, AnimatePresence` (below fold)
- `BootSequence` (in `@hstrejoluna/ui`) — imports `m, AnimatePresence` (conditional but still bundled)
- None of these use `next/dynamic` — all loaded in the critical path

### HIGH — #6: Unrealistic Lighthouse Thresholds
Current thresholds demand performance ≥0.9 on an SSR-heavy portfolio with animations, 291KB HTML, and 932KB JS. Realistic targets:
- Performance: **0.7 (warn) / 0.6 (error)**
- FCP: **5000ms** instead of 3000ms
- LCP: **4000ms** instead of 2500ms
- Speed-index: keep 4000ms or relax to 5000ms

### HIGH — #7: Middleware Redirect Adds Latency
`/` → `/en` (307 redirect) adds one round-trip. The Lighthouse URL should directly use `/en` to skip this.

## Affected Areas

| File | Problem | Impact |
|------|---------|--------|
| `apps/portfolio/app/[locale]/page.tsx` | `force-dynamic`, no ISR, SSR all data | TTFB +291KB |
| `apps/portfolio/app/[locale]/layout.tsx` | No Suspense boundaries, all components eagerly loaded | Render blocking |
| `apps/portfolio/components/ObsidianStream.tsx` | All content rendered at once, no code splitting | LCP/TBT |
| `apps/portfolio/components/fragments/CookieBanner.tsx` | framer-motion in critical path | TBT +226KB |
| `apps/portfolio/components/fragments/ExperienceOverview.tsx` | framer-motion, all 13 experiences in DOM | TBT, DOM size |
| `apps/portfolio/components/fragments/SkillsOverview.tsx` | framer-motion | TBT |
| `apps/portfolio/components/ui/CommandNav.tsx` → `packages/ui/src/components/LiquidNav.tsx` | framer-motion | TBT |
| `packages/ui/src/components/BootSequence.tsx` | framer-motion, canvas animation (bundled even when skipped) | Bundle size |
| `apps/portfolio/middleware.ts` | Deprecated file convention (Next.js 16) | Runtime warning |
| `apps/portfolio/lighthouserc.cjs` | Too-aggressive thresholds, redirect-heavy URL | Gate failures |
| `apps/portfolio/app/globals.css` | Infinite hero-blob animations, noise texture pseudo-element, `animate-hero-fade-in` delay | LCP, TBT |
| `apps/portfolio/lib/sanity.ts` | `useCdn: false` — no CDN for reads | TTFB |
| `.github/workflows/qa-professional.yml` | `qa:lighthouse` script builds AND tests | No separation of concerns |
| Missing: `apps/portfolio/app/**/error.tsx` | No error boundary | Silent crashes → NaN |

## Approaches

### 1. Tactical Fix (Low Effort, ~2 files)
Relax thresholds in `lighthouserc.cjs`, change URL to `/en`, add `error.tsx`.
- **Pros**: Quick, gets CI passing immediately
- **Cons**: Doesn't fix root causes, hides performance problems
- **Effort**: Low

### 2. Performance Optimization (Medium Effort, ~8 files)
Code-split heavy components with `next/dynamic`, add ISR to page, defer non-critical CSS animations, add error boundary, adjust thresholds conservatively.
- **Pros**: Genuinely fixes performance while keeping CI passing
- **Cons**: More code changes, needs testing
- **Effort**: Medium

### 3. Architectural Overhaul (High Effort, ~15+ files)
Remove framer-motion from critical path, implement progressive enhancement for Liquid Glass, add Suspense + streaming, migrate middleware to proxy, rewrite CSS animations, add proper error boundaries.
- **Pros**: Maximum performance, future-proof
- **Cons**: Huge scope, high risk of regressions
- **Effort**: High

## Recommendation

**Approach 2 — Performance Optimization** supplemented with tactical threshold adjustments.

### Immediate fixes (safe, high impact):
1. Add `error.tsx` to prevent silent crashes (fixes NaN)
2. Change `lighthouserc.cjs` URL to `http://127.0.0.1:4173/en` (skip redirect)
3. Lower thresholds: performance to 0.7 warn/0.6 error; FCP to 5000ms; LCP to 4000ms
4. Add `export const revalidate = 3600` to the page (enable ISR)
5. Wrap `CookieBanner` and `CommandNav` in `next/dynamic` with `ssr: false` + loading placeholder
6. Remove `animate-hero-fade-in` opacity animation or reduce to 150ms
7. Add `outputFileTracingRoot` to next.config to silence the lockfile warning
8. Change `useCdn: true` in sanity client for read operations

### Longer-term (next PR):
9. Code-split SkillsOverview and ExperienceOverview with Suspense
10. Wrap BootSequence in `next/dynamic`
11. Migrate `middleware.ts` to `proxy.ts`
12. Add `priority` to hero images (if any)
13. Consider partial pre-rendering (PPR) for the page

## Risks
- Changing `force-dynamic` to ISR could serve stale data if Sanity webhooks aren't configured
- Code-splitting client components may add loading states that affect UX
- Lower thresholds may let real performance regressions through if not balanced with warn levels
- framer-motion removal from `@hstrejoluna/ui` requires coordination across packages

## Ready for Proposal
Yes — proceed to `sdd-propose` with the recommended approach.
