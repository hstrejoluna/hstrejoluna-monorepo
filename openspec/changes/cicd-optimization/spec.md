# Spec: CI/CD Pipeline Optimization — Turbo-ify, DRY, and Cache

**Change**: `cicd-optimization`
**Artifact store**: hybrid (openspec + engram)

---

## turbo-pipeline-orchestration (NEW)

### Requirement: Complete Task Graph

`turbo.json` SHALL define tasks `test`, `typecheck`, `qa:lighthouse`, and `qa:bundle` with correct `dependsOn` and `outputs`. `test` and `qa:*` tasks MUST depend on `^build`. `qa:lighthouse` outputs SHALL include `.lighthouseci/**`. `qa:bundle` outputs SHALL be empty (assertion-only).

- **Phase**: 1
- **Priority**: High

#### Scenario: All pipeline tasks discoverable by turbo

- GIVEN turbo.json includes test, typecheck, qa:lighthouse, qa:bundle
- WHEN `turbo run lint typecheck build test` executes
- THEN all tasks resolve and run in dependency order

#### Scenario: QA tasks wait for dependency builds

- GIVEN a workspace with qa:lighthouse or qa:bundle scripts
- WHEN turbo invokes those tasks
- THEN `^build` dependencies for that workspace MUST complete first

### Requirement: Dependency Chain for lint and typecheck

`lint` and `typecheck` tasks in turbo.json MUST declare `dependsOn: ["^build"]` so type information and compiled outputs exist before linting or type-checking runs.

- **Phase**: 1
- **Priority**: High

#### Scenario: Lint and typecheck wait for dependency builds

- GIVEN a workspace that imports types from a dependency workspace
- WHEN `turbo run lint typecheck build` executes
- THEN lint and typecheck MUST run after `^build` for depended-upon workspaces

### Requirement: Root Script Delegation to Turbo

Root `package.json` scripts for `build`, `lint`, `typecheck`, and `test` MUST delegate to `turbo run` with `--filter` instead of sequential `npm run --workspace` chains. The `dev` script already uses turbo and SHALL remain unchanged.

- **Phase**: 1
- **Priority**: High

#### Scenario: Root scripts invoke turbo orchestrator

- GIVEN root package.json with turbo-powered scripts
- WHEN developer runs `npm run build` or `npm run lint`
- THEN turbo orchestrates execution across filtered workspaces

#### Scenario: Filter flag honors workspace targeting

- GIVEN `turbo run build --filter=apps/portfolio`
- WHEN executed
- THEN only portfolio and its workspace dependencies build

### Requirement: Fix Next.js Cache Key

CI Next.js cache key MUST use only the `package-lock.json` hash. The `**/*.[jt]s` and `**/*.[jt]sx` globs MUST be removed from cache keys in all workflows.

- **Phase**: 1
- **Priority**: High

#### Scenario: Cache hits on non-source changes

- GIVEN a PR that modifies only markdown or CSS files
- WHEN CI restores the Next.js cache
- THEN the cache MUST hit from a prior run matching the same package-lock.json

#### Scenario: Cache invalidation on dependency change

- GIVEN a PR that modifies package-lock.json
- WHEN CI restores the Next.js cache
- THEN cache MUST miss and a fresh restore-plus-rebuild occurs

### Requirement: Turbo-ify CI Quality Pipeline

ci.yml quality job MUST use `turbo run lint typecheck build test` with `--filter` for affected-package detection. Raw `npm run` calls for these tasks SHALL be replaced entirely.

- **Phase**: 2
- **Priority**: High

#### Scenario: CI uses turbo for quality checks

- GIVEN ci.yml quality job
- WHEN CI executes
- THEN all quality tasks run through turbo, not raw npm scripts

#### Scenario: Affected-package filtering in CI

- GIVEN a PR that touches only apps/portfolio
- WHEN `turbo run lint typecheck build test --filter=apps/portfolio...` runs
- THEN only portfolio and its dependencies execute; unchanged workspaces skip

### Requirement: Remote Cache Integration

CI workflows MUST support `TURBO_TOKEN` and `TURBO_TEAM` repository secrets for Turborepo remote cache. When these secrets are absent, turbo MUST fall back to local cache without errors.

- **Phase**: 2
- **Priority**: Medium

#### Scenario: Remote cache configured

- GIVEN TURBO_TOKEN and TURBO_TEAM secrets configured in GitHub
- WHEN CI runs
- THEN turbo pushes and pulls cache artifacts from the remote store

#### Scenario: Remote cache not configured

- GIVEN no TURBO_TOKEN or TURBO_TEAM secrets
- WHEN CI runs
- THEN turbo falls back to local filesystem cache and completes successfully

---

## ci-shared-actions (NEW)

### Requirement: Composite Action for Node Dependency Setup

`.github/actions/setup-node-deps/action.yml` MUST composite: Node 22 setup (actions/setup-node@v4 with npm cache), `npm ci`, and Next.js cache restore (actions/cache@v4 using package-lock.json hash key only). The cache key MUST NOT include source file globs.

- **Phase**: 1
- **Priority**: High

#### Scenario: Setup in single reusable step

- GIVEN a workflow referencing `uses: .github/actions/setup-node-deps`
- WHEN the step executes
- THEN Node 22 installs, npm ci completes, and .next/cache is restored

### Requirement: Deduplicate Workflow Setup

ci.yml, qa-professional.yml, and cd-cloudrun.yml MUST consume `.github/actions/setup-node-deps` for shared setup, eliminating duplicated checkout+node+install+cache step blocks across all three workflows.

- **Phase**: 2
- **Priority**: High

#### Scenario: No duplicated setup across workflows

- GIVEN all three workflow files
- WHEN compared for Node/npm/cache setup steps
- THEN each workflow references the composite action once; no inline duplicated setup remains

### Requirement: Cache Develop Branch Check in PR Governance

`pr-governance.yml` MUST cache the result of the `gh api` call checking if the `develop` branch exists. On cache hit, the step MUST skip the API call and use the cached result.

- **Phase**: 3
- **Priority**: Low

#### Scenario: Develop branch check uses cache

- GIVEN a recent CI run that confirmed the develop branch exists
- WHEN pr-governance runs on a subsequent PR
- THEN the develop branch check uses the cached result instead of an API call

---

## gcp-cloudrun-cd-pipeline (MODIFIED — ADDED Requirements)

### Requirement: Matrix Deploy Strategy

cd-cloudrun.yml deploy jobs MUST use a matrix strategy with `matrix.app` entries for `portfolio` and `maestros-del-salmon`. A single job template SHALL parameterize `SERVICE_NAME`, `IMAGE_NAME`, `SMOKE_PATH`, and app-specific env vars per matrix entry. Behavior MUST remain identical to current separate jobs.

- **Phase**: 3
- **Priority**: Medium

#### Scenario: Matrix deploy produces identical deployments

- GIVEN cd-cloudrun.yml with matrix.app = [portfolio, maestros-del-salmon]
- WHEN the matrix strategy runs both entries
- THEN portfolio and maestros-del-salmon deploy with the same configuration as the current separate jobs

#### Scenario: App-specific env vars scope correctly

- GIVEN matrix.app = portfolio
- WHEN the deploy step executes
- THEN portfolio-specific secrets and env vars (e.g., SALMON_ORIGIN, SANITY_API_READ_TOKEN) are injected; salmon-specific vars are not

### Requirement: Docker Layer Caching

Docker build steps in cd-cloudrun.yml MUST use Docker Buildx with `--cache-from type=gha` and `--cache-to type=gha` for cross-build layer caching via GitHub Actions cache.

- **Phase**: 3
- **Priority**: Medium

#### Scenario: Cached layers reduce build time

- GIVEN a prior successful push to the same branch
- WHEN Docker buildx runs with --cache-from type=gha
- THEN unchanged layers MUST be pulled from cache, reducing build wall-clock time

### Requirement: Turbo Build in Docker

Docker build steps MUST invoke `turbo run build --filter=<app>` instead of raw `npm run build` within the build stage to leverage turbo's task hashing and caching.

- **Phase**: 3
- **Priority**: Low

#### Scenario: Turbo-cached build inside Docker

- GIVEN a Dockerfile that uses turbo run build --filter
- WHEN the Docker build stage executes
- THEN turbo cache avoids redundant compilation if inputs match a prior build

---

## lighthouse-ci-gate (MODIFIED — ADDED Requirements)

### Requirement: Turbo-Orchestrated Lighthouse CI

`qa-professional.yml` Lighthouse job MUST use `turbo run qa:lighthouse --filter=<app>` instead of `npm run qa:lighthouse --workspace=...`.

- **Phase**: 2
- **Priority**: High

#### Scenario: Lighthouse uses turbo orchestration

- GIVEN qa-professional.yml lighthouse-bundle job
- WHEN Lighthouse CI runs
- THEN turbo orchestrates the task; no raw npm run qa:lighthouse call exists in the workflow

### Requirement: Reuse Turbo Build Cache for Lighthouse

The `qa:lighthouse` task MUST declare `dependsOn: ["^build"]` so turbo provides the cached build artifact. The Lighthouse job MUST NOT rebuild the Next.js app separately; it SHALL reuse the turbo-cached build output.

- **Phase**: 2
- **Priority**: High

#### Scenario: No double build for Lighthouse

- GIVEN a CI run where build completed (or is cached)
- WHEN qa:lighthouse executes
- THEN Lighthouse reuses the cached build output; no second `npm run build` or `next build` runs

### Requirement: Conditional QA Jobs on Affected Packages

`qa-professional.yml` MUST conditionally skip E2E and Lighthouse jobs when `--filter` analysis determines no relevant packages changed. Jobs SHALL still run on `workflow_dispatch` triggers regardless of affected scope.

- **Phase**: 2
- **Priority**: Medium

#### Scenario: Skip QA on docs-only changes

- GIVEN a PR that only modifies .md files
- WHEN --affected analysis determines no app packages changed
- THEN E2E and Lighthouse jobs are skipped

#### Scenario: Force run on workflow_dispatch

- GIVEN a manual workflow_dispatch trigger
- WHEN --affected analysis runs
- THEN jobs execute regardless of affected scope

---

## e2e-testing-resilience (MODIFIED — ADDED Requirements)

### Requirement: Composite Action for E2E Setup

`qa-professional.yml` E2E jobs MUST use `.github/actions/setup-node-deps` for shared Node/npm/cache setup, replacing duplicated checkout+node+install+cache blocks.

- **Phase**: 2
- **Priority**: High

#### Scenario: E2E uses composite action for setup

- GIVEN qa-professional.yml E2E job
- WHEN the job's setup steps execute
- THEN the composite action handles Node 22, npm ci, and cache in one step; no inline duplication of those three operations remains

---

## Out of Scope (Documented Follow-ups)

| Item | Reason | Dependency |
|------|--------|-------------|
| Playwright webServer turbo migration | Blocked on remote cache | Requires TURBO_TOKEN/TURBO_TEAM |
| Turborepo remote cache vendor decision | Requires org-level account decision | Vercel vs GitHub Artifacts API |
| PR #76 TS2307 import errors | Code bug, not CI | Separate fix PR |
| PR #77 WebGL networkidle timeout | Code bug, not CI | Separate fix PR |
| PR #73 Lighthouse score below threshold | Code performance, not CI | Separate optimization |