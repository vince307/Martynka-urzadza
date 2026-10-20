---
date: 2026-10-20T16:23:14+02:00
researcher: Claude (autonomous run 2026-10-20-playtest-boot, /10x-research step)
git_commit: fea1184d9f003e4ffb3f21adf4fd4fa58a5c286b
branch: feat/playtest-fixes-f01-f03
repository: Martynka-urzadza
topic: "Playtest fixes F-01..F-03: auto-read default, gear tap hint and 'Wróć' to the age choice, round variety rule"
tags: [research, narrator, longPress, UIScene, TaskScene, WelcomeScene, placement, save, pick, warmup, curriculum]
status: complete
last_updated: 2026-10-20
last_updated_by: Claude (autonomous run 2026-10-20-playtest-boot)
---

# Research: Playtest fixes F-01..F-03

**Date**: 2026-10-20T16:23:14+02:00 · **Git Commit**: `fea1184` · **Branch**: `feat/playtest-fixes-f01-f03` · **Repository**: Martynka-urzadza

## Research Question

From `change.md` (PA-1..PA-6 maintainer decisions, D-1..D-7, handoff § 5): (1) every test that pins the old auto-read
default or the muted gear; (2) the `longPress` tap path and `UIScene.feed`; (3) how "first round finished" can be
derived from v4 data and how a "Wróć" exit from `TaskScene` to `WelcomeScene` works without committing half a round
(stars, autosave, mastery; audit M-1/M-2/M-13); (4) what a "task type (generator)" is, how many types the current
steps have, how the round and warm-up draws work and where a variety rule plugs in without changing the 60/30/10
shares or the unlock threshold. Research only, no product code. Lessons file: `context/foundation/lessons.md` does not
exist (checked), nothing applied.

## Summary

- **F-01** is one value: `balance.narrator.autoReadStages` → `[]`. Its three readers (`TaskScene` getter `autoRead`,
  `RoomScene` reading after the room, `UIScene.openSettings` `autoReadDefault`) all take the list from `balance`.
  **No test pins the balance value**: `tests/narratorVoice.test.ts` (`defaultAutoRead`, `effectiveAutoRead`) passes its
  own local `stages = ['E1','E2']`, so it stays green and stays valid as a test of the rule; the e2e narrator specs run
  on E3 (`passWelcome` parent path) and assert silence, which still holds. The plan should add one unit assertion
  pinning `balance.narrator.autoReadStages` to `[]` (nothing guards it today). Docs to edit: `Martynka-urzadza.md`
  (Założenia "lektor … domyślnie włączone dla E1–E2" and the task-screen bullet "`settings.autoRead`, domyślnie
  włączone dla E1–E2, wyłączone od E3") and PRD FR-009 (same sentence, plus its Socrates note).
- **F-02 (a)**: the muted look is only tokens: `HUD_LAYOUT.settings.alpha: 0.7` and `iconColor: 0x8fb0a8` in
  `src/data/layout.ts`, drawn by `SettingsIcon.draw`. No test asserts those tokens. The `longPress` reducer has no tap
  outcome: from `holding`, an `up` of the same finger returns `idle()` with `fire: false`; drift over `moveTolerance`
  also goes to `idle` first, so "an `up` that arrives while still `holding`" is exactly a tap (short and steady). The
  `up` event carries no time, and none is needed: `holding` ends at `holdMs` on a `tick`. The e2e test
  `parent-settings.spec.ts` "#14 only a 2-second hold …" taps the gear and asserts the gate is absent — still true with
  a hint, and the natural place to assert the hint. `roomGesture.ts` reuses `longPress`, so a new result field must be
  additive (e.g. `tap: boolean`) and ignored there.
- **F-02 (b)**: a v4 save with `learner: null` and stars/rooms is valid (`saveProblem` checks the learner only when it
  is non-null; frozen fixture `tests/fixtures/save-v2-legacy-salon.json` already carries `stars: 3`, `learner: null`).
  **Correction to D-2**: the warm-up also writes `history` (`endRound(…, 'warmup')` calls `recordRound` before its
  early return), so "history non-empty" is not "first ordinary round finished". The v4 signal is
  `variants.roundsSince` (raised by `afterRound('round')` at every finished ordinary round), plus a `history` length
  fallback for v1-migrated saves. "Wróć" = cleanup + `registry.set(learner, null)` + `flush('now')` + stop UI/Room +
  `scene.start(welcome)`; it never calls `advance`/`finishRound`, so no mastery/history/easing/variants are written
  (the M-13 rule, deliberately); stars earned per answer stay.
- **F-03**: "type" = `SkillDef.type` (the generator key; `Task` has only `skillId`). Measured over the playable steps
  (62): 15 have one type in the current bucket, 17 have two, 30 have three or more. Today 41.9 % of simulated rounds
  have > 2 tasks of one type and 59.7 % have a same-type neighbour. The rule fits inside the skill choice after the
  bucket roll (shares unchanged), plus a deterministic reorder; the warm-up keeps its two halves.

## Detailed Findings

### F-01 — automatic reading default

- `src/data/balance.ts` `balance.narrator.autoReadStages: ['E1', 'E2']`.
- `src/core/narration/voice.ts` `defaultAutoRead(stageId, stages)` = `stages.includes(stageId)`;
  `effectiveAutoRead(settings, stageId, autoReadStages)` = `settings.autoRead ?? defaultAutoRead(…)`.
- Readers (complete grep of `autoReadStages|effectiveAutoRead` in `src/`): `TaskScene` getter `autoRead`;
  `RoomScene` (reading after the room, guarded by `settings && learner`); `UIScene.openSettings`
  (`autoReadDefault: (stage) => effectiveAutoRead({ autoRead: null }, stage, readStages)`), which the panel uses in
  `src/ui/dom/settingsPanel.ts` (`chosenReading ?? autoReadDefault(chosenStage)` sets `aria-pressed`). With `[]` the
  panel shows "Wyłączone" pressed for every stage when no choice is saved — correct by construction.
- Tests touching the default (grep of `autoRead|spoken|narrat` in `tests/` and `tests/e2e/`):
  - `tests/narratorVoice.test.ts` `describe('defaultAutoRead')` "is on for E1 and E2 and off from E3 on" and
    `describe('effectiveAutoRead')` — local `stages` constant, not `balance`; unaffected.
  - `tests/e2e/narrator.spec.ts` "#narrator the game is silent when the first E3 round opens…" — E3, asserts silence;
    unaffected (could gain an E1/E2 silence case, see Open Questions).
  - `tests/e2e/parent-settings.spec.ts` "#14 … the auto-read choice survives the next stage change" — taps
    "Włączone" explicitly and expects `true`; unaffected.
  - `tests/e2e/review-round.spec.ts`, `save-transfer.spec.ts` seed `settings: { autoRead: null }`; neither asserts
    speech.
  - No test reads `balance.narrator` (grep `balance.narrator|narrator.autoRead` in `tests/`: none) → add one.
- Follow-up "E1/E2 parent path silent until the first canvas tap" (first-launch-placement) becomes moot with no
  default auto-read (change.md table).

### F-02 (a) — gear look and tap hint

- `src/data/layout.ts` `HUD_LAYOUT.settings`: `fill 0xfff5df`, `borderColor 0xd8bd73`, `iconColor 0x8fb0a8`,
  `alpha 0.7`, position `left 1782, top 952`, 96×96. Neighbouring HUD tokens: `HUD_LAYOUT.speaker`
  (`fill 0xfffdf2`, `borderColor 0xd3b77d`, `border 5`), `HUD_LAYOUT.roomSwitch`. Comment above the token cites
  DESIGN-GAP rows 25 and 28 (`docs/design-gaps.md`): row 25 "A muted gear …", row 28 "No feedback while held".
  Last row is **150**, so new gaps start at **151**.
- `src/ui/widgets/SettingsIcon.ts` `SettingsIcon`: class doc "muted, label-free, no feedback while pressed";
  `draw` applies `alpha` to fill, border and gear stroke. Handlers `down/up/out` only forward pointer events.
- `src/core/longPress.ts` `longPress(state, event, rules)` → `{ state, fire }`:
  - `idle` + `down` → `holding {id, x, y, since}`;
  - `holding` + `up` (same id) → `idle()`, `fire: false` ← the tap path;
  - `holding` + `move` over `moveTolerance` (Euclidean from the start point) → `idle()` (so a later `up` is ignored
    in `idle`: a drifted press is never a tap);
  - `holding` + `tick` with `now - since >= holdMs` → `fired`, `fire: true`; `fired` + `up` → `idle`;
  - `cancel`/`reset` → `idle` from any state; a second finger `down` → `idle`.
  So a tap outcome = "`up` of the held finger while `holding`". Existing tests `tests/longPress.test.ts` include
  "a short tap (down, up) never fires" — the new field must keep `fire: false` there.
- Callers: `UIScene.feed` (`next = longPress(this.hold, event, balance.parentSettings)`; on `fire` →
  `openSettings`), fed by `SettingsIcon` handlers (`up` → `cancel` when `pointer.wasCanceled`, `out` → `cancel`) and
  `update` ticks with `this.time.now`. Second caller: `src/core/roomGesture.ts` (imports `longPress`, `IDLE`) — an
  additive `tap` field leaves it unaffected.
- `UIScene.openSettings` returns early when `!learner || !suspender || this.session?.active()`; the hint must not
  open an input session (D-4; follow-up F5 only joins if the hint suspends input).
- The gear exists over the task and the room scenes, not on the welcome screen (gap row 25).
- E2E: `tests/e2e/parent-settings.spec.ts` "#14 (proposed) only a 2-second hold on the settings icon opens the adult
  gate…" does `tapScene(page, icon)` then `expect(gate).toHaveCount(0)` — stays green; `tests/e2e/support/welcome.ts`
  `openSettings` holds `HOLD_MS + 300` (unaffected). The hook would need a hint field (e.g. `settingsHint: boolean`)
  in the HUD part of the snapshot to assert it.

### F-02 (b) — "Wróć" to the age choice

**Learner model.** `src/core/types.ts` `LearnerState` (`history` "last ~200"), `Adaptation`, `SavedLearner`
(+ `warmupPending`, `pendingUnlock`); `src/core/placement.ts` `PlacedLearner`, `SessionLearner`, `needsPlacement`
(= `learner === null`).

**Who writes `history`.** `recordRound` (`src/core/mastery.ts`) is the only writer (skips `outcome === null`, trims
to `balance.mastery.historyLength` 200). It is called from `endRound` (`src/core/curriculum.ts`), which records first
and then `if (kind === 'warmup') return { adaptation: next, unlocked: null }` — so **the warm-up writes up to
`balance.warmup.length` (6) history entries and mastery**. `endRound` is called from `TaskScene.finishRound` only
(once per round, at "Dalej" after the last task); `finishWarmup` then sets `warmupPending: false` and maybe lowers the
stage. Variant rounds never reach `endRound`.

**"First ordinary round finished" from v4 data (no new field).** `src/core/variants.ts` `afterRound`: `kind ===
'round'` → `roundsSince + 1`; a variant resets `roundsSince` to 0 but sets `lastMinigame`/`puzzleDay`/`puzzlesDone`.
`TaskScene.finishRound` counts only non-warm-up ordinary rounds. A variant needs `everyRounds` ordinary rounds first,
so it cannot precede the first ordinary round. Recommended pure predicate in `core/` (e.g. `firstRoundDone`):

```
variants.roundsSince > 0 || variants.lastMinigame !== null || variants.puzzleDay !== null
  || variants.puzzlesDone.length > 0 || learner.history.length > balance.warmup.length
```

The history clause covers v1 saves lifted by `MIGRATIONS[1]` with fresh variants (`roundsSince` 0 for a long-playing
child). Known edge: a v1 child placed without a warm-up with exactly one finished round (≤ 5 entries) would still see
"Wróć" — acceptable (D-2 reversal condition does not fire: the derivation works, it just reads `variants`). Because
"Wróć" writes nothing of the round, the predicate stays false after a "Wróć", and survives a reload mid-round.

**Save.** `src/core/save.ts` `saveProblem` checks `learner !== null && !validLearner(…)`; `encodeSave` writes
`learner: null`; `main.ts` calls `floorToCalendar` only when a learner exists; `BootScene` starts `WelcomeScene` when
the registry learner is missing or null. Fixture precedent: `tests/fixtures/save-v2-legacy-salon.json`
(`stars: 3`, `learner: null`). **Save format v4 is enough** (PA-6 holds).

**Scene flow.** `WelcomeScene.start` builds `{...placed, ...startLearning(...), pendingUnlock: null}`, calls
`resumeInput()`, `registry.set(learner)`, `scene.start(task)`; `WelcomeScene.create` resets `chosen`, `buttons` and
dialog state, so re-entry is safe. `TaskScene.create` calls `scene.launch(SCENE_KEYS.ui)`; `RoomScene` is entered by
`scene.switch` and sleeps afterwards. No scene returns to the welcome today. A "Wróć" exit must, in order:
1. cleanup as in `applyParentStage` (narrator `cancel`, drag reset via `feedDrag({type:'reset'})`, `endFlyingStars`,
   camera tween kill; registry `narration`, `roomSwitch`, `hudTitle` cleared);
2. `registry.set(REGISTRY_KEYS.learner, null)` — `set`, not `remove`: the autosaver listens to `setdata`/`changedata`
   (`main.ts`), its snapshot reads `?? null`;
3. `saver.flush('now')`;
4. `scene.stop(SCENE_KEYS.ui)` (its shutdown closes any dialog and its input session) and stop `SCENE_KEYS.room` if
   it is running or asleep (else "Do pokoju" would later wake a stale room);
5. `scene.start(SCENE_KEYS.welcome)`.

**Round lifecycle and the audit rows** (defined in
`context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md`):
- Stars are added **per answer** (`TaskScene.submit`/`advance` → `syncStars` → `earn` into `REGISTRY_KEYS.stars`,
  a `SAVE_KEYS` member), not at round end — so "Wróć" mid-round keeps the stars already earned (D-2 holds).
- `freshRound` builds without committing; `applyRound` is the single commit point (also resets `variantCounted`);
  `finishRound` = `endRound` → learner → `finishWarmup` or `countRound` → `flush('now')`.
- **M-1** (state changed before the new round is built): survives only in `applyParentStage` (sets `this.stage`
  before `freshRound()`). "Wróć" builds no round → no new M-1 hole.
- **M-2** (`advance` sets the finished state before `finishRound`/`endRound`): unchanged by "Wróć" provided the
  button is inert while `advance` runs (a single-threaded handler; no overlap).
- **M-13** (a stage change mid-round drops the round's answers, stars stay): this is exactly the intended "Wróć"
  rule. The audit rows stay deferred, re-recorded as follow-ups.
- Note: "Wróć" during the first ordinary round after a warm-up discards the warm-up's already-saved mastery/history
  together with the whole learner — consistent with D-2 (learner → `null`).

**Warm-up flow.** `TaskScene.create`: `this.warmup = learner.warmupPending && previousStage(stage) !== null` (E1 and a
parent-chosen stage have none); `freshRound` → `buildWarmup` (6 tasks); `SummaryPanel` centres 6 stars; after it,
"Kolejna runda" starts the first ordinary round (`kind 'round'`).

**Placement on screen.** HUD "Do pokoju" (`RoomSwitchButton`, `HUD_LAYOUT.roomSwitch` top-left 104,44, 316×104)
shows between tasks only (`roundView` `switchVisible: !state.finished && state.phase === 'done'`, also during the
warm-up). Occupied: dots top centre (`TASK_LAYOUT.dots`), speaker 1494,44, star counter, gear 1782,952, build id
bottom-left, notebook x 180–1740 / y 204–992 with feedback bar and "Dalej" inside. Free: the left margin
(x 0–180) under "Do pokoju", and the summary panel next to "Kolejna runda"/"Do pokoju" (`SUMMARY_LAYOUT.buttons`).
Reusable widgets: `PageButton` (as "Rodzic" on the welcome), `ActionButton`, `RoomSwitchButton`/`SpeakerButton`
(`src/ui/widgets/`). The kit (`designs/martynka-maths-A-v1/screenshots/task-tiles.png`, `task-keypad.png`,
`welcome.png`) has no back button → DESIGN-GAP row. E2E: hook `screen` values `'loading' | 'welcome' | 'task' |
'summary' | 'unlock' | 'room'` (`src/testing/e2eHook.ts`); a "Wróć" target must be added to the `TaskScene`
targets; helpers `passWelcomeAsChild(page, age, month)`, `passWelcomeAsParent` in `tests/e2e/support/welcome.ts`.

### F-03 — round variety

**Type.** `src/core/types.ts` `SkillDef.type` selects the generator (`getGenerator(skill.type)` in
`src/core/tasks/generateTask.ts`); `Task` carries only `skillId`. Finer keys exist (`params.variant` in CLOCK incl.
`set`, MASS/LENGTH/CAPACITY `text`, PLACE_VALUE, DATA, PERIMETER, …) but splitting by them cuts one-type steps only
from 15 to 10. Recommendation: plain `SkillDef.type` (matches "same generator", ZADANIA § 4 catalogue, and what a
child perceives), with a `typeOf` parameter so a finer key stays possible.

**Draw flow and rng order.** Ordinary round: `TaskScene.freshRound` → `buildAdaptiveRound` (`src/core/curriculum.ts`):
`skillBuckets` (current / earlier / previous, `currentGroups` on the review step E6.11), `withoutArtBlocked`
(`src/core/round/artFilter.ts`) and the picture filter (`pictureMode`) — both keep `minCurrent` =
`unlockThreshold(n, unlockShare)` and use no rng — then `pickRoundSkills` (`src/core/round/pick.ts`): per draw
`rng.next()` rolls the bucket by weight, then `rng.pick` a skill (review: `rng.pick` group, then skill). Then
`distinctTasks` (`src/core/round/unique.ts`) generates in order; duplicate redraws (`uniqueRetries`) and art redraws
(`balance.round.artRetries`, `visualArtIds`) consume rng after the picks. Warm-up: `buildWarmup`
(`src/core/round/warmup.ts`) = `pickSkills(previous, 3)` + `pickSkills(early, 3)` (uniform `rng.pick`), then
`distinctTasks`. Variants do not use the picker (word `drawRound` in `src/core/minigames/word.ts` has its own
`rng.pick`; puzzle `pickPuzzle`; dice `diceBoard`); `?e2eSkills` (`forcedSkills`) bypasses it.

**Does reordering break anything?** Mastery/unlock/results key by `skillId`; redraws are per task; review groups are
not ordered; minigame letters count finished tasks and are outside the picker. The one ordering constraint: the warm-up
halves (tasks 0–2 previous stage, 3–5 current), pinned by `tests/warmup.test.ts`. D-3's reversal condition does not
fire.

**Data** (one-off script over `playable` steps, not committed): one type in the current bucket — 15 steps: E1.6
(EVEN_ODD), E1.8, E1.10, E2.3, E2.4, E2.5, E3.3 (CLOCK ×3), E3.8, E4.2, E4.3 (CLOCK ×4), E4.5, E5.1, E5.6, E6.2,
E6.6; two types — 17 steps; three or more — 30 steps (E6.11 review: 17). The earlier bucket holds 0–19 types, the
previous bucket 15–24 (E1 has none). E1.1 has neither earlier nor previous skills (all 5 tasks from 3 types);
E2.1–E6.1 have no earlier bucket. Simulation of today's draw (2000 seeds per step): 41.9 % of rounds have > 2 of one
type, 59.7 % a same-type neighbour; worst E5.1 at 98 % (ADD_SUB in both current and previous); one-type steps
~70–80 %.

**Tests the rule could break.** `tests/curriculumPick.test.ts` (`pickRoundSkills` share tests with `count` 20000:
"E3 step 6: shares are 60/30/10…", "eased weights give 20/50/30…", "…renormalise to 6/7 and 1/7"; "every skill of
the current bucket gets drawn"; "E1 at its first playable step has only the current bucket"); `tests/pick.test.ts`
("draws from several skills…", "is deterministic for a seed"); `tests/review.test.ts` and `tests/reviewGuards.test.ts`
(review 90/10 shares, 20000 draws); `tests/warmup.test.ts` (halves by index); equality-of-two-paths tests in
`tests/artFilter.test.ts` and `tests/pictureMode.test.ts` (stay green if the rule is deterministic and consumes the
same rng on both paths). No snapshot tests, no test pins an exact rng sequence.

**Recommended design (keeps PA-4 invariants).** A new pure function (e.g. `pickVariedRound` in
`src/core/round/variety.ts`) called by `buildAdaptiveRound` and `buildWarmup`; `pickRoundSkills`/`pickSkills` stay
for the long-count share tests (a cap of 2 per type is meaningless at `count` 20000, so the rule is per round).
Per draw: roll the bucket exactly as today; inside the bucket pick uniformly among skills whose type is below
`maxPerType` (2) and differs from the previous draw's type; if empty drop "not previous"; if still empty take the whole
bucket. A bucket is never swapped, so shares and the current step's practice volume (`unlockReady`) are unchanged and
the rng is consumed the same number of times. Then a deterministic, rng-free reorder (greedy: most frequent remaining
type not equal to the previous) spreads e.g. 3 × ADD_SUB to positions 1, 3, 5; when impossible (4 of one type) repeats
are accepted. Warm-up: counts shared across the 6 picks, reorder only within each half, and try to make tasks 3 and 4
differ. Review step: filter inside the chosen group after `rng.pick(groups)`, fallback to the whole group. Numbers in
`balance.round.variety` (`maxPerType: 2`, `noRepeatInRow: true`). New seeded tests: over many seeds and every step, ≤ 2
per type and no neighbour pair whenever the buckets allow it; bucket shares over many rounds within a tolerance; warm-up
halves in place.

## Code References

- `src/data/balance.ts` `balance.narrator.autoReadStages`, `balance.parentSettings`, `balance.round`, `balance.warmup`, `balance.mastery.historyLength`
- `src/core/narration/voice.ts` `defaultAutoRead`, `effectiveAutoRead`
- `src/scenes/TaskScene.ts` getter `autoRead`, `freshRound`, `applyRound`, `beginRound`, `submit`, `advance`, `finishRound`, `finishWarmup`, `applyParentStage`, `syncStars`
- `src/scenes/UIScene.ts` `create` (SettingsIcon handlers), `update`, `feed`, `openSettings`
- `src/scenes/RoomScene.ts` (auto-read after the room), `src/scenes/WelcomeScene.ts` `start`, `create`; `src/scenes/BootScene.ts` (welcome vs task)
- `src/core/longPress.ts` `longPress`, `IDLE`; `src/core/roomGesture.ts`
- `src/ui/widgets/SettingsIcon.ts` `SettingsIcon.draw`; `src/data/layout.ts` `HUD_LAYOUT.settings`, `HUD_LAYOUT.speaker`, `HUD_LAYOUT.roomSwitch`, `SUMMARY_LAYOUT`
- `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (`autoReadDefault`)
- `src/core/curriculum.ts` `skillBuckets`, `buildAdaptiveRound`, `endRound`, `unlockThreshold`, `reviewWeights`; `src/core/mastery.ts` `recordRound`
- `src/core/round/pick.ts` `pickRoundSkills`, `pickSkills`; `src/core/round/warmup.ts` `buildWarmup`, `warmupResult`; `src/core/round/unique.ts` `distinctTasks`; `src/core/round/artFilter.ts` `withoutArtBlocked`
- `src/core/variants.ts` `afterRound`; `src/core/save.ts` `saveProblem`, `encodeSave`, `MIGRATIONS`; `src/core/placement.ts` `needsPlacement`, `changeStageByParent`
- `src/core/types.ts` `SkillDef`, `LearnerState`, `SavedLearner`; `src/core/tasks/generateTask.ts`
- Tests: `tests/narratorVoice.test.ts`, `tests/longPress.test.ts`, `tests/curriculumPick.test.ts`, `tests/pick.test.ts`, `tests/warmup.test.ts`, `tests/review.test.ts`, `tests/reviewGuards.test.ts`, `tests/artFilter.test.ts`, `tests/pictureMode.test.ts`; e2e `tests/e2e/parent-settings.spec.ts`, `narrator.spec.ts`, `first-launch.spec.ts`, `tests/e2e/support/welcome.ts`, `src/testing/e2eHook.ts`

## Architecture Insights

- Every default and number is data in `balance.ts`/`layout.ts`; scenes only read them, so F-01 and F-02 (a) are
  data-plus-docs changes, and the tests that matter are pinning tests on the data.
- Gestures are pure reducers fed by the scene clock (`longPress`, `roomGesture`, `trayDrag`); a new outcome belongs
  in the reducer with unit tests, the scene only reacts.
- The round has one commit point (`applyRound`) and one end point (`finishRound`); exits that skip `finishRound`
  write nothing but the per-answer stars — the property "Wróć" relies on.
- The draw is two layers: bucket weighting (shares, tested with long counts) and skill choice; the variety rule
  belongs to the second layer only.

## Historical Context (from prior changes)

- change.md D-2 "history non-empty after `finishRound`" — **contradicted** for the warm-up (`endRound` records before
  the warm-up early return); the derivation still works via `variants` (above), so D-2's runtime-flag fallback is not
  needed.
- change.md D-3 reversal ("reordering breaks review groups or minigames") — **not fired**: only the warm-up halves
  constrain order.
- change.md "a short tap goes `holding → up → idle` with `fire: false`" — **supported**.
- Audit M-1 "state before round" — **partial** (survives only in `applyParentStage`); M-2 and M-13 — **supported**
  (still open). Follow-up F5/F6/F4 status from change.md (F4/F6 closed in code) not re-checked here beyond change.md.
- CLAUDE.md "`buildWarmup` in `src/core/placement.ts`" — **contradicted**: `src/core/round/warmup.ts`.

## Related Research

Not applicable (no earlier research on these three areas beyond the archived S-05, S-07, S-08 changes cited in change.md).

## Open Questions (for /10x-plan; product choices, not missing evidence)

1. **"Wróć" for a parent-placed learner** (`stageOverriddenByParent` true, no warm-up): PA-3 is about the child
   correcting her own age. Recommendation: hide it when the stage came from the parent (the child did not choose an
   age; going back would undo the parent's choice). Would change: the maintainer wanting it on every first round.
2. **When "Wróć" shows within a round**: always during the warm-up and the first ordinary round (PA-3 "on the warm-up
   AND on the first round", mid-round drop = M-13 rule) vs between tasks only. Recommendation: visible during the
   whole round in the free left margin (x 0–180) so the child who sees a too-hard task can leave at once; between
   rounds the summary of the warm-up may also carry it. Decide in the plan with a DESIGN-GAP row.
3. **Gear hint placement/duration**: text bubble above/left of the gear (bottom right), duration in `balance`
   (e.g. `parentSettings.hintMs`), once per page load (D-4).
4. **An E1/E2 silence e2e case** for F-01 (narrator spec runs E3 only) — optional; a unit pin of
   `balance.narrator.autoReadStages` is the cheap guard.
