# Coding Standards & Guidelines

This project uses **Gentleman Guardian Angel** to ensure high code quality and consistency. All contributions must adhere to these standards.

## General Principles

- **Clean Code:** Prioritize readability and simplicity.
- **Type Safety:** Use TypeScript for all JavaScript projects. Avoid `any`.
- **DRY (Don't Repeat Yourself):** Extract common logic into reusable functions or components.
- **KISS (Keep It Simple, Stupid):** Avoid over-engineering.

## Style Guidelines

- **Naming:** Use camelCase for variables/functions and PascalCase for components/classes.
- **Formatting:** Adhere to Prettier/ESLint rules if configured.
- **Comments:** Write self-documenting code; use comments only for complex logic.

## Mandatory Rules (NEVER skip these)

### Rule 1: Documentation-First (Context7 before code)

- **NEVER** write code involving a library, framework, or API without consulting docs first.
- Before touching any dependency (React, Next.js, framer-motion, next-intl, Sanity, Tailwind, etc.), call `context7_resolve-library-id` + `context7_query-docs`.
- Memory is not documentation. Always verify against the latest version.

## AI Agent Behavior

- **Be Concise:** Provide brief, actionable feedback.
- **Be Constructive:** Explain the "why" behind suggested changes.
- **Check for Performance:** Flag inefficient loops or memory-intensive operations.
- **GitHub MCP First:** Use GitHub MCP tools as the primary interface for issues/PR/workflow operations.

## Installed Skills & Tools

| Skill/Tool       | Description                                         | Trigger/Usage                                   |
| ---------------- | --------------------------------------------------- | ----------------------------------------------- |
| `upstash-docs`   | Fresh documentation via Context7                    | Asking for library docs or troubleshooting APIs |
| `github-mcp`     | GitHub API integration                              | Managing issues, PRs, and repository search     |
| `branch-pr`      | PR creation workflow                                | When preparing a pull request                   |
| `issue-creation` | Issue creation workflow                             | When reporting bugs or requesting features      |
| `judgment-day`   | Adversarial code review                             | When a deep review is needed                    |
| `skill-creator`  | Create new AI skills                                | When a new pattern needs documenting            |
| `task-git-sync`  | Enforces automated Git workflow (add, commit, push) | Generating plans or finishing feature tasks     |

## Project Strategies

| Strategy                                   | Location                                      | Scope                                                   |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------- |
| **Semantic & SEO Master Plan**             | `docs/strategies/semantic-seo.md`             | Landmarking, JSON-LD, Metadata API, A11y standards      |
| **Gitflow + SemVer + GitHub MCP Standard** | `docs/standards/gitflow-semver-github-mcp.md` | Branching, versioning, MCP usage |
