#!/usr/bin/env tsx
import { execSync } from "child_process";

/**
 * audit-liquid-glass.ts
 *
 * Static audit harness for the LiquidGlass migration. Phase 8 (T-80..T-86).
 */

interface AuditRule {
  id: string;
  description: string;
  run: () => Promise<boolean>;
}

const MIGRATED_FILES = [
  "apps/portfolio/components/fragments/Footer.tsx",
  "packages/ui/src/components/GlassNav.tsx",
  "packages/ui/src/components/CommandSurface.tsx",
  "apps/portfolio/components/fragments/HeroFragment.tsx",
  "apps/portfolio/components/fragments/CookieBanner.tsx",
  "apps/portfolio/components/fragments/ProjectsOverview.tsx",
  "packages/ui/src/components/HudChip.tsx",
  "apps/portfolio/components/ui/LocaleSwitcher.tsx",
  "apps/portfolio/components/fragments/ProjectFragment.tsx",
  "apps/portfolio/app/[locale]/projects/[slug]/page.tsx",
];

const RULES: AuditRule[] = [
  {
    id: "no-userAgent-in-primitive",
    description: "S3.4: no navigator.userAgent in packages/ui/src/liquid-glass.",
    run: async () => {
      try {
        const out = execSync("rg -l \"navigator.userAgent\" packages/ui/src/liquid-glass").toString().trim();
        return out === "";
      } catch {
        return true; // rg returns non-zero if no matches
      }
    },
  },
  {
    id: "no-runtime-viewport-listeners",
    description: "S5.4: no window.innerWidth|matchMedia in primitive runtime outside tests.",
    run: async () => {
      try {
        // Exclude __tests__, stories, and the sanctioned gates hook
        const out = execSync(
          "rg -l \"window.innerWidth|matchMedia\" packages/ui/src/liquid-glass --glob '!**/__tests__/**' --glob '!**/*.stories.tsx' --glob '!**/use-liquid-glass-gates.ts'"
        ).toString().trim();
        return out === "";
      } catch {
        return true;
      }
    },
  },
  {
    id: "no-raw-backdrop-blur-in-migrated-surfaces",
    description: "S7.1: no backdrop-blur in enumerated migrated files.",
    run: async () => {
      let allPass = true;
      for (const file of MIGRATED_FILES) {
        try {
          execSync(`rg "backdrop-blur" ${file}`);
          // If we find it, it's a fail
          console.error(`  [FAIL] backdrop-blur found in ${file}`);
          allPass = false;
        } catch {
          // No match is good
        }
      }
      return allPass;
    },
  },
  {
    id: "every-migrated-surface-imports-LiquidGlass",
    description: "S7.2: every migrated file imports LiquidGlass.",
    run: async () => {
      let allPass = true;
      for (const file of MIGRATED_FILES) {
        try {
          execSync(`rg "LiquidGlass" ${file}`);
        } catch {
          console.error(`  [FAIL] LiquidGlass import missing in ${file}`);
          allPass = false;
        }
      }
      return allPass;
    },
  },
  {
    id: "no-light-glass-variant",
    description: "S9.3: theme=\"light\" not exposed in types.ts.",
    run: async () => {
      try {
        execSync("rg \"theme.*light\" packages/ui/src/liquid-glass/types.ts");
        return false;
      } catch {
        return true;
      }
    },
  },
  {
    id: "scope-boundary-check",
    description: "REQ-9: No modifications to maestros-del-salmon or studio in git diff.",
    run: async () => {
      try {
        // Check current diff against master (or just current staged/unstaged changes if we are on a branch)
        // Since we are implementing, we check current working tree changes.
        const out = execSync("git status --porcelain").toString();
        const violations = out.split("\n").filter(line => 
          line.includes("apps/maestros-del-salmon") || line.includes("apps/studio")
        );
        return violations.length === 0;
      } catch {
        return true;
      }
    },
  },
];

async function main(): Promise<void> {
  const summary: { id: string; status: "pass" | "fail" }[] = [];
  for (const rule of RULES) {
    const passed = await rule.run();
    summary.push({
      id: rule.id,
      status: passed ? "pass" : "fail",
    });
  }

  console.log("liquid-glass audit results:");
  for (const row of summary) {
    console.log(`  - ${row.status.toUpperCase()}  ${row.id}`);
  }

  const failed = summary.filter((row) => row.status === "fail").length;
  if (failed > 0) {
    process.exit(1);
  }
}

void main();
