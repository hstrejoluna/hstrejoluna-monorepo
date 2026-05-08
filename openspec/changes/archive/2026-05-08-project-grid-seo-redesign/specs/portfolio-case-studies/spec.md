# Specs for project-grid-seo-redesign — Domain: portfolio-case-studies (MODIFIED + ADDED)

## MODIFIED Requirements

### Requirement: Metadata Generation (was R3: Structured Data)

Each project page MUST generate `<meta name="description">` and OpenGraph descriptions using `shortDescription` when available, falling back to `blockToPlainText(description)`. The description SHALL be truncated to 160 characters if needed.
(Previously: metadata descriptions were extracted from Portable Text `description` field only)

**Scenario: shortDescription preferred**

- GIVEN a project with `shortDescription: "SEO-optimized overview of the project"`
- WHEN `generateMetadata()` executes
- THEN `<meta name="description">` SHALL contain `"SEO-optimized overview of the project"`
- AND OpenGraph `og:description` SHALL use the same value

**Scenario: PortableText fallback**

- GIVEN a project with empty `shortDescription` and populated `description` blocks
- WHEN `generateMetadata()` executes
- THEN the description SHALL be extracted via `blockToPlainText(description)`
- AND the output SHALL be truncated to 160 characters if longer

### Requirement: Sanity Schema Extension (was R4: Sanity Integration)

The `project` schema MUST include `shortDescription` (string, max 200), `seoKeywords` (string array), and `category` (string) in addition to existing `content`, `year`, `role`, and `gallery` fields. Images MUST continue to support hotspot and localized ALT text.
(Previously: schema required only `content`, `year`, `role`, `gallery`)

**Scenario: New fields coexist with existing**

- GIVEN the updated project schema
- WHEN a project document is fetched via GROQ
- THEN the response SHALL include both new SEO fields AND existing Portable Text fields
- AND existing project pages SHALL continue rendering without errors

## ADDED Requirements

### Requirement: Dynamic Sitemap Inclusion

The sitemap (`app/sitemap.ts`) MUST dynamically include all project case study URLs for every published project. This replaces the current static sitemap that omits project pages.

**Scenario: Project slugs in sitemap**

- GIVEN published projects with slugs `proj-a` and `proj-b`
- WHEN `GET /sitemap.xml` is requested
- THEN XML SHALL include `<url>` for `/en/projects/proj-a`, `/en/projects/proj-b`, and their `es` equivalents
- AND each URL SHALL include `<lastmod>` from Sanity `_updatedAt`
- AND URLs SHALL include `<xhtml:link rel="alternate" hreflang="...">` for locale alternates
