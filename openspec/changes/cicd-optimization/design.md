# Design: CI/CD Pipeline Optimization — Turbo-ify, DRY, and Cache

## Technical Approach

Replace sequential `npm run` scripts with Turborepo-orchestrated pipelines across all CI/CD workflows. Extract duplicated Node/npm/cache setup into a composite action. Fix Next.js cache key. Matrix-ize CD deploy jobs. Add Docker layer caching. Each phase is additive and independently rollbackable.

## Architecture Decisions

### Decision: Turbo task graph includes QA tasks

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add `qa:lighthouse`/`qa:bundle` to turbo.json | Enables turbo caching for QA; `qa:lighthouse` depends on build | ✅ Chosen |
| Keep QA scripts as raw npm workspace calls | Simpler but no caching/filtering for QA | Rejected — spec requires turbo orchestration |

**Rationale**: Spec TPO-01 requires all pipeline tasks discoverable by turbo. `qa:lighthouse` MUST declare `dependsOn: ["^build"]` so turbo provides cached build output (LH-02).

### Decision: Composite action over reusable workflow

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `.github/actions/setup-node-deps/action.yml` (composite) | Simpler, no job boundary, runs in same context | ✅ Chosen |
| `.github/workflows/_setup.yml` (reusable workflow) | Job boundary means separate runner; can't share Next.js cache across jobs | Rejected |

**Rationale**: Composite actions run in the same job context — critical for sharing the Next.js cache and turbo cache between setup and build steps.

### Decision: Cache key uses only `package-lock.json` hash

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `${{ hashFiles('**/package-lock.json') }}` only | High hit rate; rebuilds only on dep changes | ✅ Chosen |
| Current `package-lock.json + **/*.[jt]s[x]` | Near 100% miss rate (source globs change every PR) | Rejected |

**Rationale**: Next.js cache stores compiled output. If deps haven't changed, the cache is valid. Source file changes are handled by `next build` incrementally — not by cache key invalidation.

### Decision: Matrix deploy for cd-cloudrun.yml

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `matrix.app` with app-specific env via `${{ matrix.* }}` | Eliminates ~80% duplication; env vars from matrix include | ✅ Chosen |
| Template + YAML anchors | Not supported by GitHub Actions | Rejected |
| Keep two jobs | Current state; high duplication | Rejected |

**Rationale**: Spec GCP-01 requires behavior-identical deployments from a single template. Matrix vars control SERVICE_NAME, IMAGE_NAME, SMOKE_PATH, and app-specific secrets.

### Decision: Lighthouse uses turbo-cached build, no rebuild

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `turbo run qa:lighthouse --filter=portfolio` with `dependsOn: ["^build"]` | Turbo restores cached `.next`; no second build | ✅ Chosen |
| Keep separate `npm run build` step before `lhci autorun` | Double build wastes 2-3 min | Rejected |

**Rationale**: The current `qa:lighthouse` app script runs `npm run build && lhci autorun`. With turbo, the build is cached from the CI quality job. The app script must be refactored to separate build from LHCI so turbo's cached build satisfies the dependency without re-running `next build`.

## Data Flow

```
PR event
  ├── ci.yml quality job
  │     ├── uses: .github/actions/setup-node-deps
  │     └── turbo run lint typecheck build test --filter=...
  │
  ├── qa-professional.yml
  │     ├── e2e job ─ uses composite action + Playwright
  │     └── lighthouse-bundle job
  │           ├── uses: .github/actions/setup-node-deps
  │           └── turbo run qa:lighthouse qa:bundle --filter=...
  │                 └── dependsOn: ["^build"] → reuses cached .next
  │
  └── pr-governance.yml
        └── gh api develop check → cached via actions/cache
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `turbo.json` | Modify | Add `test`, `typecheck`, `qa:lighthouse`, `qa:bundle`; fix `lint`/`typecheck` dependsOn |
| `package.json` (root) | Modify | Replace npm workspace chains with `turbo run --filter` |
| `apps/portfolio/package.json` | Modify | Split `qa:lighthouse` into separate build+lhci scripts |
| `.github/actions/setup-node-deps/action.yml` | Create | Composite: Node 22 setup, npm ci, Next.js cache |
| `.github/workflows/ci.yml` | Modify | Composite action, turbo commands, cache key fix |
| `.github/workflows/qa-professional.yml` | Modify | Composite action, turbo commands, `--filter` affected detection |
| `.github/workflows/cd-cloudrun.yml` | Modify | Matrix strategy, Docker buildx caching |
| `.github/workflows/pr-governance.yml` | Modify | Cache develop branch check result |
| `apps/portfolio/Dockerfile` | Modify | Use `turbo run build --filter=portfolio` instead of `npm run build` |
| `apps/maestros-del-salmon/Dockerfile` | Modify | Use `turbo run build --filter=maestros-del-salmon` |

## Interfaces / Contracts

### turbo.json (complete new version)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "qa:lighthouse": {
      "dependsOn": ["^build"],
      "outputs": [".lighthouseci/**"]
    },
    "qa:bundle": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": { "cache": false, "persistent": true },
    "storybook": { "cache": false, "persistent": true },
    "storybook:build": {
      "dependsOn": ["^storybook:build"],
      "outputs": ["storybook-static/**"]
    }
  }
}
```

### Composite action inputs

```yaml
# .github/actions/setup-node-deps/action.yml
inputs:
  node-version:
    description: 'Node.js version'
    default: '22'
  nextjs-cache:
    description: 'Whether to restore Next.js cache'
    default: 'true'
```

Steps: checkout → setup-node (npm cache) → `npm ci` → conditionally restore `.next/cache` via `actions/cache@v4` with key `${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}`.

### Root package.json scripts (diff)

```
- "build": "npm run build --workspace=apps/portfolio && npm run build --workspace=apps/maestros-del-salmon"
+ "build": "turbo run build --filter=./apps/*"

- "lint": "npm run lint --workspace=apps/portfolio && npm run lint --workspace=apps/maestros-del-salmon"
+ "lint": "turbo run lint --filter=./apps/*"

- "typecheck": "npx tsc -p apps/portfolio/tsconfig.json --noEmit && npx tsc -p apps/maestros-del-salmon/tsconfig.json --noEmit"
+ "typecheck": "turbo run typecheck --filter=./apps/*"

- "test": "npm run test --workspace=apps/portfolio"
+ "test": "turbo run test --filter=./apps/*"
```

### Portfolio qa:lighthouse script split

```
- "qa:lighthouse": "NEXT_PUBLIC_BASE_URL=http://127.0.0.1:4173 npm run build && lhci autorun --config=./lighthouserc.cjs"
+ "qa:lighthouse": "lhci autorun --config=./lighthouserc.cjs"
```

Build is now a turbo dependency (`dependsOn: ["^build"]`), not an inline script. LHCI uses the build output that turbo already computed/cached.

### Matrix deploy config

```yaml
strategy:
  matrix:
    app:
      - name: portfolio
        service: ${{ vars.CLOUD_RUN_SERVICE_PORTFOLIO || 'portfolio' }}
        image: portfolio
        smoke_path: ${{ vars.CLOUD_RUN_SMOKE_PATH_PORTFOLIO || '/' }}
        sanity_secret: ${{ vars.CLOUD_RUN_SECRET_SANITY_API_READ_TOKEN || 'portfolio-sanity-api-read-token' }}
        env_vars: "SALMON_ORIGIN=${{ vars.SALMON_ORIGIN || '' }}"
        secrets: "SANITY_API_READ_TOKEN=${{ matrix.app.sanity_secret }}:latest"
      - name: maestros-del-salmon
        service: ${{ vars.CLOUD_RUN_SERVICE_SALMON || 'maestros-del-salmon' }}
        image: maestros-del-salmon
        smoke_path: ${{ vars.CLOUD_RUN_SMOKE_PATH_SALMON || '/maestros-del-salmon' }}
        env_vars: ""
        secrets: ""
```

### Dockerfile buildx changes

```dockerfile
# Replace:
RUN npm run build --workspace=apps/portfolio
# With:
RUN npx turbo run build --filter=portfolio
# Add buildx cache (in ci.yml, not Dockerfile):
docker buildx build \
  --cache-from type=gha \
  --cache-to type=gha,mode=max \
  -f apps/portfolio/Dockerfile ...
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | turbo.json task graph resolution | `turbo run lint typecheck build test --dry=json` — verify dependency order |
| Unit | Composite action | Local `act` runs to validate setup steps |
| Integration | CI quality pipeline | Push PR; verify `turbo run` succeeds in CI |
| Integration | Lighthouse no double build | Check CI logs — `next build` appears once (in quality job), not in LH job |
| Integration | Matrix deploy | Push to master; verify both services deploy identically to current |
| E2E | Cache hit on non-source PR | Open PR touching only `.md`; verify Next.js cache hits |

## Migration / Rollout

### Phase 1 — Foundation (rollback-safe, additive)

1. Update `turbo.json` — add tasks, fix dependsOn. Run `turbo run lint typecheck build test --dry=json` locally to validate.
2. Update root `package.json` scripts. Run each locally to confirm turbo orchestrates correctly.
3. Create `.github/actions/setup-node-deps/action.yml`. Test with `act`.
4. Fix Next.js cache keys in all 3 workflows — remove source globs.
5. **Rollback**: Revert commit. Old npm scripts still work; turbo.json entries are additive.

### Phase 2 — Turbo-ify CI

1. Split `apps/portfolio/package.json` `qa:lighthouse` script to remove inline build.
2. Refactor `ci.yml` to use composite action + `turbo run` commands.
3. Refactor `qa-professional.yml` — composite action, turbo commands, `--filter` affected detection.
4. Add `TURBO_TOKEN`/`TURBO_TEAM` env vars to workflow files (graceful fallback when absent).
5. **Rollback**: Revert commit. CI falls back to composite action (still works) with manual `npm run` steps.

### Phase 3 — CD Refactoring

1. Refactor `cd-cloudrun.yml` to matrix strategy. Test with `act --matrix`.
2. Add Docker buildx caching to build step.
3. Update Dockerfiles to use `turbo run build --filter`.
4. Cache pr-governance develop branch check.
5. **Rollback**: Revert commit. Individual deploy jobs still work.

## Open Questions

- [ ] Remote cache vendor decision (Vercel vs GitHub Actions cache) — blocks remote cache activation in Phase 2 but does NOT block local turbo cache
- [ ] Whether `maestros-del-salmon` needs `test`/`qa:lighthouse`/`qa:bundle` scripts added to its package.json (currently only has `dev`, `build`, `start`, `lint`)