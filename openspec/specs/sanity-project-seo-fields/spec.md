# Spec: Sanity Project SEO Fields

## Purpose

Add dedicated SEO fields to the Sanity `project` document schema with TypeScript types, GROQ query updates, and PortableText fallback logic.

## Requirements

### Requirement: New Schema Fields

The `project` schema MUST include `shortDescription` (string, max 200 chars), `seoKeywords` (array of strings), and `category` (string). Existing `description` (Portable Text) SHALL remain unchanged.

#### Scenario: Fields visible in Studio

- GIVEN the Sanity Studio loads
- WHEN editing a project document
- THEN `shortDescription`, `seoKeywords`, and `category` fields SHALL be visible
- AND `shortDescription` SHALL enforce max 200 characters

#### Scenario: Existing projects without fields

- GIVEN a project with empty/null `shortDescription`
- WHEN the application reads the field
- THEN `shortDescription ?? blockToPlainText(description)` SHALL provide a readable fallback
- AND the application SHALL NOT crash on missing values

### Requirement: TypeScript Type Extension

The `Project` interface in `types/sanity.ts` MUST include `shortDescription`, `seoKeywords`, and `category` as optional fields. `npm run typecheck` SHALL pass with zero errors.

#### Scenario: Types compile

- GIVEN the updated `Project` interface
- WHEN `npm run typecheck` executes
- THEN zero type errors SHALL be reported
- AND `project.shortDescription ?? fallback` SHALL be valid TypeScript

### Requirement: GROQ Query Update

The homepage project GROQ query MUST select `shortDescription`, `seoKeywords`, and `category` fields.

#### Scenario: Query returns SEO fields

- GIVEN a Sanity project with `shortDescription: "A React dashboard"`
- WHEN the homepage GROQ query executes
- THEN the result SHALL include `{ shortDescription: "A React dashboard", seoKeywords: [...], category: "..." }`

## Architecture Decisions

- **Additive Schema Changes**: New fields are optional and non-destructive; existing projects continue working via PortableText fallback.
- **TypeScript Safety**: All new fields are optional (`?`); nullish coalescing (`??`) provides safe fallbacks throughout the codebase.
- **Explicit GROQ Fields**: Fields are listed explicitly in the query for documentation and type-safety, even though `...` spread would capture them.
