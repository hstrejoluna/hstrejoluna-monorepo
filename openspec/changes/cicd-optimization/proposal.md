# Proposal: CI/CD Pipeline Optimization — Turbo-ify, DRY, and Cache

## Intent

Transform the monorepo's CI/CD from sequential `npm run` scripts to Turborepo-orchestrated, cached, filtered pipelines. Current pipelines are slow (no remote cache, no affected-package filtering), duplicated (3 workflows copy-paste Next.js cache + node setup), and incomplete (turbo.json missing test/typecheck/qa tasks). Expected: 30-50% CI time reduction on partial changes.

## Scope

### In Scope

- Complete `turbo.json`: add `test`, `typecheck`, `qa:lighthouse`, `qa:bundle` with correct `dependsOn`/`outputs`; fix `lint` and `typecheck` missing `dependsOn`
- Migrate root `package.json` scripts from `npm run --workspace` chains to `turbo run --filter`
- Replace raw `npm run` calls in `ci.yml` with `turbo run lint typecheck build test`
- Fix Next.js cache key: remove `**/*.[jt]s` glob (near-100% miss rate)
- Create `.github/actions/setup-node-deps/action.yml` composite action (node setup + npm ci + cache)
- Refactor `qa-professional.yml` to use composite action; conditionally skip jobs via `--affected`
- Fix Lighthouse double-build by using turbo build cache instead of rebuilding
- Add Docker layer caching (`--cache-from type=gha`) in `cd-cloudrun.yml`
- Refactor `cd-cloudrun.yml` deploy jobs to matrix strategy (eliminate ~80% duplication)
- Cache develop-branch check in `pr-governance.yml`

### Out of Scope

- PR #76 TS2307 import errors (code bug, not CI)
- PR #77 WebGL `networkidle` timeout (code bug, not CI)
- PR #73 Lighthouse score below threshold (code perf, not CI)
- Turborepo remote cache enrollment (decision needed: Vercel vs Artifacts API)
- Playwright webServer migration to turbo (blocked on remote cache)
- Next.js 16 middleware deprecation warning (`"middleware"` → `"proxy"`)

## Capabilities

### New Capabilities

- `turbo-pipeline-orchestration`: Turborepo task graph, caching, filtering, and remote cache integration for all CI/CD pipelines
- `ci-shared-actions`: Reusable composite actions for node dependency setup, caching, and common workflow steps

### Modified Capabilities

- `gcp-cloudrun-cd-pipeline`: deploy jobs refactored to matrix strategy with Docker layer caching; no spec-level behavior change
- `lighthouse-ci-gate`: CI orchestration switches from `npm run build` to turbo-cached build; thresholds unchanged
- `e2e-testing-resilience`: CI setup uses composite action; Playwright webServer unchanged until remote cache

## Approach

**Phase 1 — Foundation** (low risk, quick wins):
Complete turbo.json task graph. Fix root package.json scripts. Fix Next.js cache key. Create composite action.

**Phase 2 — Turbo-ify CI** (high impact):
Replace `npm run` with `turbo run --filter` in ci.yml and qa-professional.yml. Wire Lighthouse to reuse turbo cached build. Enable remote cache (requires separate decision).

**Phase 3 — CD Refactoring**:
Matrix strategy for cd-cloudrun.yml deploy jobs. Docker `--cache-from type=gha`. Cache pr-governance develop check.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `turbo.json` | Modified | Add test, typecheck, qa:lighthouse, qa:bundle; fix lint/typecheck dependsOn |
| `package.json` (root) | Modified | Replace npm workspace chains with turbo run --filter |
| `.github/workflows/ci.yml` | Modified | Turbo run commands, composite action, cache key fix |
| `.github/workflows/qa-professional.yml` | Modified | Composite action, turbo commands, conditional --affected |
| `.github/workflows/cd-cloudrun.yml` | Modified | Matrix strategy, Docker layer caching, turbo build --filter |
| `.github/workflows/pr-governance.yml` | Modified | Cache develop branch existence check |
| `.github/actions/setup-node-deps/` | New | Composite action for node+cache setup |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Missing turbo.json tasks surface hidden dep issues | Med | Phase 1 validates task graph with dry runs before CI switch |
| Remote cache requires Vercel account decision | High | Phase 2 works without remote cache; local cache still helps |
| Playwright webServer still runs `npm run build` | Low | Documented as follow-up; not blocking |
| Matrix deploy refactor breaks env var scoping | Med | Test with `act` locally; deploy to staging first |

## Rollback Plan

All changes are workflow/config files — revert commits restore previous state. Phase 1 is additive (turbo.json entries + composite action don't break existing scripts). Each phase can be rolled back independently.

## Dependencies

- Turborepo already installed as devDependency (`"turbo": "latest"` in root package.json)
- Remote cache decision (Vercel vs GitHub Actions cache) needed before Phase 2 completion
- Docker buildx required for `--cache-from type=gha` (available on `ubuntu-latest`)

## Success Criteria

- [ ] `turbo run lint typecheck build test` completes locally without errors
- [ ] CI quality job uses `turbo run` instead of `npm run` for all tasks
- [ ] Next.js cache hit rate > 50% on PRs that don't touch source (currently ~0%)
- [ ] cd-cloudrun.yml deploy jobs use matrix strategy (single job template)
- [ ] No duplicated setup steps across ci.yml, qa-professional.yml, cd-cloudrun.yml
- [ ] CI wall-clock time reduced ≥ 20% on partial-changes PRs (baseline: current average)