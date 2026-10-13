<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Pierwsze uruchomienie: wiek, etap, bramka rodzica i rozgrzewka

- **Plan**: context/changes/first-launch-placement/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-10-13
- **Verdict**: APPROVED
- **Findings**: 0 critical, 3 warnings, 6 observations (2 warnings and 1 observation fixed in `a6f091b`)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Evidence (observed in this step)

- Diff `37a9a62..3320b20`: 38 files outside `context/`; every planned file is present. Extras: `src/ui/dom/dialog.ts` (shared modal: focus trap, Escape, focus restore, used by both dialogs), `src/ui/widgets/notebook.ts` (`drawNotebook` moved out of `TaskScene` for reuse), a comment-only change to `ProgressDots.ts`, and `tests/e2eMonth.test.ts`. All are justified and recorded in the phase handoffs.
- Gate on `3320b20` and again on `a6f091b`:
  - lint and typecheck clean.
  - `npm test`: 53 files, 765 passed (main baseline 671, +94).
  - `deploy/test-martynka-deploy.sh` and `deploy/ops/test-martynka-ops.sh` OK.
  - `sample` E1–E6: `Naruszenia: 0`.
  - `npm run build` prints `e2e hook: absent (2 chunks checked)`.
  - `grep -rl e2eMonth dist/` and `grep -rl __martynkaE2E dist/` are both empty.
  - `grep -rn defaultStage src/ tests/ scripts/` is empty.
- E2E: `npx playwright test`, run once as a plain command, could not launch Chromium in this session (MachPort, 4 failed / 10 did not run, all launch errors). The e2e evidence is therefore the orchestrator's runs on `3320b20`: 14/14, which is the main baseline of 8 + 6. Its deliberate breaks for p4, p6, p8 and p9 are recorded in `context/runs/2026-10-12-s04-s08/e2e-request-s06-p8.md`, `e2e-request-s06-p9.md` and the run log. Code changed after `3320b20` (`a6f091b`), so the orchestrator re-runs e2e.
- Deliberate break re-executed (TDD phase 2, no browser): `warmupResult` with `firstTry <= minFirstTry` made `tests/warmup.test.ts` fail 2 tests (`E2 first=4: expected 'E1' to be 'E2'`). That matches the RED/break evidence of handoff p2. Restored, 11 passed. RED evidence for phases 1–3 is quoted in the handoffs of `2fe1267`, `4e21102` and `f27bfc6`.
- Hooks: `.claude/settings.json` and `.claude/hooks/*` were not modified during the slice (mtimes predate it), and no commit mentions `--no-verify`.
- Security checks:
  - The gate answer stays inside the `openParentGate` closure. It is not in any DOM attribute, the hook, a log or the narrator.
  - Input is restored on every path. Gate Anuluj and Escape, and panel Anuluj and Escape, all go through `WelcomeScene.openParent` → `resume`. Success goes through `start`.
  - On `shutdown` the open dialog is closed, and `InputPlugin.start` resets `enabled`.
  - `openDialog.close` removes the document keydown listener and gives focus back.
- Teacher reads: `reviews/teacher-read.md` (rows 1.4, 2.5, 4.6, 5.5), all PASS.

## Findings

### F1 — Panel group labels: ids with spaces

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/stagePanel.ts (`openStagePanel` → `group`)
- **Detail**: `id = \`panel-${heading}\`` gave ids such as "panel-Wiek dziecka". `aria-labelledby` is a space-separated IDREF list, so the age and stage groups had no accessible name.
- **Fix**: fixed ids `parent-panel-age` / `parent-panel-stage`.
- **Decision**: FIXED — a6f091b

### F2 — E2E helpers duplicated across specs

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Pattern Consistency
- **Location**: tests/e2e/support/welcome.ts (`passWelcome`), tests/e2e/first-launch.spec.ts (`readHook`, `tapScene`, `gateProblem`, `typeIntoGate`, `openGate`), tests/e2e/task-round.spec.ts, tests/e2e/narrator.spec.ts
- **Detail**: `readHook`, `tapScene` (1920/1080 literals), `fromHook`, `tapNumber`, `answerWrong`/`answerRight` and `phaseIs` now exist in 3–4 copies. The gate-solving steps are written twice, in `passWelcome` and in first-launch's `openGate`/`typeIntoGate`. This was a deliberate choice in phase 8 (handoff decision 4: "as the other specs do").
- **Fix**: move the hook and tap primitives into `tests/e2e/support/hook.ts` and the gate steps into `support/welcome.ts`; specs import them.
  - Strength: one place to change when the hook or the gate dialog changes (S-08 reuses the gate).
  - Tradeoff: touches four specs, so e2e must be re-run. That is not possible in this session.
  - Confidence: HIGH — mechanical extraction.
  - Blind spot: none significant.
- **Decision**: DEFERRED — follow-ups/review-fixes.md (Trigger: S-08)

### F3 — Stale docs and comments

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (seam sweep 7.4)
- **Location**: CLAUDE.md (Current state), tests/e2e/narrator.spec.ts (header), src/testing/e2eHook.ts (module header)
- **Detail**:
  - CLAUDE.md said BootScene "starts the task scene".
  - CLAUDE.md said the warm-up is "3 + 3 from the first playable steps of the two previous stages". It is actually 3 from the previous stage + 3 from the first 2 playable steps of the current one.
  - The narrator header said "age 8 in October", but the helper takes the parent path (age 10, E3 chosen).
  - The hook header said main.ts imports the module "inside `if (__E2E_HOOK__)`", but the import is static and the use is gated.
- **Fix**: rewrite the four sentences.
- **Decision**: FIXED — a6f091b. The hook header is now separated from `e2eMonth`'s JSDoc by a blank line and still sits at the top of the module (module header). The commit message's "JSDoc nad installE2EHook" overstates this.

### F4 — "⌫" aria-label set through a magic index

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/dom/parentGate.ts (`openParentGate`)
- **Detail**: the code used `keys.children[9].setAttribute(...)`.
- **Fix**: the label is now set on the created button.
- **Decision**: FIXED — a6f091b

### F5 — core imports a type from data

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/core/placement.ts (`import type { placementData } from '../data/placement'`)
- **Detail**: a type-only import from core into data, the reverse of the usual direction. It has no runtime effect and ESLint allows it.
- **Fix**: declare a `PlacementData` interface in core and have data satisfy it.
- **Decision**: RECORDED — follow-up (Trigger: S-07 touches placement/curriculum types)

### F6 — Dialog keydown does not stop propagation

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/dialog.ts (`openDialog` → `handleKey`)
- **Detail**: digits typed into the gate also reach any other document/window keydown listener. Nothing listens today (no Phaser keyboard in src).
- **Fix**: `stopPropagation` for the keys the dialog handles, before any Phaser keyboard use.
- **Decision**: RECORDED — follow-up (Trigger: first Phaser keyboard input)

### F7 — AgeButton copies PageButton's tap logic

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/AgeButton.ts
- **Detail**: the press, pointerout and pointerup handling is duplicated. That is acceptable for two widgets.
- **Fix**: extract a shared tap-zone helper when a third button type appears.
- **Decision**: RECORDED

### F8 — Design-gap row 21 has no code comment

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/placement.ts
- **Detail**: the plan says every gap row has a `DESIGN-GAP` comment. Row 21 (picture mode, a skipped feature) has none, by a recorded decision (handoff p7 decision 2). Rows 15–20 have comments.
- **Fix**: none now. S-14 adds the mode.
- **Decision**: ACCEPTED

### F9 — E2E not re-runnable by the reviewer

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: N/A
- **Detail**: Chromium cannot launch in this sandboxed session (MachPort). `a6f091b` changes `stagePanel` ids, the `parentGate` key construction (same order and labels) and comments. No spec selects by those ids or by group names.
- **Fix**: the orchestrator runs `npx playwright test` on `a6f091b` (expected 14 passed = baseline 8 + 6).
- **Decision**: HANDED TO ORCHESTRATOR

## Manual rows performed by the reviewer

- 1.4, 2.5, 4.6, 5.5: PASS (`reviews/teacher-read.md`).
- 7.4 seam sweep: PASS after `a6f091b`.
  - No dead keys: every `pl.parent` key and the new layout tokens have readers.
  - No `defaultStage` remains anywhere.
  - Stale comments are fixed.
  - The bare numbers from the S-05 follow-up are tokenised (`keyBorder`, `fieldBorder`, `iconStroke`, `shakeSegments`).
  - Design-gap rows 15–20 have code comments (row 21 accepted, F8).
  - The production code has no duplicate dialog building (`dialog.ts` is shared).
  - The e2e helper duplication is deferred (F2).

MERGE: CLEAR — no critical findings; the gate is green on a6f091b (lint, typecheck, unit 765 = baseline 671 + 94, deploy/ops, samples, build with the hook absent); the e2e evidence is the orchestrator's 14/14 on 3320b20, to be re-run on a6f091b before ship
