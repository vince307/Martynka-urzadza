# Handoff — `first-launch-placement` (slice S-06)

Written by the `/10x-new` step: the change folder and `change.md` (status `new`) exist, nothing else. The next agent
must not pull S-11 forward: placement is session-only until S-11 (change.md Autonomous decisions 1), and the
adult gate is a DOM overlay with logic in `src/core/` (decision 2).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | 1 on top of `37a9a62` (`docs(first-launch-placement): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-launch-placement/change.md` | Change identity: notes and sources, roadmap claims vs repo now (11 rows), design binding (kit `welcome.png`, DESIGN-GAP candidates a–e), migration (none), triggered follow-ups (`pl.title` + bare widget numbers), 5 autonomous decisions, open questions for research |
| `context/changes/first-launch-placement/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/first-launch-placement` |
| Repo checks behind the claims table | read in this step: `src/main.ts` (scene list), `src/scenes/BootScene.ts` (`create` starts `SCENE_KEYS.task`), `src/scenes/TaskScene.ts` (`create` uses `balance.defaultStage`, `defaultAutoRead`, `freshRound` → `buildRound`), `src/core/round/pick.ts` (`pickSkills`), `src/core/round.ts` (`startRound` slices to `rules.length`), `src/data/balance.ts`, `src/core/types.ts` (`LearnerState`), `src/storage/` (empty), `package.json` (no `idb-keyval`), `src/data/curriculum/E1.ts` (tiles default) |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline in the contract: main at 37a9a62, unit 671, e2e 8) |

## 4. Next command

`/10x-research first-launch-placement`

## 5. Open

- Open questions for research are listed in `change.md` § Open questions for /10x-research (scene transitions,
  DOM overlay over the `Scale.FIT` canvas and the iPad keyboard, warm-up composition and threshold, month bands as
  data, e2e hook `screen: 'welcome'` and a shared "pass the welcome" helper for `tests/e2e/task-round.spec.ts` and
  `tests/e2e/narrator.spec.ts`).
- Future `[human]` rows the plan must carry: session-only placement until S-11 (decision 1); PRD Open Question 1
  answer (decision 4); teacher read of every new Polish string (gate, parent panel, stage descriptions).
- DESIGN-GAP candidates (to `docs/design-gaps.md` when built): ask-a-parent screen, adult gate, parent stage panel,
  warm-up entry/outcome, picture mode for age 6.
- Triggered follow-up in scope: `pl.title` (Welcome brand) and bare numbers in `Keypad.paintButton`/`paintField`,
  `RoomSwitchButton.draw`, `TaskScene` (`ANIMATION.shakeMs / 6`) — from
  `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`. Also taken: e2e hook
  `targets.nextRound`/`toRoom` → `null` while the room is open (the hook changes anyway).
- Test plan has no first-launch risk id: follow-up for `/10x-test-plan refresh` when the plan writes its e2e spec.

## 6. Autonomous decisions

Full text in `change.md` § Autonomous decisions; summary with reversal conditions:

1. Persistence until S-11: session-only placement result in the game registry shaped like `LearnerState` fields;
   welcome every app start. Rejected: `localStorage` now (unversioned second format), pulling S-11 in. Would change
   if the maintainer wants daily production play before S-11 → an explicit early S-11 sub-slice in the roadmap.
2. Adult gate: 2-digit × 2-digit product, pure logic in `src/core/`, DOM overlay in `src/ui/dom/` reused by S-08 and
   S-12; wrong answer = new problem, no lockout. Rejected: PIN/password, hold-to-enter, number words, canvas gate.
   Would change if playtest shows the child solves it, or the DOM overlay breaks touch/scale on iPad.
3. Stage seam: registry learner object replaces `balance.defaultStage` (removed); `TaskScene` reads it, so
   `defaultAutoRead` and `buildRound`/`pickSkills` follow unchanged; warm-up = same round machinery with 6-task rules.
   Would change if a warm-up mode in `TaskScene` gets too tangled with the summary/room flow.
4. PRD OQ 1: warm-up skipped when the parent changed the stage; runs (down by at most one stage) when the parent
   only confirmed the age proposal. Would change if the author answers OQ 1 differently.
5. Next step is research (step prompt), not the skill's default plan; clipboard skipped (non-interactive).
