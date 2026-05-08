# Design: Project Grid SEO Redesign

## Technical Approach

Replace `ProjectsOverview` client component with async Server Component `ProjectsGrid`. Data fetched in `page.tsx` via existing `Promise.all` — no waterfall. Cards render as `<article>` elements with `<h3>`, `<p>`, `<img>` (next/image), and `<a href="/projects/[slug]">`. JSON-LD `ItemList` injected in `page.tsx`. Dynamic sitemap includes all project slugs. Sanity schema extended with additive fields. Dead code removed (`PortfolioGrid`, `ProjectFragment`, `.grid-with-life` CSS). Duplicate `<main>` fixed.

## Architecture Decisions

| Decision                    | Option                                                              | Tradeoff                                                                           | Chosen             |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------ |
| Grid rendering strategy     | RSC + CSS Grid                                                      | RSC: zero JS, SEO-ready, new component. No framer-motion bundle.                   | RSC                |
| Data fetching location      | `page.tsx` Promise.all                                              | Keeps existing pattern; avoids RSC waterfall; single Sanity call.                  | `page.tsx`         |
| JSON-LD injection           | `lib/json-ld.ts` pure function                                      | Follows existing `buildPersonJsonLd` pattern; testable; XSS-safe via `safeJsonLd`. | `lib/json-ld.ts`   |
| Sitemap strategy            | Async Sanity fetch in `app/sitemap.ts`                              | `cache()` wrapper avoids repeated fetches; ISR handles staleness.                  | Async + `cache()`  |
| Card link target            | `/projects/[slug]` via `next/link`                                  | Uses existing case study pages; `getProjectUrl()` already handles this.            | `/projects/[slug]` |
| CSS design                  | Tailwind CSS Grid + CSS transitions                                 | No framer-motion; respects `prefers-reduced-motion`. Matches MD3 tokens.           | CSS-only           |
| `shortDescription` fallback | `project.shortDescription ?? blockToPlainText(project.description)` | Existing projects with empty field continue working; no data migration needed.     | Nullish coalescing |

## Data Flow

```
page.tsx (RSC)
  │
  ├─ Promise.all([
  │    getProfile(),
  │    client.fetch<Project[]>(projectsQuery),   ← GROQ now includes shortDescription, seoKeywords, category
  │    client.fetch<Skill[]>(skillsQuery),
  │    client.fetch<Experience[]>(experiencesQuery),
  │    client.fetch<Certificate[]>(certificatesQuery),
  │  ])
  │
  ├─ buildProjectListJsonLd({ projects, locale })  → <script type="application/ld+json">
  ├─ buildPersonJsonLd({ profile, skills, locale }) → <script type="application/ld+json">
  │
  └─ ObsidianStream({ projects, ... })     ← client component (wrapper)
       └─ ProjectsGrid({ projects, locale }) ← NEW RSC (replaces ProjectsOverview)
            └─ <article> × N
                 ├─ <Image> (next/image, Sanity CDN)
                 ├─ <h3> {project.title}
                 ├─ <p> {shortDescription ?? blockToPlainText(description)}
                 └─ <a href="/projects/[slug]"> {t("projectsGrid.viewCaseStudy")}
```

## File Changes

| File                                                              | Action        | Description                                                                                                                  |
| ----------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `apps/portfolio/components/ProjectsGrid.tsx`                      | **Create**    | Async RSC: `<ul>` → `<li>` → `<article>` cards with CSS Grid, `next/image`, `next/link`, i18n                                |
| `apps/portfolio/components/fragments/ProjectsOverview.tsx`        | **Delete**    | Old client component with framer-motion expansion                                                                            |
| `apps/portfolio/components/fragments/ProjectsOverview.test.tsx`   | **Delete**    | Old unit tests                                                                                                               |
| `apps/portfolio/components/ProjectsGrid.test.tsx`                 | **Create**    | Unit tests: SSR output, fallback descriptions, correct links, sans-JS rendering                                              |
| `apps/portfolio/components/PortfolioGrid.tsx`                     | **Delete**    | Dead code (unused client component)                                                                                          |
| `apps/portfolio/components/fragments/ProjectFragment.tsx`         | **Delete**    | Dead code                                                                                                                    |
| `apps/portfolio/components/fragments/ProjectFragment.test.tsx`    | **Delete**    | Dead code test                                                                                                               |
| `apps/portfolio/components/fragments/ProjectFragment.stories.tsx` | **Delete**    | Dead code story                                                                                                              |
| `apps/portfolio/components/ObsidianStream.tsx`                    | **Modify**    | Remove duplicate `<main>`; replace `ProjectsOverview` → `ProjectsGrid` import; remove `framer-motion` from grid area         |
| `apps/portfolio/app/[locale]/page.tsx`                            | **Modify**    | Add `buildProjectListJsonLd` call; update GROQ to select new fields; pass `projects` to new component                        |
| `apps/portfolio/app/[locale]/projects/[slug]/page.tsx`            | **Modify**    | Metadata: `project.shortDescription ?? blockToPlainText(project.description)`                                                |
| `apps/portfolio/app/sitemap.ts`                                   | **Modify**    | Async: fetch all slugs from Sanity, include `/projects/[slug]` per locale with `<lastmod>` and `<xhtml:link>` alternates     |
| `apps/portfolio/lib/json-ld.ts`                                   | **Modify**    | Add `buildProjectListJsonLd()` pure function: `ItemList` → `CreativeWork` entries                                            |
| `apps/portfolio/lib/safe-json-ld.ts`                              | **No change** | Reuse existing `safeJsonLd` helper                                                                                           |
| `apps/portfolio/types/sanity.ts`                                  | **Modify**    | Add `shortDescription?: string`, `seoKeywords?: string[]`, `category?: string` to `Project`                                  |
| `apps/studio/schemaTypes/project.ts`                              | **Modify**    | Add three new `defineField` entries: `shortDescription` (string, max 200), `seoKeywords` (string array), `category` (string) |
| `apps/portfolio/app/globals.css`                                  | **Modify**    | Remove `.grid-with-life` block (lines 236-270), `grid-pulse` keyframe (lines 224-233), `scanline` keyframe (lines 291-298)   |
| `apps/portfolio/messages/en.json`                                 | **Modify**    | Add `projectsGrid.viewCaseStudy`; remove `portfolioGrid.*` refs after audit                                                  |
| `apps/portfolio/messages/es.json`                                 | **Modify**    | Add `projectsGrid.viewCaseStudy: "VER_CASO_DE_ESTUDIO"`; remove `portfolioGrid.*` refs after audit                           |
| `apps/portfolio/e2e/grid-expansion.behavior.spec.ts`              | **Delete**    | In-place expansion tests no longer applicable                                                                                |
| `apps/portfolio/e2e/project-grid-seo.spec.ts`                     | **Create**    | New E2E: semantic HTML validation, case study navigation, axe-core accessibility, JSON-LD presence                           |

## Interfaces / Contracts

```typescript
// types/sanity.ts — Project additions
interface Project {
  // ... existing fields unchanged ...
  shortDescription?: string; // NEW: plain text, ≤200 chars
  seoKeywords?: string[]; // NEW: string array
  category?: string; // NEW: project category
}

// lib/json-ld.ts — new export
interface BuildProjectListJsonLdParams {
  projects: Project[];
  locale: string;
}
function buildProjectListJsonLd(
  params: BuildProjectListJsonLdParams,
): ItemListJsonLd;

// components/ProjectsGrid.tsx
interface ProjectsGridProps {
  projects: Project[];
  locale: string;
}
// Returns: Promise<JSX.Element> (async RSC)
```

## Testing Strategy

| Layer       | What                            | Approach                                                                                                                       |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Unit        | `buildProjectListJsonLd` output | Pure function test: valid `ItemList` structure, `CreativeWork` entries, empty array edge case                                  |
| Unit        | `ProjectsGrid` SSR rendering    | `render()` with mock projects; assert `<article>`, `<h3>`, `shortDescription` fallback, `next/image` `alt`, `next/link` `href` |
| Unit        | `blockToPlainText` fallback     | Test when `shortDescription` is `undefined`, `null`, `""`, and populated                                                       |
| Integration | Sitemap includes project slugs  | Mock Sanity fetch; assert XML output includes all locale-project combinations                                                  |
| E2E         | Semantic HTML + axe-core        | Playwright + axe-core: zero violations on homepage, single `<main>`, single `<h1>`, proper heading hierarchy                   |
| E2E         | Case study navigation           | Click card → navigates to `/en/projects/[slug]`; back navigation works                                                         |
| E2E         | JSON-LD validation              | Assert `<script type="application/ld+json">` contains valid `ItemList`                                                         |
| E2E         | Keyboard navigation             | Tab through cards; `:focus-visible` visible on each; all reachable in DOM order                                                |

## Migration / Rollout

No data migration required. New Sanity fields (`shortDescription`, `seoKeywords`, `category`) are additive and optional. Existing projects run via `shortDescription ?? blockToPlainText(description)` fallback. Content editors populate new fields manually. Rollback: `git revert` — Sanity fields are non-destructive; Studio rebuild picks up current schema.

## Open Questions

None. All design decisions resolved per proposal and specs.
