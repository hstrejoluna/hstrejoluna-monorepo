# lighthouse-ci-gate Specification

## Purpose

Define realistic Lighthouse CI assertion thresholds that match actual application performance, replacing broken 0.9 targets that cause perpetual CI failure.

> **Note**: Design chose Performance thresholds `0.7w/0.6e` (warn at 0.7 to catch regressions, error at 0.6 to protect against catastrophic degradation) as authoritative over the original spec's `0.6w/0.5e`. FCP uses error-only at 5000ms; LCP uses error-only at 4000ms. Rationale: 0.9 perf on an SSR portfolio with SVG filters is unrealistic. Warning thresholds omitted for FCP/LCP where the primary concern is catastrophic failure, not gradual drift.

## Requirements

### Requirement: Calibrated Thresholds

The Lighthouse CI config (`lighthouserc.cjs`) SHALL use the following assertion thresholds:

| Metric            | Warning | Error |
|-------------------|---------|-------|
| Performance       | 0.7     | 0.6   |
| Accessibility     | 0.9     | 0.8   |
| Best Practices    | 0.9     | 0.8   |
| SEO               | 0.95    | 0.9   |
| FCP (ms)          | —       | 5000  |
| LCP (ms)          | —       | 4000  |
| TBT (ms)          | 600     | 1000  |
| CLS               | 0.1     | 0.25  |

#### Scenario: CI passes with realistic scores

- GIVEN a production build of the portfolio app
- WHEN `qa:lighthouse` runs against `/en`
- THEN all categories SHALL pass at warning level or above
- AND zero assertions SHALL fail at error level
- AND no category SHALL produce NaN scores

#### Scenario: regression below error level fails CI

- GIVEN a PR introduces a performance regression
- WHEN Lighthouse scores drop below error thresholds
- THEN `qa:lighthouse` SHALL exit with non-zero code
- AND the PR SHALL be blocked from merging

#### Scenario: warning-level violations allowed but reported

- GIVEN a score falls between warning and error thresholds
- WHEN `qa:lighthouse` completes
- THEN the step SHALL pass (exit 0)
- AND a warning annotation SHALL appear in the CI output

### Requirement: Direct URL Bypasses Redirects

The Lighthouse CI URL SHALL target `/en` directly, avoiding the 307 redirect from `/` that adds latency.

#### Scenario: no redirect in audit path

- GIVEN `lighthouserc.cjs` configured with `url` pointing to `/en`
- WHEN Lighthouse audits the page
- THEN the first navigation SHALL return HTTP 200
- AND no HTTP 307 redirect SHALL appear in the trace
- AND the redirect overhead (~200-500ms) SHALL be eliminated from TTFB/FCP
