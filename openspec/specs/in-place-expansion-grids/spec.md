# In-Place Expansion Grids Specification

## Purpose

Defines the requirements for rendering categorized content (Experience, Skills) in responsive grids that can dynamically expand selected rows to reveal highly detailed nested interfaces without triggering a new URL or overlay modal.

> **Note (2026-05-08)**: The Projects grid has been superseded by `project-grid-seo` (Server Component, semantic HTML, case study links). This spec now applies only to Experience and Skills sections.

## Requirements

### Requirement: Optimized Animation and DOM Structure

The system MUST utilize efficient animation strategies (e.g., `LazyMotion`, CSS transitions) and minimize the use of heavy, nested DOM elements for layout and visual effects to ensure high performance and smooth browser scrolling.

#### Scenario: Rendering overview items

- GIVEN an overview grid (Experience or Skills) is rendered
- WHEN the user scrolls through the grid or hovers over items
- THEN the browser MUST maintain a steady 60fps frame rate
- AND visual effects (like glitch or noise) MUST be handled via lightweight CSS or optimized SVG backgrounds instead of heavy React element trees.

### Requirement: Responsive Grid Construction

The system MUST lay out content nodes in a CSS grid structure varying from 1 to 3 columns depending on device breakpoint viewport size.

#### Scenario: Mobile grid scaling

- GIVEN a mobile viewport (`< 768px`)
- WHEN an overview grid (Experience or Skills) is rendered
- THEN it MUST present 1 unified column of items

#### Scenario: Desktop grid scaling

- GIVEN a desktop viewport (`>= 1024px`)
- WHEN an overview grid (Experience or Skills) is rendered
- THEN it MUST present 3 unified columns of items

### Requirement: In-Place Expansion Unrolling

The system MUST expand the detail view directly underneath the clicked target, temporarily displacing subsequent siblings without overlapping, utilizing optimized reflow animations.
(Previously: The system MUST expand the detail view directly underneath the clicked target, temporarily displacing subsequent siblings without overlapping.)

#### Scenario: Selection expansion

- GIVEN a grid of items
- WHEN a user clicks on an unexpanded item "A"
- THEN item "A" MUST set its state to expanded, revealing a sub-panel
- AND the sub-panel MUST push the bounding grid layout organically downwards
- AND the container MUST transition its height gracefully using an optimized animation framework (`LazyMotion` or pure CSS).

### Requirement: Singular Expansion Mode

The system SHOULD automatically collapse previously expanded items within the same category to maintain scroll sanity when a new item is selected.

#### Scenario: Selecting consecutive items

- GIVEN item "A" is currently expanded
- WHEN a user clicks on item "B" in the same exact grid
- THEN item "A" MUST unconditionally collapse back to an atomic overview state
- AND item "B" MUST subsequently expand its detail view
