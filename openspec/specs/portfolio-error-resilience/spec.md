# portfolio-error-resilience Specification

## Purpose

Prevent blank-page crashes from Sanity CMS failures that cause Lighthouse NaN scores. Provide graceful error UI with retry capability.

## Requirements

### Requirement: Root Error Boundary

The system SHALL render an `error.tsx` boundary at the App Router root catching uncaught render errors from Sanity or other data sources.

#### Scenario: Sanity fetch failure renders error page

- GIVEN Sanity API is unreachable during SSR
- WHEN the home page renders
- THEN the error boundary SHALL catch the error
- AND render an error UI with a retry action
- AND the HTTP response SHALL NOT return 200 OK
- AND Lighthouse SHALL score actual metrics, not NaN

#### Scenario: error page includes retry mechanism

- GIVEN the error boundary has caught an error
- WHEN the user activates the retry action
- THEN the page SHALL attempt a fresh server render
- AND the error boundary SHALL reset its internal error state
- AND on success the original page content SHALL display

#### Scenario: non-Sanity errors also caught

- GIVEN any unhandled render error in the root layout or page tree
- WHEN the error propagates past component boundaries
- THEN the error boundary SHALL catch it
- AND the same error UI SHALL render

### Requirement: Locale-Scoped Error Boundary

The system SHALL render `app/[locale]/error.tsx` catching errors within locale-scoped route segments without affecting sibling routes.

#### Scenario: scoped errors do not bubble to root

- GIVEN a render error inside `/en/projects`
- WHEN the locale-scoped error boundary catches it
- THEN the scoped error UI SHALL render within the locale layout
- AND sibling routes (e.g., `/en`) SHALL remain unaffected
- AND the root error boundary SHALL NOT be triggered

#### Scenario: scoped boundary resets correctly

- GIVEN the locale error boundary is displaying an error
- WHEN the user clicks retry on the scoped error page
- THEN only the errored route segment SHALL re-render
- AND the shared layout (header, footer) SHALL persist unchanged
