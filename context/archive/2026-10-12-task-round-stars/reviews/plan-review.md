<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Runda zadań dotykiem z gwiazdkami, podpowiedzią i drugą próbą

- **Plan**: context/changes/task-round-stars/plan.md
- **Mode**: Deep (claims verified directly against code and with tsx probes over the real `stages` data; no sub-agent)
- **Date**: 2026-10-12
- **Verdict**: REVISE before triage → SOUND after the fixes below
- **Findings**: 1 critical, 2 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F3 fixed) |
| Plan Completeness | WARNING (F2 fixed) |

## Grounding

Grounding: 6/6 paths ✓ (`playwright.config.ts`, `vite/config.shared.mjs`, `vite/config.prod.mjs`, `src/core/tasks/distractors.ts`, `src/core/tasks/generators/bonds.ts`, `src/data/curriculum/E1.ts`; new files `generateTask.ts`, `round.ts`, `round/` confirmed absent), 6/6 symbols ✓ (`numberChoices`, `boundOf`, `Task.choices`, `globPatterns`, `__BUILD_ID__`, `load.font` = Phaser `FontFile` via `FontFace`), brief↔plan ✓. Progress↔Phase: 11/11 titles match, 55 rows = 55 Success Criteria bullets, no checkboxes outside Progress. Drivers: 1–4 `tdd` (no implementation exists), 5–10 `impl`, 11 `e2e` after the seam sweep (10), feature built in 5–8 and hook in 9, contract E2E=on — all correct. Follow-ups with `Trigger: S-04`: "E1 numeric answers use the keypad" (generators-remaining-stages) → Phase 1; F14 (generators-e3-e4, names S-04 in text) → Phase 2. Both included. No `lessons.md`.

Orchestrator focus points:
- (a) Playwright 1.64 starts `webServer` entries one after another (`createPluginSetupTasks` in `node_modules/playwright/lib/runner/index.js`); `dist/` and `dist-e2e/` are separate `outDir`s, preview 4398 keeps serving `dist/`; guard runs in `config.prod.mjs` for both builds with `expectHook` from `E2E_HOOK`. No collision; cost = two terser builds per e2e run (Known risks). `reuseExistingServer` → F3.
- (b) TTF = 114 552 B, served from `/fonts/`, so seed #8's `/_app/*.js ≥ 2` assertion is unaffected; FontFace fetch from a controlled page goes through the SW. CLAUDE.md glob list needs `ttf` → F5.
- (c) First-hint rule: definition inconsistent between Intent and tests → F2; FR-008 deviation keeps its `[human]` row 10.6 (Known risks lists which types get no hint).
- (d) E1 tiles: `numberChoices` includes the answer, uniqueness by `Set`, near candidates first, never below `min` (0) — but BONDS `tileRange` as planned is infeasible → F1. Probe: every other E1 numeric skill is feasible at count 4; all existing `'tiles'` skills in E1–E6 already get `choices` from their generators (pass-through).

## Findings

### F1 — BONDS `tileRange {zero ? 0 : 1, total}` with 4 tiles throws for sums 2 and 3

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details; Phase 1 §2, §4
- **Detail**: `E1.3.bonds_5` has `totals: [2, 3, 4, 5]`, `zero: false`. With the planned range `{1, total}` and `count: 4`, `numberChoices` throws `RangeError` (cannot find 4 distinct tiles) — measured 54/600 draws. Research's "0 exceptions" was measured with `boundOf`, not with the per-task range. Even `{0, total}` has only 3 values at sum 2.
- **Fix**: `tileRange = { min: 0, max: total }`; `generateTask` uses `min(tileCount, max − min + 1)` tiles (sum 2 → 3 tiles, FR-006 3–4); invariant asserts ≥ 3 tiles for tiles added by `generateTask`, 0 exceptions for `E1.3.bonds_5`.
- **Decision**: FIXED (plan Critical Implementation Details, Phase 1 §2 and §4; plan-brief decisions row)

### F2 — First-hint leak rule: Intent says "ends with", tests say "never contains"

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 2 §1, §3
- **Detail**: Intent: hint[0] shown unless line 0 *ends with* the result token. Test: `firstHint` *never contains* the result as a token (except ROUNDING). Probe over all E1–E6 skills × 200 seeds: mid-line coincidences where an operand equals the result — CHAIN 50/200 („5 + 3 = 8” for 5 + 3 − 3), BONDS 74/600, WORD 24/104, ADD_SUB 10/1985 — and COMPARE_EXPR answer `=` matching the equation sign 32/200. The test as written would fail, or push the implementer to over-block good hints. String answers had no defined rule.
- **Fix**: One definition for code and tests: numeric answer → leak iff the last number of line 0 equals the answer; string/array answer → never a leak (0 real leaks measured). `solutionSteps` appends the result line iff the last number of the last line ≠ answer (string: last line lacks it). SEQUENCE false block (step = result, 10/200) accepted.
  - Strength: matches the research measurement (HALF 200/200 caught, ROUNDING exempt) and keeps hints for CHAIN/WORD/BONDS.
  - Tradeoff: a future hint that states the result mid-line would pass; S-17 rewrites hints anyway.
  - Confidence: HIGH — measured on the real generators.
  - Blind spot: thousands formatting (`formatNumber` space) must be parsed as one number; the test covers E6.
- **Decision**: FIXED (Phase 2 §1 Contract and §3 Intent)

### F3 — Hook server `reuseExistingServer: !CI` would reuse a stale 4397 build

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 9 §3
- **Detail**: Locally a leftover preview on 4397 (aborted run) is reused without rebuilding. Both builds carry the same `data-build` (commit SHA), so the spec's "hook exists" check cannot detect uncommitted-code staleness; phases 9–11 would test old code. The app entry's reuse is owned by `/10x-e2e-setup` and stays, but the hook entry is this plan's own.
- **Fix**: `reuseExistingServer: false` on the hook entry; a taken port fails loudly (`E2E_HOOK_PORT` override).
- **Decision**: FIXED (Phase 9 §3)

### F4 — Two production builds on every `npx playwright test`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Implementation Approach (hook), Phase 9 §3
- **Detail**: `webServer` entries are global, so even a single-spec or `--project chromium` run builds both. Sequential start verified; no dist collision.
- **Fix**: Recorded in plan `## Known risks`.
- **Decision**: ACCEPTED (Known risks)

### F5 — CLAUDE.md precache glob list goes stale with `ttf`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 10 §3
- **Detail**: CLAUDE.md Commands says the precache globs "cover js, css, html, png, webp, ogg, m4a and woff2"; Phase 5 adds `ttf`. Font size and seed #8 impact checked (see focus point b) — no risk to the offline start.
- **Fix**: Phase 10 §3 Intent names the glob sentence to update.
- **Decision**: FIXED (Phase 10 §3; offline/size facts in Known risks)

## Product decisions vs PRD

Checked against FR-006/007/008/011 and US-01: „Dalej” instead of auto-advance (10.5), hint suppressed when line 0 leaks (10.6, FR-008), `'select'` excluded until S-13 (10.7), switch not drawn (10.8, FR-011) — none clearly wrong, each has a `[human]` row. FR-007's first/second-try distinction is kept in `RoundState.outcomes`.

VERDICT: PROCEED — approach sound; the one infeasible detail (BONDS tile range) and two specification gaps are fixed in plan.md, drivers and phase sizing are right.
