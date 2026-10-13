# Handoff — `adaptive-curriculum` (slice S-07)

Written by the `/10x-plan` step: `plan.md` (9 phases: 1–4 and 6 `tdd`, 5, 7, 8 `impl`, 9 `e2e`) and `plan-brief.md`
exist, `change.md` is `planned`, the roadmap row is `planning`. The next agent must not plan the start of the unlock
pointer as "first playable step": the plan fixes the school-calendar floor (rule D, formula and expected table in
plan.md § Critical Implementation Details), and "większość" is `≥ ceil(0.5 · n)`.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | 3 on top of `fd68216` (change identity; research; this step's `docs(adaptive-curriculum): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 44 (all; 13 of them `[human]`/`[reviewer]`/`[visual]`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/plan.md` | Implementation plan with `Driver:` lines, Critical Implementation Details (rule D formula + table), Known risks, Autonomous decisions 1–12, `## Progress` |
| `context/changes/adaptive-curriculum/plan-brief.md` | Two-page brief |
| `context/changes/adaptive-curriculum/change.md` | Status `preparing` → `planned` (metadata guard only) |
| `context/foundation/roadmap.md` | S-07 status `proposed` → `planning` (At a glance row + item body) |
| `context/changes/adaptive-curriculum/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/adaptive-curriculum` |
| Rule D table check (`node $TMPDIR/cal.mjs`, outside the repo, formula from research § 1) | all 36 cells equal the research table (E1 3,4,5,7,11,11 … E6 4,5,6,8,10,10) — used as the phase-2 oracle |
| Success Criteria ↔ Progress mapping (python count per phase) | 1:4/4, 2:3/3, 3:4/4, 4:3/3, 5:5/5, 6:5/5, 7:6/6, 8:10/10, 9:4/4 |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline in the contract: main at fd68216, unit 767, e2e 14) |

## 4. Next command

`/10x-plan-review adaptive-curriculum`

## 5. Open

- `[human]` rows (plan Phase 8): 8.5 session-only until S-11; 8.6 rule D (E3 in October steps 1, 2, 6; whole stage from
  January; parent path to a lower stage = whole stage); 8.7 `≥ ceil(0.5·n)`; 8.8 unlock during easing; 8.9 easing by
  weights; 8.10 no stage auto-advance.
- Teacher read: 48 `StepDef.childName` (phase 6, row 6.5) and `pl.unlock` (row 7.5).
- E2E phase 9: if Chromium cannot launch, the request file `context/runs/2026-10-12-s04-s08/e2e-request-s07-p9.md` with
  break patches on `TaskScene.startNextRound` (ignores `pendingUnlock`) and the card's „Dalej” (does not clear `pendingUnlock`).
- Follow-ups the phase-8 agent writes (`follow-ups/review-fixes.md`): test-plan risks #13/#12, `test-stack.md` § E2E
  `chromium-hook`, ` = ?` → `Trigger: S-16`, S-11 floor `max(saved, calendarStart)`, early save now covers mastery, S-08
  history without prompt, S-17 calibration.
- DESIGN-GAPs planned (rows 22+): narrator on the card, card after „Do pokoju”, book placeholder.

## 6. Autonomous decisions

1. Rule D calendar floor adopted per orchestrator guidance; rejected A (first step, regression), B (whole stage, nothing to
   unlock), C. Would change if the author wants every step earned or S-11 lands first.
2. Unlock allowed during easing (reverses change.md decision 4; PRD silent) — `[human]` 8.8. Would change after the S-17 playtest.
3. `unlockedStep` initialised for all six stages at placement (`startLearning`), so the warm-up correction and S-08 need no
   recomputation. Would change if S-11 wants only played stages stored.
4. The card is read aloud when `autoRead` (kit silent → DESIGN-GAP), because E1 children cannot read the step name.
5. Scene wiring (phase 5) lands before the card (phase 7): an unlock moves the step silently and sets `pendingUnlock`
   until then, so every phase stays green.
6. The new e2e spec uses a new shared `tests/e2e/support/hook.ts`; migrating older specs stays follow-up F2 (`Trigger: S-08`).
7. Interview/complexity/structure confirmations of the skill decided in place (no AskUserQuestion); clipboard skipped.
