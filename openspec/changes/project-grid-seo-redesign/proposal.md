# Proposal: Project Grid SEO Redesign

## Intent

The current project grid (`ProjectsOverview`) is a `"use client"` component using framer-motion for in-place expansion. It hides content from search engines, links to external URLs instead of existing case study pages at `/projects/[slug]`, and violates semantic HTML (duplicate `<main>`, headings inside buttons). Two dead components bloat the bundle. The Sanity schema lacks dedicated SEO fields. The sitemap is static and omits project pages. No JSON-LD `ItemList` exists for the project catalog. This change discards the entire current implementation and replaces it with a server-rendered, minimalist, SEO-excellent grid.

## Scope

### In Scope

- New `ProjectsGrid` async Server Component: CSS Grid cards as `<article>` elements with `<h3>` title, `<p>` shortDescription, `<a>` case study link, `next/image` thumbnails
- JSON-LD `ItemList` of `CreativeWork` on homepage
- Dynamic sitemap including all project slugs
- Remove dead code: `PortfolioGrid.tsx`, `ProjectFragment.tsx`, related tests/stories
- Remove `.grid-with-life` CSS animations from `globals.css`
- Fix duplicate `<main id="main-content">`: remove from `ObsidianStream.tsx`
- Sanity schema: add `shortDescription` (string, max 200), `seoKeywords` (string array), `category` (string)
- Extend TypeScript `Project` interface; update GROQ query
- Project page metadata: prefer `shortDescription` (fallback: `blockToPlainText`)
- i18n: add `projectsGrid.*` namespace; update en/es messages
- Unit tests: rewrite `ProjectsOverview.test.tsx` → `ProjectsGrid.test.tsx`
- E2E: remove in-place expansion spec, add case study navigation + SEO assertions

### Out of Scope

- Other sections (Hero, Experience, Skills, Certificates) — untouched
- Case study page layout redesign — already quality
- Sanity Studio UI changes — schema fields only
- Category filtering/sorting — deferred
- Auto-migrating PortableText `description` → `shortDescription` — manual content edit

## Capabilities

### New Capabilities

- **`project-grid-seo`**: Server-rendered semantic grid, JSON-LD ItemList, case study links, CSS-only design, dynamic sitemap, fixed heading hierarchy, no framer-motion
- **`sanity-project-seo-fields`**: New Sanity document fields (`shortDescription`, `seoKeywords`, `category`) with TypeScript types, GROQ query updates, and PortableText fallback

### Modified Capabilities

- **`portfolio-case-studies`**: Metadata generation extended to prefer `shortDescription`; dynamic sitemap includes all project slugs

## Approach

**Server Component Grid** (Approach 1 from exploration). Data fetched in `page.tsx` via existing `Promise.all` — zero waterfall. Cards are `<article>` elements with native semantics. CSS-only hover effects respecting `prefers-reduced-motion`. No framer-motion in grid. Links use `next/link` to `/projects/[slug]`. Sanity fields are additive; all existing projects continue working via `shortDescription ?? blockToPlainText(description)` fallback.

## Affected Areas

| Area                                        | Impact                              |
| ------------------------------------------- | ----------------------------------- |
| `components/ProjectsGrid.tsx`               | New (RSC)                           |
| `components/fragments/ProjectsOverview.tsx` | Removed                             |
| `components/PortfolioGrid.tsx`              | Removed (dead)                      |
| `components/fragments/ProjectFragment.tsx`  | Removed (dead)                      |
| `components/ObsidianStream.tsx`             | Fix duplicate `<main>`              |
| `app/[locale]/page.tsx`                     | Updated GROQ + wire grid + JSON-LD  |
| `app/[locale]/projects/[slug]/page.tsx`     | Metadata: prefer `shortDescription` |
| `app/sitemap.ts`                            | Dynamic: include project slugs      |
| `lib/json-ld.ts`                            | Add `ItemList` helper               |
| `types/sanity.ts`                           | Add SEO fields                      |
| `apps/studio/schemaTypes/project.ts`        | Add SEO fields                      |
| `globals.css`                               | Remove `.grid-with-life`            |
| `messages/en.json`, `messages/es.json`      | Add `projectsGrid.*`                |
| `e2e/grid-expansion.behavior.spec.ts`       | Removed                             |
| `e2e/project-grid-seo.spec.ts`              | New (case study nav + axe)          |
| Unit tests (3 files)                        | Removed/New                         |

## Risks

| Risk                                                                              | L   | Mitigation                                                                            |
| --------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------- |
| E2E breakage — in-place expansion tests removed, new behavior needs full coverage | H   | Rewrite E2E spec from scratch: semantic HTML, axe, keyboard nav, case study links     |
| Empty SEO fields on existing projects until editors populate                      | H   | `shortDescription ?? blockToPlainText(description)`; `seoKeywords ?? []`              |
| Design inconsistency — framer-motion removed from grid, other sections retain it  | M   | Keep dark theme tokens, MD3 surfaces, CSS transitions; other sections are independent |
| i18n key migration — old keys still referenced elsewhere                          | M   | Audit with ripgrep before removal; keep unused keys until confirmed zero refs         |
| Accessibility regression — focus, contrast                                        | M   | axe-core E2E assertions; verify MD3 contrast ratios in CI                             |
| Dynamic sitemap latency from Sanity fetch                                         | L   | `cache()` wrapper + ISR revalidation; `generateSitemaps` if needed                    |
| Bundle regression                                                                 | L   | RSC produces zero JS runtime for grid; verify with build size analysis                |

## Rollback Plan

1. `git revert` implementation commits
2. Restore `ProjectsOverview.tsx` from git (self-contained, no shared state)
3. Revert `globals.css` (restore `.grid-with-life`)
4. Revert `ObsidianStream.tsx` (restore `<main>` + old import)
5. Revert `sitemap.ts` to static version
6. Sanity fields are additive — no data loss on revert; Studio rebuild picks up current schema
7. Restore i18n keys from git
8. Revert E2E test files

## Dependencies

- Sanity Studio running for schema field verification
- Existing Sanity content for fallback logic testing
- Playwright + axe-core (already configured)

## Success Criteria

- [ ] Homepage project grid renders via SSR (cards visible in `curl` output without JS)
- [ ] Each card `<a>` links to `/projects/[slug]` (not externalLink)
- [ ] Single `<h1>` and single `<main id="main-content">` in DOM
- [ ] JSON-LD `ItemList` in homepage source; validates against Rich Results Test
- [ ] Dynamic sitemap includes all project slugs
- [ ] Lighthouse SEO ≥ 95 on homepage
- [ ] axe-core: zero violations on homepage + grid
- [ ] `npm test --workspace=apps/portfolio` passes all unit tests
- [ ] `npm run qa:e2e --workspace=apps/portfolio` passes all E2E tests
- [ ] `npm run typecheck` passes with no errors
- [ ] Dead code removed: `PortfolioGrid.tsx`, `ProjectFragment.tsx` + tests/stories
- [ ] `.grid-with-life` CSS and keyframes removed
- [ ] New Sanity fields visible in Studio; GROQ returns them
- [ ] `shortDescription` fallback works on existing projects with empty field
