# Spec: Portfolio Case Studies (Individual Project Pages)

## Overview

Individual, SEO-optimized pages for each project in the portfolio, allowing for detailed technical case studies and better semantic structure.

## Requirements

### R1: Dynamic Internal Routing

- Projects MUST be reachable via `/[locale]/projects/[slug]`.
- Routes MUST be statically generated at build time using `generateStaticParams`.
- Params in Next.js 16 MUST be handled as Promises.

### R2: Semantic Navigation & Breadcrumbs

- Pages MUST include a semantic breadcrumb navigation (`Home > Projects > [Title]`).
- Breadcrumbs MUST include JSON-LD `BreadcrumbList` for search engines.

### R3: Metadata Generation (SEO)

Each project page MUST generate `<meta name="description">` and OpenGraph descriptions using `shortDescription` when available, falling back to `blockToPlainText(description)`. The description SHALL be truncated to 160 characters if needed. JSON-LD structured data (`SoftwareSourceCode`, `CreativeWork`) MUST be injected per page. Metadata MUST be localized using `next-intl`.

#### Scenario: shortDescription preferred

- GIVEN a project with `shortDescription: "SEO-optimized overview of the project"`
- WHEN `generateMetadata()` executes
- THEN `<meta name="description">` SHALL contain `"SEO-optimized overview of the project"`
- AND OpenGraph `og:description` SHALL use the same value

#### Scenario: PortableText fallback

- GIVEN a project with empty `shortDescription` and populated `description` blocks
- WHEN `generateMetadata()` executes
- THEN the description SHALL be extracted via `blockToPlainText(description)`
- AND the output SHALL be truncated to 160 characters if longer

### R4: Sanity Schema Extension

The `project` schema MUST include `content` (Portable Text), `year`, `role`, `gallery`, `shortDescription` (string, max 200), `seoKeywords` (string array), and `category` (string). Images MUST support hotspot support and localized ALT text.

#### Scenario: New fields coexist with existing

- GIVEN the updated project schema
- WHEN a project document is fetched via GROQ
- THEN the response SHALL include both new SEO fields AND existing Portable Text fields
- AND existing project pages SHALL continue rendering without errors

### R5: Dynamic Sitemap Inclusion

The sitemap (`app/sitemap.ts`) MUST dynamically include all project case study URLs for every published project. This replaces the previous static sitemap that omitted project pages.

#### Scenario: Project slugs in sitemap

- GIVEN published projects with slugs `proj-a` and `proj-b`
- WHEN `GET /sitemap.xml` is requested
- THEN XML SHALL include `<url>` for `/en/projects/proj-a`, `/en/projects/proj-b`, and their `es` equivalents
- AND each URL SHALL include `<lastmod>` from Sanity `_updatedAt`
- AND URLs SHALL include `<xhtml:link rel="alternate" hreflang="...">` for locale alternates

## Architecture Decisions

- **SSG by Default**: All project pages are pre-rendered for maximum performance.
- **Hybrid Link Logic**: `getProjectUrl` prioritizes internal slugs but falls back to microsites or external links if a slug is missing.
- **Shared Components**: Uses `TelemetryHUD` from `@hstrejoluna/ui` for technical metadata consistency.
- **SEO Metadata Strategy**: `shortDescription` provides editor-curated SEO text; PortableText `description` serves as automatic fallback. Truncation at 160 chars ensures compliance with search engine display limits.
