# Handoff — `adaptive-curriculum` (slice S-07)

Written by the `/10x-new` step: the change folder and `change.md` (status `new`) exist, nothing else. The next agent
must not pull S-11 forward: adaptation state is session-only, shaped as `LearnerState` fields on the registry learner
(change.md Autonomous decisions 1), and the warm-up keeps `pickSkills` while normal rounds get the weighted picker
(decision 2).

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | 1 on top of `fd68216` (`docs(adaptive-curriculum): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/adaptive-curriculum/change.md` | Change identity: notes and sources, roadmap claims vs repo now (9 rows), design binding (kit `unlock.png`, `.unlock-card` in `maths.css`, DESIGN-GAP candidates a–b), migration (none), triggered follow-ups (5, with scope), 6 autonomous decisions, open questions for research |
| `context/changes/adaptive-curriculum/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/adaptive-curriculum` |
| Repo checks behind the claims table | read in this step: `src/core/round/pick.ts` (`pickSkills` uniform with repeats over all steps, `buildRound`, `firstPlayableSteps`), `src/core/round/warmup.ts` (`buildWarmup`, `warmupResult`), `src/core/round.ts` (`RoundState.outcomes`), `src/core/placement.ts` (`SessionLearner`, type import from `src/data/placement.ts`), `src/core/types.ts` (`LearnerState`), `src/data/balance.ts`, `src/data/curriculum/index.ts` + `E3.ts`, `src/scenes/TaskScene.ts` (`create`, `freshRound`, `finishWarmup`, rng = `Date.now()`), `src/testing/e2eHook.ts`, `tests/e2e/task-round.spec.ts` (answers read from the hook); kit `screenshots/unlock.png`, `preview.js`, `maths.css` |
| Playable skills per step (script in `$TMPDIR`, `node --import tsx`, stages × `getGenerator` × `answer`) | e.g. E3 `1:2 2:2 3:0 4:0 5:0 6:1 7:2/3 8:1 9:2 10:3 11:2`; empty steps in every stage → the current-step pointer must skip them |
| Gates (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed (baseline in the contract: main at fd68216, unit 767, e2e 14) |

## 4. Next command

`/10x-research adaptive-curriculum`

## 5. Open

- Open questions for research: `change.md` § Open questions for /10x-research (where `TaskScene` updates the learner
  vs "Do pokoju"; "most skills" `>` or `≥` 0.5; previous-stage bucket; prompt uniqueness pool size and retry limit;
  child-facing step names; e2e hook `screen: 'unlock'` and whether an unlock e2e through the product is feasible;
  F5 interfaces in `core` vs the ESLint boundary rules).
- Future `[human]` rows the plan must carry: session-only adaptation until S-11 (decision 1, strengthens the S-06
  "early save" follow-up); easing by weights instead of "mniejszy zakres, tryb z obrazkami" (decision 4, PRD deviation);
  no stage auto-advance (decision 5); teacher read of child-facing step names and „Nowa umiejętność!”.
- DESIGN-GAP candidates (to `docs/design-gaps.md` when built): narration of the unlock card; the card after
  „Do pokoju” instead of „Kolejna runda”.
- Triggered follow-ups in scope: duplicate prompt in a round (narrator-round-summary archive), duplicate prompt in the
  warm-up and F5 `PlacementData` interface in core (first-launch-placement archive). Moved out: ` = ?` after
  expressions → re-trigger S-16 (plan writes it into this slice's `follow-ups/review-fixes.md`).

## 6. Autonomous decisions

Full text in `change.md` § Autonomous decisions; summary with reversal conditions:

1. Persistence until S-11: `SessionLearner` grows to full `LearnerState` (+ easing fields added to the type), pure
   updaters, registry only; every cold start resets steps and mastery. Rejected: localStorage, pulling S-11, scene
   fields. Would change if the maintainer triggers the S-06 "early save" follow-up — same object goes to `core/save.ts` v1.
2. Weighted picker in `src/core/curriculum.ts` replaces `pickSkills` for normal rounds only; warm-up unchanged except
   prompt uniqueness; no e2e seed or balance override. Would change if research finds a spec that can hit the unlock
   card — then it passes it via a hook target.
3. „Nowa umiejętność!” = `UnlockCard` widget in `TaskScene` (kit `unlock.png`), shown after „Kolejna runda”, „Dalej”
   starts the next round. Rejected: new scene, DOM overlay, mid-round card. Would change if `TaskScene` is too tangled.
4. Easing = easing weights for N rounds after two weak rounds (< 3/5 first try), no `params` rewrite, no picture mode,
   no unlock while easing. Would change if the author wants literal smaller ranges (easy skills in step data).
5. No unlock past the last playable step and no stage auto-advance (parent's job, S-08). Would change if the author
   wants stage promotion.
6. Next step is research (step prompt), not the skill's default plan; clipboard skipped (non-interactive).
