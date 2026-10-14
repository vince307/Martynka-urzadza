# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Written by the `/10x-research` step of run `2026-10-14-save-s13b-s15-s14b`. `research.md` answers the unknowns from
`change.md`; no product code changed. The next agent must not miss: the clock-set answer is the existing string
`formatTime(h, m)` (save stays v1), and the `drag` mode must branch by `task.visual.kind` in `TaskScene.render`
before any clock-set skill becomes playable — otherwise the child gets the block tray and is stuck in `retype` (S13-04).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4`, cut from `main` at `9554e96` |
| Commits | 2 on top of `9554e96` (`docs(drawn-grid-tasks-e3-e4): change identity (autonomous run)`, `docs(drawn-grid-tasks-e3-e4): research`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| Progress rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/drawn-grid-tasks-e3-e4/research.md` | research: drag wiring and S13-04, clock-hand gesture (reducer, snap, grab rule, geometry), answer model and retype trap S13-01..07, hint/solution content per type, number ranges (ZADANIA § 2–4 + recommendations where silent), unlock thresholds on live saves, design sources and DESIGN-GAP list, open choices for the plan |
| `context/changes/drawn-grid-tasks-e3-e4/change.md` | frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/drawn-grid-tasks-e3-e4/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/drawn-grid-tasks-e3-e4` (observed) |
| Docs-only step | no lint/typecheck/test/build run: no source file changed (baseline on main `9554e96` from the contract: inherited, unverified) |
| Anchor check | symbols cited in `research.md` grepped in this step (`parseClockParams`, `faceDistractors`, `unlockView`, `calendarStart`/`floorToCalendar`/`unlockReady`, `captureFirstWrong`, `validLearner`/`validExample`, `screenBound`/`UNBOUNDED_TYPES`, `firstHint`/`leaksAnswer`, `dragKinds`, `pointerupoutside` in `TaskScene.create`, `TASK_LAYOUT.picture`/`drag`, `ClockFace` `DIAL`, `adaptive.spec` `setTimeout(180_000)`) — all present |
| context7 Phaser 4 input | `/websites/phaser_io_phaser4` returned no input docs; checked `node_modules/phaser/types/phaser.d.ts` (4.2.1) instead — recorded as a low-impact gap |

## 4. Next command

`/10x-plan drawn-grid-tasks-e3-e4`

## 5. Open

- Plan choices (research § Open Questions): E3.5 magic + pyramid (recommended, threshold 1 → 2); E3.7 two GRID skills (recommended, 2 → 3); clock-set as `visual.kind: 'clock'` + `set` flag (recommended) vs a new kind; keypad solution with a grid — scale into `TASK_LAYOUT.picture.keypadSolution` (190 px) or grow it (visual gate).
- Unlock thresholds change (research § F table): E3.3 1 → 2, E3.11 2 → 3, E4.7 2 → 3, E3.5/E3.7 per choice, E4.3 stays 2; E5.12 and E6.3 become playable (need `childName`; `playableSteps`/`calendarStart` tests move). PR body must list them.
- Tests to update: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`, `tests/progress.test.ts`, `tests/artFilter.test.ts`, `tests/contentInvariants.test.ts`, `tests/e2e/drawn-tasks.spec.ts`, `tests/e2e/adaptive.spec.ts` (E4.3 clock-set branch in `answerRight`/`wrongAnswer`; 180 s limit).
- In scope from follow-ups: S13-01..04, S13-07 (`src/core/round.ts` `isCorrect`, `src/core/tasks/validate.ts` `validateTask`, `tests/generateTask.test.ts`, `TaskScene.render` `dragKinds`, `generateTask`); S13-08 test for the longest new picture prompt (`pictureLayout` `belowPrompt`); `pictureLayout` select/drag rect; `cancel` unit test for the new reducer (`pointerupoutside` → cancel is already wired in `TaskScene.create`); S13-09 pattern not copied into the clock reducer.
- DESIGN-GAP rows to add from 73 (`docs/design-gaps.md`): magic-square/pyramid cells; grid coordinate labels and items; side lengths on edges; clock-set handles, held state and "OK"; grid in the 190 px keypad solution rect.
- New nouns needed in `src/data/nouns.ts` (none present): e.g. bok, pole, kratka, wskazówka, kwadrat, prostokąt, trójkąt, plus GRID item names.
- Teacher read (`npm run sample -- E3|E4|E5|E6 --count 6`) is due in the implement phases. No `[human]` rows yet.

## 6. Autonomous decisions

1. **Research scope taken from `change.md` without asking.** Rejected: an interview (contract rule 1). Would change: nothing in this run.
2. **Clock answer = `formatTime` string, not `{h, m}` / minutes.** Rejected: object or minutes-since-12 (break `captureFirstWrong`, `validExample`, `solutionSteps`, would force save v2). Would change: a requirement to accept several hand positions as correct (then a `check` on the string set, still v1).
3. **Hands: E3 hour hand only; E4 minute hand snapped to `minuteStep`, hour hand picks the nearest `h + m/60` position, drawn coupled.** Rejected: fully geared real clock (whole minute turns to change the hour — slow for a child). Would change: a tablet test showing children expect the gear behaviour, or the visual gate showing the decoupled hour pick confuses.
4. **change.md decision 4 kept (E4.3 gets clock-set, 5-minute snap).** Evidence: in `TASK_LAYOUT.drag.mat` the 5-minute arc at the minute tip is ≈ 85 scene px with angle-only capture. Would change: the dial laid out smaller than ~1.2 scale (arc < ~65 px) or a tablet test with mis-snaps → E4.3 halves/quarters only.
5. **change.md decision 2 kept (PERIMETER in E5.12 and E6.3).** Evidence: kit `helper-metadata.json` `grid.verticesL` is a lattice polygon — the same model covers E4 rectangles and E6 composite figures. Would change: the plan exceeding ~10 phases → E6.3 to a follow-up with `Trigger: S-14c`.
6. **Ranges where ZADANIA is silent recommended, not invented as fact** (magic sum ≤ 30 in E3, grid 5 × 4, E4 sides 1–20 with perimeter ≤ 100, E6 1 cell = 1 cm). Would change: the author's teacher read or a ZADANIA update.
7. **context7 gap accepted** (no Phaser 4 input docs; typings checked). Would change: an input regression in the visual gate on the device.
