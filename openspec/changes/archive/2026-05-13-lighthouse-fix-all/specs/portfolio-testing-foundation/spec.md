# Delta for portfolio-testing-foundation

## MODIFIED Requirements

### Requirement: Hero Testing Extension

The testing foundation SHALL include hero-specific assertions introduced by the liquid-glass redesign, aligned with the calibrated Lighthouse CI gate.

#### Scenario: hero contains semantic h1 (was: NOT TESTED)

- **Given** any locale (`en`, `es`)
- **When** the hero is rendered in jsdom + Vitest
- **Then** `screen.getByRole('heading', { level: 1 })` SHALL find exactly one element
- **And** that element SHALL contain the canonical name + role text from `messages.hero.h1Name` + `messages.hero.h1Role`

#### Scenario: Lighthouse SEO threshold aligned to CI gate

- **Given** `qa:lighthouse` runs against the production build
- **When** the categories are scored
- **Then** the SEO category SHALL score ≥ 95
- **And** the Performance category SHALL score ≥ 0.6 (warning) and ≥ 0.5 (error)
- **And** LCP SHALL be ≤ 4.0 s (error) and ≤ 2.5 s (warning)
- **And** all CI assertions SHALL reference `lighthouserc.cjs` thresholds
(Previously: only SEO threshold at 95; no performance/LCP alignment with CI gate)

#### Scenario: Playwright e2e covers reduced-motion path

- **Given** a Playwright project configured with `reducedMotion: 'reduce'`
- **When** the hero is loaded
- **Then** no `<canvas>` element SHALL be present inside the hero section
- **And** the hero SHALL still render the h1, lead, and CTAs
- **And** axe SHALL report zero violations

#### Scenario: Playwright e2e covers desktop capable path

- **Given** a Playwright project configured with viewport ≥ 1440×900 and reduced-motion `'no-preference'`
- **When** the hero is loaded
- **Then** a `<canvas>` element SHALL eventually appear inside the hero section (after IntersectionObserver fires)
- **And** the burst animation SHALL be observable via uniform-state assertion or visual snapshot
- **And** the h1 SHALL remain the LCP candidate (verified by Performance API)

#### Scenario: i18n parity tests cover hero keys

- **Given** the hero introduces new `hero.*` keys (eyebrow, h1Name, h1Role, lead, cta, ctaAriaLabel, secondaryLabel, secondaryHref)
- **When** `messages/en.test.ts` and `messages/es.test.ts` run
- **Then** every new key SHALL be present in BOTH locales
- **And** any missing key SHALL fail the parity test
