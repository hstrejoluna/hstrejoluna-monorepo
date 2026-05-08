# Spec: Project Grid SEO

## Purpose

Server-rendered semantic project grid replacing the client-side framer-motion expansion grid. Emits SEO-ready HTML with proper heading hierarchy, JSON-LD `ItemList`, and case study links.

## Requirements

### Requirement: Server-Rendered Semantic Grid

The homepage project grid MUST be an async Server Component. Cards SHALL be `<article>` elements with `<h3>` title, `<p>` shortDescription, and `next/image` thumbnail. Content MUST be present in SSR HTML (visible via `curl`).

#### Scenario: SSR renders project cards

- GIVEN a request to `/en` or `/es`
- WHEN the page is server-rendered
- THEN response HTML SHALL contain `<article>` elements with `<h3>` project titles
- AND each card SHALL include a `<p>` short description and a thumbnail via `next/image`

#### Scenario: No client JS required

- GIVEN JavaScript is disabled in the browser
- WHEN the homepage loads
- THEN all project cards SHALL be fully rendered and links SHALL work (native `<a>` behavior)

### Requirement: Case Study Navigation

Each card MUST link to `/projects/[slug]` via `next/link`. Cards MUST NOT link to `externalLink` or `micrositePath`.

#### Scenario: Internal navigation

- GIVEN a project with slug `my-project`
- WHEN the card link is activated (click or keyboard)
- THEN the browser navigates to `/en/projects/my-project` or `/es/projects/my-project`
- AND the link SHALL have descriptive text (not "click here")

### Requirement: JSON-LD ItemList

The homepage MUST emit JSON-LD `ItemList` of `CreativeWork` entries. Each entry SHALL include `name`, `url`, `description`, and `image`.

#### Scenario: Valid ItemList

- GIVEN the homepage renders with N projects
- WHEN Google Rich Results Test validates the page
- THEN `ItemList` JSON-LD SHALL parse without errors
- AND each `itemListElement` SHALL contain valid `CreativeWork` properties

### Requirement: Fixed Heading & Landmarks

The document MUST have exactly one `<h1>` and exactly one `<main id="main-content">`. `<h3>` titles MUST NOT be nested inside `<button>` elements.

#### Scenario: Single main element

- GIVEN the homepage renders
- WHEN DOM is inspected
- THEN exactly one `<main id="main-content">` SHALL exist
- AND it SHALL be defined in `layout.tsx`, NOT in `ObsidianStream.tsx`

### Requirement: CSS-Only Design

Grid layout SHALL use CSS Grid (1 col mobile, 2 col md, 3 col lg) with CSS-only hover transitions. Framer-motion SHALL NOT be imported by the grid component. `.grid-with-life` CSS SHALL be removed from `globals.css`.

#### Scenario: Reduced motion respect

- GIVEN `prefers-reduced-motion: reduce` is active
- WHEN the grid renders
- THEN CSS hover transitions SHALL be disabled
- AND no animation-driven layout shift SHALL occur

### Requirement: Accessibility

The grid SHALL produce zero axe violations. Cards SHALL have keyboard-navigable focus indicators, minimum 4.5:1 contrast, and proper `alt` text on images.

#### Scenario: Keyboard navigation

- GIVEN a keyboard-only user
- WHEN tabbing through the grid
- THEN each card link SHALL receive visible `:focus-visible` indicator
- AND all cards SHALL be reachable in DOM order

### Requirement: Dynamic Sitemap

The sitemap MUST include all project case study URLs at `/[locale]/projects/[slug]` for every published project.

#### Scenario: Project slugs in sitemap

- GIVEN a published project with slug `my-project`
- WHEN `GET /sitemap.xml` is requested
- THEN XML SHALL include `<url>` entries for `/en/projects/my-project` and `/es/projects/my-project`
- AND each entry SHALL include `lastmod` from `_updatedAt`

### Requirement: i18n Support

Grid labels (e.g., "View Case Study") MUST be translatable via `next-intl` under `projectsGrid.*` namespace in `messages/en.json` and `messages/es.json`.

#### Scenario: Locale-aware labels

- GIVEN locale is `es`
- WHEN the grid renders
- THEN all visible strings SHALL come from `messages/es.json` under `projectsGrid.*`

## Architecture Decisions

- **RSC by Default**: Server Component produces zero JS bundle for the grid; all content in SSR HTML.
- **CSS-Only Interactions**: No framer-motion dependency in grid; CSS transitions respect `prefers-reduced-motion`.
- **Data Co-location**: Project data fetched in `page.tsx` via `Promise.all` — no RSC waterfall.
