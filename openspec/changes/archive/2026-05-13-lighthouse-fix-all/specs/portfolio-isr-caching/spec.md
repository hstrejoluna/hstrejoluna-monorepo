# portfolio-isr-caching Specification

## Purpose

Replace `force-dynamic` with Incremental Static Regeneration (ISR) on the portfolio home page to reduce SSR HTML payload and enable CDN caching.

## Requirements

### Requirement: ISR Replaces force-dynamic

The home page SHALL use `export const revalidate = 60` instead of `force-dynamic`.

#### Scenario: cached page served from CDN within window

- GIVEN a page was built and cached by the CDN
- WHEN a request arrives within the 60s revalidate window
- THEN the cached HTML SHALL be served directly
- AND SSR SHALL NOT re-execute for that request
- AND the response SHALL include `x-nextjs-cache: HIT` header

#### Scenario: stale page revalidated after window

- GIVEN the 60s revalidate window has elapsed since last generation
- WHEN the next request arrives
- THEN Next.js SHALL trigger a background regeneration
- AND the stale cached version SHALL be served to the triggering request
- AND subsequent requests SHALL receive the freshly generated page

#### Scenario: ISR does not break i18n routing

- GIVEN pages are cached per locale (`/en`, `/es`)
- WHEN a request arrives for `/es` after `/en` was recently generated
- THEN each locale SHALL have independent ISR cache entries
- AND the correct translated content SHALL be served per locale

### Requirement: Sanity CDN Usage

The Sanity client SHALL use `useCdn: true` for all public-facing data fetches.

#### Scenario: CDN reduces Sanity query latency

- GIVEN a Sanity client configured with `useCdn: true`
- WHEN queries for `profile` or `projects` execute
- THEN the query SHALL route through Sanity's CDN
- AND stale-by-≤60s data SHALL be acceptable for public read paths

#### Scenario: useCdn does not affect unpublished content

- GIVEN Sanity content is in draft state (not yet published)
- WHEN `useCdn: true` is configured
- THEN draft content SHALL NOT appear on the public site
- AND only published content SHALL be served via CDN
