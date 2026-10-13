# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by the `/10x-new` step: the change folder exists with `change.md` (identity, roadmap corrections, scope split,
triggered follow-ups, decisions); no code yet. The next agent must not plan the whole M6 set: S-13 is split
(change.md `## Autonomous decisions` 1) — PUZZLE_GRID, GRID, PERIMETER and clock-hand dragging are OUT.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | 1 on top of `b57433c`: `docs(drawn-widget-tasks-e3-e4): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/drawn-widget-tasks-e3-e4/change.md` | Change identity: roadmap claim vs repo table, scope (types × widgets × answer modes), design-kit bindings and DESIGN-GAP candidates (rows from 52), migration verdict (none), triggered follow-ups, 6 autonomous decisions |
| `context/changes/drawn-widget-tasks-e3-e4/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/drawn-widget-tasks-e3-e4` (observed) |
| `git merge-base HEAD main` | `b57433c` (observed) |
| `grep -rn "'select'\|'drag'" src/data/curriculum/` | 2 select skills (`E1.6.even_odd_select_10`, `E3.7.select_even_30`), 0 drag (observed) |
| `grep -rn "Trigger:" context/archive/*/follow-ups/review-fixes.md` filtered for S-13/select/drag/M6 | 4 entries, all tabled in change.md (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main b57433c per contract: unit 1247 passed, e2e 37 passed — inherited, unverified) |

No deliberate break: nothing testable was changed.

## 4. Next command

`/10x-research drawn-widget-tasks-e3-e4`

## 5. Open

- Research questions (from change.md): how `TaskScene` (`drawPrompt`, `hideTaskLayer`, `RoundView.input`) gets a
  drawing area beside the keypad and above the tiles; effect of 5 newly playable steps on `src/core/curriculum.ts`
  (`playableSteps`, `calendarStart`, `floorToCalendar`, `skillBuckets`, `unlockReady`) and `src/core/round/pick.ts`
  `firstPlayableSteps` (warm-up); reducer pattern for `select`/`drag` (model: `src/core/longPress.ts`,
  `src/core/roomGesture.ts`); e2e hook targets (`src/testing/e2eHook.ts`, interior points).
- Triggered follow-ups in scope: `select`/`drag` UI (task-round-stars), `roundView` input mode on `Task`
  (task-round-stars), `TaskScene.snapshot` answer copy (task-round-stars). Out: BONDS pairs / CHOOSE_OP picture
  (generators-remaining-stages) → re-trigger to S-13b or S-14 at archive.
- Roadmap: proposed new item S-13b `drawn-grid-tasks-e3-e4` (PUZZLE_GRID, GRID, PERIMETER, clock set by drag) — to be
  recorded through `/10x-roadmap` or at archive; not written yet.
- DESIGN-GAP candidates (not yet in `docs/design-gaps.md`): picture beside keypad, bar chart, `select` view (rev. row 7),
  `drag` view, hint on a drawing.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Scope split — S-13 = drawing infrastructure + CLOCK (read), LENGTH, PLACE_VALUE (read + build by drag), DATA,
   `select` and `drag`; rejected the full set (≈12–14 phases) and CLOCK-only. Reverses if research shows phases are
   smaller (pull grid + PERIMETER back within 9 phases) or `drag` too big (move to S-13b).
2. `drag` only for PLACE_VALUE "build"; clock-hand drag rejected (angular gesture). Reverses if plan-review finds the
   build without "take back" frustrating, or `drag` moves out.
3. DATA in scope although not in ZADANIA § 7 group 2 (code-drawn, keeps E3.4 non-empty). Reverses if the missing kit
   reference blocks the visual gate.
4. Number line, written column, graphs out (no E3–E4 step needs them; S-14 has "full set per stage"). Reverses if the
   plan adopts a number line as an ADD_SUB hint drawing within the phase limit.
5. No save migration (mastery keyed by skill id, `validateSave` checks shape only). Reverses if per-task drag/select
   state had to be saved — rejected.
6. Next step `/10x-research` (fixed by the orchestrator; also warranted by the TaskScene/curriculum unknowns).
