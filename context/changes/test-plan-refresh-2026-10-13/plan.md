# Test-plan refresh after S-04..S-08 and the observability fix — Implementation Plan

## Overview

Docs-only refresh of `context/foundation/test-plan.md` that records what shipped since 2026-10-12 (local e2e for S-04..S-08 and the error card), adopts the four proposed risks #12-#15, adds two new risks (#16 S-09 star purchase, #17 difficulty curve in practice), restates the 2026-10-13 interview, and re-scopes the rollout: phase 5 complete, the update/kept-state part of #10 moves to phase 4, new phase 6 (difficulty-curve simulation) and phase 7 (manual device checklist).

## Current State Analysis

- `test-plan.md` (183 lines) has risks #1-#11 (`:42-54`), phases 1-3 complete, 4 and 5 `not started` (`:85-86`), §4 e2e "none yet" (`:97`), §6.6 an e2e placeholder (`:152-154`), §7 an "Open" line for WebKit and performance (`:170`), §8 dated 2026-10-12.
- Research (`research.md`) grounded: wording, ratings and response rows for #12-#15 from four archives; requirement lines for #16 (FR-016/FR-017, US-02 AC, guardrail "nigdy utrata gwiazdek"); the absence of any requirement pace for #17 and the maintainer's derived range; e2e stack facts (Playwright 1.64.0, two projects, two servers 4398/4397, guard markers, `?e2eMonth`/`?e2eFail`, never `page.clock`, `holdTouch` via CDP, break patches, AST test); evidence numbers (63 files / 974 unit tests, 7 specs / 23 e2e tests; hot-spots measured, `src/data` 112 not 86).

### Key Discoveries:

- Schema `.claude/skills/10x-test-plan/references/test-plan-schema.md`: §2 Source cells cite evidence only (no files, symbols, `file:line`); risks are appended, never renumbered; §3 status literals fixed; §7 at most 5-6 bullets; no code blocks.
- Phase 5 was delivered inside several slice changes, not one rollout change; the §3 Change-folder cell must name them in a way the orchestrator still reads as `complete`.
- The follow-up audit (N-1, N-4, N-6) lives only on the unmerged PR #28 branch; cite it as "audit 2026-10-13 follow-up (PR #28)", not as a path on main.

## Desired End State

`test-plan.md` lists risks #1-#17 with one guidance row each, §3 has 7 phases (1-3 and 5 complete, 4 `not started` and covering #2, #7, #10-state, 6 and 7 `not started`), §4/§5/§6 describe the shipped e2e layer and its cookbook, §7 reflects the 2026-10-13 negative space, §8 is dated 2026-10-13. Verified by the schema greps below and green lint/typecheck.

## What We're NOT Doing

- Writing the difficulty-curve simulation (phase 6) or the device checklist content (phase 7); each opens its own change via `/10x-test-plan`.
- Updating `context/foundation/test-stack.md` (stale: one server, seed only) — follow-up.
- Rewriting §1 principles, renumbering risks, adding §3 status values.
- Changing `docs/human-checklist.md`, `autonomous-run.md` or any code.

## Implementation Approach

Edit the file section by section in two phases. Decisions recorded here (research + maintainer):

- **#16 S-09 star purchase**: "buying an item takes stars twice on a repeated tap, takes them before 'Wybieram', or drives the balance below zero". High / Medium (S-09 not built; purchase is the core loop and touches the never-lose guardrail). Cheapest layer: unit/property on the pure purchase logic in `core` (balance never negative, deduction exactly once per confirmed choice, nothing deducted on open/cancel or when short) + one local e2e on the touch path after S-09. Must challenge: "the button is greyed when short, so the balance cannot go negative".
- **#17 difficulty curve**: "in practice a child at normal accuracy waits too long for the next step, or one hard skill blocks a step, so the game feels stuck". High / High (primary success criterion "unlocked steps match school"; the 2026-10-13 model predicts a 3-skill step at 70 % needs ~24 rounds; audit H-7/M-12). Cheapest layer: unit/property simulation driving the real `core` round, mastery and curriculum functions with synthetic children of fixed first-try accuracy over many seeds. Acceptance range (maintainer, derived from PRD, R = 2 rounds per session): ~120 rounds per stage (20 weeks × 3 sessions × 2 rounds); 70 % child: median rounds per step at most 120 ÷ (steps in the stage); 60 % child: every step unlocks within the stage budget at p90; 90 % child: median at most half the 70 % budget. Anti-pattern: expected values read from the balance data (implementation mirror); widening the range when the simulation fails (that is the S-17 calibration signal).
- **#12-#15** use the archived wording and response rows from research, translated to English, with evidence-only Sources.
- **Interview 2026-10-13** goes into §1 as a short "Interview 2026-10-13" paragraph after the hot-spot line (fears equal; nothing failed in production; least confidence curriculum data and scenes; under-tested difficulty curve and real tablet).
- **§3 phase 5** Change folder: "S-04..S-08 + `observability-c1-c2` archives (2026-10-12/13)" with status `complete`; goal rewritten to what shipped. **Phase 4** risks become #2, #7, #10 (state part), goal adds "an update keeps state, local e2e on two builds". **Phase 6** "Difficulty-curve simulation", #17, unit/property, `not started`. **Phase 7** "Manual device checklist", #11-#15 (and #16 after S-09), manual, trigger every change to touch handling or scenes, `not started`. Seven phases exceed the schema's 3-5 sweet spot; accepted because four are complete history.
- **§4**: Playwright row 1.64.0 with the two projects/servers and guard; new row "difficulty-curve simulation — Vitest, none yet — see Phase 6"; "manual device checklist — none yet — see Phase 7"; grounding notes dated 2026-10-13.
- **§5**: local browser e2e `required` (phase 5 complete); build guard row (e2e hook leaks fail `npm run build`); difficulty-curve simulation `planned — required after Phase 6`; manual device check row narrowed to "every change to touch or scenes, required after Phase 7".
- **§6**: 6.6 filled with the e2e cookbook; new 6.7 "Adding a difficulty-curve simulation case — TBD, see Phase 6"; 6.8 "Device checklist — TBD, see Phase 7"; per-phase notes move to 6.9 with a Phase 5 note. Nine entries exceed the 3-6 guideline; accepted, placeholders are one line each.
- **§7**: keep snapshots, CI e2e, flows-not-pixels, coverage, voice quality; add "performance tests" (desktop timing does not represent the tablet; real-device check in phase 7) and "WebKit automation" (no SW automation in WebKit; iPad stays manual in phase 7); remove the "Open" line (both now decided).

## Phase 1: Strategy and risks (header, §1-§3)

Driver: impl
Driver why: prose edits to a foundation doc.

### Overview

Header date, §1 hot-spot line and interview paragraph, §2 rows #12-#17 with guidance rows, §3 re-scope.

### Changes Required:

#### 1. Header and §1

**File**: `context/foundation/test-plan.md`

**Intent**: "Last updated: 2026-10-13 (refresh: risks #12-#17, phases 5 complete, 6-7 added)"; hot-spot line replaced with the measured 30-day counts (312 non-merge commits; `src/data` 112, `src/core/tasks` 88, `src/ui` 67, `src/core` 59, `src/scenes` 57, `tests` 139, `tests/e2e` 35, `deploy` 26) and the baseline (63 unit files / 974 tests, 7 specs / 23 e2e tests); interview paragraph added.

**Contract**: §1 principles text unchanged.

#### 2. §2 risk map and guidance

**Intent**: Append rows #12-#17 (ratings: #12 High/Medium, #13 Medium/Medium, #14 High/Medium, #15 High/Medium, #16 High/Medium, #17 High/High) and six guidance rows. Sources cite PRD/roadmap lines, archived slice plans/follow-ups, audits 2026-10-13 (0659 on main; follow-up PR #28), interview 2026-10-13, hot-spot directories.

**Contract**: table columns unchanged; Source cells carry no `.ts`, `file:line`, or symbol names.

#### 3. §3 phased rollout

**Intent**: Rows 4 and 5 rewritten as decided; rows 6 and 7 appended.

**Contract**: 7 cells per row; statuses only from the fixed vocabulary.

### Success Criteria:

#### Automated Verification:

- §2 has rows #1-#17 and the guidance table has 17 rows: `awk '/^## 2\./,/^## 3\./' context/foundation/test-plan.md | grep -cE '^\| #?[0-9]+ '` prints 34
- §2 Source cells carry no file anchors: `awk '/^## 2\./,/^### Risk Response/' context/foundation/test-plan.md | grep -E '^\| [0-9]+ ' | awk -F'|' '{print $6}' | grep -cE '\.ts|\.mjs|:[0-9]+'` prints 0
- §3 rows parse: 7 rows, each with 7 cells and a status in {not started, change opened, researched, planned, implementing, complete}; rows 1, 2, 3, 5 `complete`, rows 4, 6, 7 `not started`

#### Manual Verification:

- Maintainer reads §1-§3 and agrees they match the 2026-10-13 interview and decisions

---

## Phase 2: Stack, gates, cookbook, negative space (§4-§8)

Driver: impl
Driver why: prose edits to a foundation doc.

### Overview

Bring §4-§8 in line with the shipped e2e layer and the new phases.

### Changes Required:

#### 1. §4 and §5

**File**: `context/foundation/test-plan.md`

**Intent**: As decided in Implementation Approach; every gate row points at a shipped or named phase.

**Contract**: §4/§5 table columns unchanged.

#### 2. §6 cookbook

**Intent**: 6.6 lists location (`tests/e2e/`, support helpers), projects (seed in `chromium`, round specs in `chromium-hook` by file name), how to reach a state (`passWelcome`/`passWelcomeAsChild`, `?e2eMonth`, `?e2eFail=step|boot|settings`), touch (`tapScene` through the canvas box, `holdTouch` via CDP — the only fixed wait), rules (never `page.clock`: it freezes Phaser tweens; read state only from the hook, gate answers from the dialog text; a new query parameter or hook field must be added to the guard's marker list), proof (deliberate break as a `git apply` patch to production code, run by the orchestrator because Chromium cannot start in the agent sandbox), and the AST test for session-wrapped dialog callbacks as the unit-level guard for #15. 6.7/6.8 placeholders, 6.9 per-phase notes with a Phase 5 note.

**Contract**: no code blocks (schema); file paths allowed in §6.

#### 3. §7 and §8

**Intent**: §7 as decided (at most 6 bullets plus none "Open"); §8 all three dates 2026-10-13.

### Success Criteria:

#### Automated Verification:

- No code fences in the file: `grep -c '^```' context/foundation/test-plan.md` prints 0
- §7 has at most 7 bullets and no "Open (" line: `awk '/^## 7\./,/^## 8\./' context/foundation/test-plan.md | grep -c '^- '` prints a number ≤ 7 and `grep -c '^Open (' context/foundation/test-plan.md` prints 0
- §8 dates: `grep -c '2026-10-13$' context/foundation/test-plan.md` prints at least 3
- `npm run lint` and `npm run typecheck` pass

#### Manual Verification:

- Maintainer reads §4-§7 and confirms the e2e cookbook matches how specs are written today

---

## Testing Strategy

Docs-only; verification is the grep checks above plus lint/typecheck (no source change, run as a sanity gate). No tests are added.

## References

- Change brief: `context/changes/test-plan-refresh-2026-10-13/change.md`
- Research and decisions: `context/changes/test-plan-refresh-2026-10-13/research.md`
- Previous refresh: `context/archive/2026-10-12-test-plan-refresh-2026-10-12/plan.md`
- Schema: `.claude/skills/10x-test-plan/references/test-plan-schema.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Strategy and risks (header, §1-§3)

#### Automated

- [x] 1.1 §2 has rows #1-#17 and the guidance table has 17 rows
- [x] 1.2 §2 Source cells carry no file anchors
- [x] 1.3 §3 rows parse; rows 1, 2, 3, 5 complete, rows 4, 6, 7 not started

#### Manual

- [ ] 1.4 Maintainer reads §1-§3 and agrees they match the 2026-10-13 interview and decisions

### Phase 2: Stack, gates, cookbook, negative space (§4-§8)

#### Automated

- [ ] 2.1 No code fences in the file
- [ ] 2.2 §7 has at most 7 bullets and no "Open (" line
- [ ] 2.3 §8 dates are 2026-10-13
- [ ] 2.4 `npm run lint` and `npm run typecheck` pass

#### Manual

- [ ] 2.5 Maintainer reads §4-§7 and confirms the e2e cookbook matches how specs are written today
