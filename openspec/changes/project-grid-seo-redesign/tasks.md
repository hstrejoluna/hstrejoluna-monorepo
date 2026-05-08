# Tasks: Project Grid SEO Redesign

## Review Workload Forecast

| Field                   | Value                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Estimated changed lines | ~860 (~375 added, ~485 deleted)                                                                        |
| 400-line budget risk    | High                                                                                                   |
| Chained PRs recommended | Yes                                                                                                    |
| Suggested split         | PR 1: Foundation + Component (~255 added). PR 2: Wiring + Sitemap + Cleanup (~120 added, ~485 deleted) |
| Effective review burden | ~475 lines (dead-code deletions are low cognitive)                                                     |
| Delivery strategy       | ask-on-risk                                                                                            |
| Chain strategy          | pending                                                                                                |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal                                                                                | Likely PR | Notes                                                                         |
| ---- | ----------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------- |
| 1    | Types, schema, i18n, JSON-LD, ProjectsGrid + unit tests                             | PR 1      | Self-contained: component exists, types build, tests pass. No wiring to page. |
| 2    | Wiring, sitemap, metadata, ObsidianStream fix, CSS removal, dead code deletion, E2E | PR 2      | Depends on PR 1 (grid component). All integration + cleanup in one pass.      |

## Phase 1: Foundation (Types, Schema, i18n, JSON-LD)

- [x] 1.1 Extend `Project` interface in `types/sanity.ts` with `shortDescription?: string`, `seoKeywords?: string[]`, `category?: string`
- [x] 1.2 Add `shortDescription` (string, max 200), `seoKeywords` (string array), `category` (string) to `apps/studio/schemaTypes/project.ts`
- [x] 1.3 Add `projectsGrid.viewCaseStudy` to `messages/en.json` and `messages/es.json`
- [x] 1.4 Write `buildProjectListJsonLd()` unit test in `lib/json-ld.test.ts`: valid `ItemList`, `CreativeWork` entries, empty array edge case
- [x] 1.5 Implement `buildProjectListJsonLd()` in `lib/json-ld.ts` (pure function: `{ projects, locale }` → `ItemList` JSON-LD)

## Phase 2: RED — Tests First

- [x] 2.1 Write `ProjectsGrid.test.tsx`: SSR renders `<article>` cards, `<h3>` titles, `<a href="/projects/[slug]">`, `shortDescription` fallback (`?? blockToPlainText`), sans-JS rendering, `next/image` `alt` text
- [x] 2.2 Write `e2e/project-grid-seo.spec.ts`: semantic HTML validation, single `<main>`, single `<h1>`, heading hierarchy, case study navigation, axe-core zero violations, JSON-LD `ItemList` presence, keyboard `:focus-visible`

## Phase 3: GREEN — Core Implementation

- [x] 3.1 Create `ProjectsGrid.tsx` async RSC: `<ul>` CSS Grid (1 col / 2 md / 3 lg), `<li>` → `<article>` cards with `<h3>`, `<p>`, `next/image`, `next/link` to `/projects/[slug]`, CSS-only hover transitions, `prefers-reduced-motion` respect
- [x] 3.2 Update GROQ query in `app/[locale]/page.tsx` to select `shortDescription`, `seoKeywords`, `category`; pass `projects` to `ProjectsGrid`; inject JSON-LD via `buildProjectListJsonLd`
- [x] 3.3 Update `generateMetadata()` in `app/[locale]/projects/[slug]/page.tsx`: prefer `shortDescription ?? blockToPlainText(description)`, truncate to 160 chars
- [x] 3.4 Update `app/sitemap.ts`: async Sanity fetch via `cache()` for all published project slugs; emit `/en/projects/[slug]` and `/es/projects/[slug]` with `<lastmod>` and `<xhtml:link>` alternates

## Phase 4: Integration

- [x] 4.1 Replace `ProjectsOverview` → `ProjectsGrid` in `ObsidianStream.tsx`; remove duplicate `<main id="main-content">` (keep only `layout.tsx` definition)
- [x] 4.2 Remove `.grid-with-life` CSS block, `grid-pulse` keyframe, `scanline` keyframe from `globals.css`

## Phase 5: Cleanup

- [x] 5.1 Delete dead code: `ProjectsOverview.tsx`, `PortfolioGrid.tsx`, `ProjectFragment.tsx` + their tests/stories (`ProjectsOverview.test.tsx`, `ProjectsOverview.stories.tsx`, `ProjectFragment.test.tsx`, `ProjectFragment.stories.tsx`)
- [x] 5.2 Delete `e2e/grid-expansion.behavior.spec.ts` (in-place expansion tests no longer applicable)
- [x] 5.3 Audit i18n keys: remove `portfolioGrid.{status,about,latestWork,exploreProject,caseStudy}` from `en.json` and `es.json` (only `activeNodes` still referenced in `ObsidianStream.tsx`)
- [x] 5.4 Verify: `npx tsc --noEmit` (0 errors), `npm test --workspace=apps/portfolio` (54 files, 402 tests pass), `npm run lint` (passes)
