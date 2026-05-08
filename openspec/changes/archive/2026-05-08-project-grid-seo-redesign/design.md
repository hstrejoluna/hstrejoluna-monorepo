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

| File                                                              | Action     | Description                                                                     |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| `apps/portfolio/components/ProjectsGrid.tsx`                      | **Create** | Async RSC: CSS Grid cards with `next/image`, `next/link`, i18n                  |
| `apps/portfolio/components/fragments/ProjectsOverview.tsx`        | **Delete** | Old client component with framer-motion expansion                               |
| `apps/portfolio/components/fragments/ProjectsOverview.test.tsx`   | **Delete** | Old unit tests                                                                  |
| `apps/portfolio/components/ProjectsGrid.test.tsx`                 | **Create** | Unit tests: SSR output, fallback descriptions, correct links, sans-JS rendering |
| `apps/portfolio/components/PortfolioGrid.tsx`                     | **Delete** | Dead code (unused client component)                                             |
| `apps/portfolio/components/fragments/ProjectFragment.tsx`         | **Delete** | Dead code                                                                       |
| `apps/portfolio/components/fragments/ProjectFragment.test.tsx`    | **Delete** | Dead code test                                                                  |
| `apps/portfolio/components/fragments/ProjectFragment.stories.tsx` | **Delete** | Dead code story                                                                 |
| `apps/portfolio/components/ObsidianStream.tsx`                    | **Modify** | Remove duplicate `<main>`; replace `ProjectsOverview` → `ProjectsGrid`          |
| `apps/portfolio/app/[locale]/page.tsx`                            | **Modify** | Add `buildProjectListJsonLd`; update GROQ; pass `projects`                      |
| `apps/portfolio/app/[locale]/projects/[slug]/page.tsx`            | **Modify** | Metadata: `shortDescription ?? blockToPlainText(description)`                   |
| `apps/portfolio/app/sitemap.ts`                                   | **Modify** | Async: fetch slugs, dynamic project URLs with alternates                        |
| `apps/portfolio/lib/json-ld.ts`                                   | **Modify** | Add `buildProjectListJsonLd()` pure function                                    |
| `apps/portfolio/types/sanity.ts`                                  | **Modify** | Add `shortDescription?`, `seoKeywords?`, `category?`                            |
| `apps/studio/schemaTypes/project.ts`                              | **Modify** | Add three new `defineField` entries                                             |
| `apps/portfolio/app/globals.css`                                  | **Modify** | Remove `.grid-with-life`, `grid-pulse`, `scanline`                              |
| `apps/portfolio/messages/en.json`                                 | **Modify** | Add `projectsGrid.viewCaseStudy`; remove orphaned `portfolioGrid` keys          |
| `apps/portfolio/messages/es.json`                                 | **Modify** | Add `projectsGrid.viewCaseStudy`; remove orphaned `portfolioGrid` keys          |
| `apps/portfolio/e2e/grid-expansion.behavior.spec.ts`              | **Delete** | In-place expansion tests no longer applicable                                   |
| `apps/portfolio/e2e/project-grid-seo.spec.ts`                     | **Create** | E2E: semantic HTML, case study nav, axe-core, JSON-LD                           |

## Testing Strategy

| Layer       | What                            | Approach                                                                           |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------- |
| Unit        | `buildProjectListJsonLd` output | Pure function test: valid `ItemList`, `CreativeWork` entries, empty array          |
| Unit        | `ProjectsGrid` SSR rendering    | `render()` with mock projects; assert `<article>`, `<h3>`, fallback, `alt`, `href` |
| Unit        | `blockToPlainText` fallback     | Test `undefined`, `null`, `""`, populated                                          |
| Integration | Sitemap includes project slugs  | Mock Sanity fetch; assert XML includes locale-project combos                       |
| E2E         | Semantic HTML + axe-core        | Playwright + axe-core: zero violations, single `<main>`, single `<h1>`             |
| E2E         | Case study navigation           | Click card → navigates to `/en/projects/[slug]`; back navigation                   |
| E2E         | JSON-LD validation              | Assert valid `ItemList` in `<script type="application/ld+json">`                   |
| E2E         | Keyboard navigation             | Tab through cards; `:focus-visible` visible; all reachable                         |

## Migration / Rollout

No data migration required. New Sanity fields are additive and optional. Existing projects run via `shortDescription ?? blockToPlainText(description)` fallback. Rollback: `git revert` — Sanity fields are non-destructive.
