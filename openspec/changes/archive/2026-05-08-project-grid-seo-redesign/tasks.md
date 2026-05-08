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
| Chain strategy          | chained (PR #69 → PR #70)                                                                              |

Decision needed before apply: Yes
Chained PRs recommended: Yes
400-line budget risk: High

### Work Units

| Unit | Goal                                                                                | PR  | Notes                                                         |
| ---- | ----------------------------------------------------------------------------------- | --- | ------------------------------------------------------------- |
| 1    | Types, schema, i18n, JSON-LD, ProjectsGrid + unit tests                             | #69 | Self-contained: component exists, types build, tests pass     |
| 2    | Wiring, sitemap, metadata, ObsidianStream fix, CSS removal, dead code deletion, E2E | #70 | Depends on PR #69 (grid component). All integration + cleanup |

## Phase 1: Foundation (Types, Schema, i18n, JSON-LD)

- [x] 1.1 Extend `Project` interface in `types/sanity.ts`
- [x] 1.2 Add SEO fields to `apps/studio/schemaTypes/project.ts`
- [x] 1.3 Add `projectsGrid.viewCaseStudy` i18n keys
- [x] 1.4 Write `buildProjectListJsonLd()` unit test (14 cases)
- [x] 1.5 Implement `buildProjectListJsonLd()` in `lib/json-ld.ts`

## Phase 2: RED — Tests First

- [x] 2.1 Write `ProjectsGrid.test.tsx` (14 tests)
- [x] 2.2 Write `e2e/project-grid-seo.spec.ts` (9 test cases)

## Phase 3: GREEN — Core Implementation

- [x] 3.1 Create `ProjectsGrid.tsx` async RSC
- [x] 3.2 Update GROQ query in `page.tsx`; inject JSON-LD
- [x] 3.3 Update `generateMetadata()` in project slug page
- [x] 3.4 Update `app/sitemap.ts` — dynamic project slugs

## Phase 4: Integration

- [x] 4.1 Replace `ProjectsOverview` → `ProjectsGrid` in `ObsidianStream.tsx`; fix duplicate `<main>`
- [x] 4.2 Remove `.grid-with-life` CSS

## Phase 5: Cleanup

- [x] 5.1 Delete dead code (7 files)
- [x] 5.2 Delete `e2e/grid-expansion.behavior.spec.ts`
- [x] 5.3 i18n audit — remove orphaned keys
- [x] 5.4 Verify: tsc 0 errors, 420 tests pass, lint passes

## Verify Fix Batch (Warnings #2, #3)

- [x] Fix W2: Write `generateMetadata()` unit tests (8 test cases)
- [x] Fix W3: Write `sitemap()` unit tests (10 test cases)

**Final status: 18/18 tasks COMPLETE**
