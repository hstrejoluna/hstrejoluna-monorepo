# portfolio-testing-foundation Specification

## Purpose

Definir una base formal de testing para `apps/portfolio` que cubra la logica nueva de certificados con ejecucion automatizada y repetible.

## Requirements

### Requirement: Test Runner and Environment Setup

The system MUST provide a configured test runner for `apps/portfolio` with a browser-like environment suitable for React component tests.

#### Scenario: Local test execution

- GIVEN project dependencies are installed
- WHEN a developer runs the portfolio test command
- THEN the test runner MUST execute successfully in the configured environment
- AND the command MUST be documented in package scripts

#### Scenario: Shared test setup loading

- GIVEN test files rely on shared matchers or global mocks
- WHEN tests are executed
- THEN the runner MUST load a centralized setup file before test execution
- AND the setup MUST be reusable across new tests without per-test duplication

### Requirement: Certificates Domain Test Coverage

The system SHALL include automated tests for certificate normalization and certificate section rendering behaviors defined in this change.

#### Scenario: Normalization behavior validation

- GIVEN raw Apify certificate payloads with full and partial fields
- WHEN normalization logic is tested
- THEN the tests MUST validate identity key derivation and null-safe mapping
- AND malformed entries SHOULD be asserted as skipped or handled defensively

#### Scenario: Certificates UI rendering validation

- GIVEN certificate lists with and without source links
- WHEN `CertificatesOverview` is rendered in tests
- THEN the tests MUST verify certificate labels and issuer metadata
- AND the tests MUST verify empty-state rendering when input is empty

### Requirement: CI-Friendly Test Command Contract

The system MUST expose deterministic test commands that can be reused in local development and CI pipelines.

#### Scenario: Non-watch execution for automation

- GIVEN CI or pre-merge validation contexts
- WHEN the non-watch test script is executed
- THEN the command MUST terminate with pass/fail exit codes
- AND failures MUST identify the failing suite and test case

#### Scenario: Fast feedback in development

- GIVEN developers iterating on the certificates change
- WHEN watch-mode command is executed
- THEN the runner SHOULD provide incremental reruns for touched files
- AND developers MAY run scoped tests for certificate modules/components

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
- **And** the Performance category SHALL score ≥ 0.6 (error) and ≥ 0.7 (warning)
- **And** LCP SHALL be ≤ 4.0 s (error)
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
