# Proposal: Fix All Lighthouse CI Failures

## Intent

Lighthouse CI fails on every PR — scores are NaN (crashed) or below 0.9. Root causes: no error handling (blank page on Sanity failure → NaN), 291KB SSR HTML, `force-dynamic` disabling caching, framer-motion in critical path (226KB), 0.5s opacity animation masking LCP, unrealistic thresholds.

## Scope

### In Scope
- `error.tsx` boundary preventing blank-page crashes (fixes NaN)
- ISR (`revalidate`) replacing `force-dynamic` on home page
- `next/dynamic` for `CookieBanner`, `CommandNav`/`LiquidNav`
- Remove/reduce `animate-hero-fade-in` opacity animation
- Realistic thresholds: perf 0.7/0.6, FCP 5000ms, LCP 4000ms
- LHCI URL → `/en` (skip 307 redirect)
- `useCdn: true` in Sanity client

### Out of Scope
- Full framer-motion removal from `@hstrejoluna/ui`
- Middleware → proxy, PPR streaming, below-fold code-splitting, BootSequence refactor

## Capabilities

### New
- **portfolio-error-resilience**: Error boundary catching Sanity failures, preventing NaN scores
- **portfolio-isr-caching**: ISR with configurable `revalidate` replacing `force-dynamic`
- **lighthouse-ci-gate**: Calibrated thresholds, direct `/en` URL, realistic metrics

### Modified
- **liquid-glass-hero**: Relax LCP budget 2.5s → 4.0s. Forbid CSS opacity on LCP candidates.
- **portfolio-testing-foundation**: Align SEO ≥ 95 scenario with new CI gate.

## Approach

**Performance fixes + realistic thresholds.** Safe fixes (error boundary, ISR, thresholds) restore CI to green. Code-splitting + animation removal reduce critical JS ~226KB. Remaining work (PPR, full framer-motion tree-shaking) deferred.

## Affected Areas

| Area | Impact | Change |
|------|--------|--------|
| `page.tsx` | Modified | `force-dynamic` → ISR |
| `layout.tsx` | Modified | `next/dynamic` for `CookieBanner` |
| `ObsidianStream.tsx` | Modified | `next/dynamic` for `CommandNav` |
| `globals.css` | Modified | Remove/reduce fade-in animation |
| `lighthouserc.cjs` | Modified | Thresholds 0.9→0.7, URL→`/en` |
| `lib/sanity.ts` | Modified | `useCdn: true` |
| `app/error.tsx` | **New** | Root error boundary |
| `app/[locale]/error.tsx` | **New** | Locale-scoped error boundary |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| ISR stale data without Sanity webhooks | Low | `revalidate: 60`; documented rollback |
| Code-split loading flash on slow connections | Med | `loading.tsx` placeholders |
| Lower thresholds hide regressions | Med | Warn above error level; CI reports warnings |
| Animation removal changes visual identity | Low | Reduce to 150ms, not remove |

## Rollback Plan

Each change independently revertable:
1. Remove `export const revalidate` from `page.tsx` (1-line)
2. Delete `error.tsx` files (never existed before)
3. `git checkout HEAD~1 -- lighthouserc.cjs`
4. `useCdn: false` — instant, no rebuild

## Dependencies

None. All changes contained within `apps/portfolio`.

## Success Criteria

- [ ] `qa:lighthouse` passes with zero errors (warns allowed)
- [ ] No NaN scores across 3 consecutive runs
- [ ] `npm run build` succeeds without new warnings
- [ ] Existing Playwright E2E tests pass
- [ ] HTML payload reduced ≥ 20% (291KB → ~230KB)
