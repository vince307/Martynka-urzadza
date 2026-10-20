# Follow-ups — playtest-fixes-f01-f03

## FR-009 contradicts the new auto-read default
PRD FR-009 (`context/foundation/prd.md`) says auto-read is on for E1-E2; the code (maintainer decision 2026-10-20, F-01) has it off for every stage (`autoReadStages` `[]`).
Trigger: next `/10x-prd` refresh.

## Audit items re-recorded (M-1, M-2, M-13, H-3, H-4)
M-1 (`TaskScene.applyParentStage`), M-2, M-13, H-3 and H-4 of the earlier audits touch the `TaskScene` round lifecycle and the narrator, which this change only extended (`backToAge`, auto-read default); none was fixed here.
Trigger: next change to the `TaskScene` round lifecycle or the narrator.

## WelcomeScene guards F4 / F6
Closed in code by this change's phase 6 (`backToAge` cleans up, nulls the learner, flushes, stops UI and Room before the welcome scene starts). Nothing left to do.
Trigger: none (closed); reopen only if a playtest shows a double welcome.

## E1/E2 parent path silent until the first tap
Moot after F-01: auto-read is off for every stage, so there is no stage-dependent silence to explain.
Trigger: none (moot); revisit if auto-read is ever defaulted on again.

## Settings hint on every tap vs once
The gear hint shows on the first ordinary tap only (`REGISTRY_KEYS.settingsHintShown`).
Trigger: a playtest note that a parent missed the hint.

## Finer type key for the variety rule
`byType` in `src/core/round/variety.ts` keys on the generator type, so set-the-clock and read-the-clock count as one kind.
Trigger: the maintainer counts set-the-clock and read-the-clock as different kinds.

## One predicate for playable steps
`firstPlayableSteps` (`src/core/round/pick.ts`) and `playableSteps` (`src/core/curriculum.ts`) filter steps by the same predicate; merging them would move the warm-up pools that the "uncapped = `pickSkills`" oracle in the phase 2 tests compares against, so it stays deferred.
Trigger: next change to the warm-up pools or to `stepPlayable`.
