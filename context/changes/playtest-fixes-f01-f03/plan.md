# Playtest fixes F-01..F-03: narrator off by default, a gear that answers a tap, "Wróć" to the age choice, round variety — Implementation Plan

## Overview

Slice 1 of autonomous run `2026-10-20-playtest-boot` (non-roadmap fix, source `docs/playtest-feedback.md` F-01, F-02,
F-03). The maintainer's decisions are fixed in `context/runs/2026-10-20-playtest-boot/scope.md` § 1 and copied in
`change.md` as PA-1..PA-6; this plan implements them and does not re-decide them:

- **F-01** — automatic reading is OFF by default for every stage (`balance.narrator.autoReadStages` = `[]`); the parent
  can still switch it on (`Settings.autoRead`, `effectiveAutoRead`).
- **F-02 (a)** — the settings gear no longer looks disabled; the first ordinary tap shows "Przytrzymaj, żeby otworzyć
  ustawienia rodzica"; the adult gate and the 2 s hold stay.
- **F-02 (b)** — a "Wróć" button back to the age choice on the warm-up and on the first round, until the child has
  finished her first round.
- **F-03** — a round has at most 2 tasks of one type (generator), never two of the same type in a row; the rule
  relaxes when a bucket has too few types, the 60/30/10 shares and the unlock threshold stay; the warm-up too.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`, every frozen fixture `tests/fixtures/save-v*.json`
untouched). How each piece avoids a format change:

| piece | what it stores | why v4 is enough |
|---|---|---|
| F-01 | nothing new; `Settings.autoRead` (`boolean \| null`) keeps its shape | only the default behind `null` changes, in `balance.ts` |
| F-02 (a) | runtime registry key `REGISTRY_KEYS.settingsHintShown` (never in `SAVE_KEYS`) | a per-page-load flag |
| F-02 (b) | `learner: null` after "Wróć" | `saveProblem` checks the learner only when non-null; fixture `tests/fixtures/save-v2-legacy-salon.json` already holds `stars: 3`, `learner: null`; "first round finished" is derived from saved `variants` + `history` (no new field) |
| F-03 | nothing | only the skill choice and order of a round change |

**A phase that finds it must change what is saved, or the meaning of a saved field, stops with `STATUS: BLOCKED`**
(scope.md hard limit: a v5 need stops the ship at an open PR).

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and re-checked on this branch at
`8a884c1`:

- **F-01**: `balance.narrator.autoReadStages: ['E1', 'E2']` (`src/data/balance.ts`); readers `TaskScene` getter
  `autoRead`, `RoomScene` (reading after the room), `UIScene.openSettings` (`autoReadDefault` for the panel's On/Off).
  `tests/narratorVoice.test.ts` uses its own local `stages` list; **no test pins the balance value**.
- **F-02 (a)**: `HUD_LAYOUT.settings` in `src/data/layout.ts` carries the muted look (`alpha: 0.7`,
  `iconColor: 0x8fb0a8`), drawn by `SettingsIcon.draw` (`src/ui/widgets/SettingsIcon.ts`, class doc "muted, label-free,
  no feedback while pressed"); DESIGN-GAP rows 25 and 28 describe it. `longPress` (`src/core/longPress.ts`) returns
  `{ state, fire }`; a tap (`holding` + `up` of the same finger) ends as `idle` with no signal. Second caller
  `src/core/roomGesture.ts`. `UIScene.feed` drives it from `SettingsIcon` handlers and `update` ticks.
- **F-02 (b)**: `BootScene` starts `WelcomeScene` when `needsPlacement(learner)` (`learner === null`), never again
  afterwards. `WelcomeScene.create` resets its state, so re-entry is safe. `TaskScene.create` launches `SCENE_KEYS.ui`;
  `RoomScene` is entered by `scene.switch` and sleeps. Stars are added per answer (`syncStars` → `REGISTRY_KEYS.stars`);
  `finishRound` is the only writer of mastery/history (`endRound` → `recordRound`), and the warm-up writes history too
  (research correction to D-2). `afterRound('round')` raises `variants.roundsSince` at every finished ordinary round;
  `PlacedLearner.stageOverriddenByParent` is saved. `PageButton` (`src/ui/widgets/PageButton.ts`, fires on `pointerup`
  only when the press began on it) is the welcome's "Rodzic" button and takes a size.
- **F-03**: `buildAdaptiveRound` (`src/core/curriculum.ts`) → `pickRoundSkills` (`src/core/round/pick.ts`: per draw one
  `rng.next()` for the bucket, then `rng.pick` a skill — review step: `rng.pick` a group, then a skill) →
  `distinctTasks` (`src/core/round/unique.ts`, generates in skill order, redraws the same skill). `buildWarmup`
  (`src/core/round/warmup.ts`) = `pickSkills(previous, 3)` + `pickSkills(early, 3)` (uniform, with repeats) →
  `distinctTasks`. `rng.pick` is one `int` = one `next()` whatever the list length (`src/core/rng.ts`). Measured
  (research): 15 of 62 playable steps have one type in the current bucket; 41.9 % of today's rounds have > 2 tasks of a
  type, 59.7 % a same-type neighbour.
- `docs/design-gaps.md` ends at row 150. `context/foundation/lessons.md` does not exist (nothing to apply).
- **Baseline**: the contract now records `main` at 64fd3ea (unit 3656, e2e 139); every phase still measures its own
  branch baseline before its first edit and writes `baseline + delta`.

## Desired End State

- A fresh E1 or E2 child hears nothing until she taps the speaker; the settings panel shows "Wyłączone" pressed for
  every stage until the parent chooses; a parent's "Włączone" works as today.
- The gear looks like the other HUD buttons (full opacity, regular icon colour); the first short tap of a page load
  shows the hint bubble for `balance.parentSettings.hintMs`; later taps show nothing; only the 2 s hold opens the
  adult gate.
- During the warm-up (E2–E6) and the first ordinary round (every stage), a child who chose her own age sees "Wróć" in
  the left margin; it takes her to the age choice with her stars kept and nothing of the open round written; once she
  has finished her first ordinary round (or when the parent set the stage), the button is gone, also after a reload.
- Over many seeds and every playable step, a round has at most 2 tasks of one type unless the rolled bucket held no
  other type at that draw, has no same-type neighbours whenever at most 3 of 5 share a type, and draws its buckets
  exactly as before (same bucket per draw for the same seed); the warm-up keeps its halves.
- Verify: unit tests per phase (red first), the full local gate, e2e `+ 0` in code phases, `+ 1` and `+ 1` in the e2e
  phases 8 and 9.

### Key Discoveries:

- `rng.pick(list)` consumes exactly one `next()` for any non-empty list, so picking from a filtered list keeps the rng
  stream aligned with `pickRoundSkills` draw by draw: the bucket rolled at draw i is the same for the same seed. This is
  the oracle for "shares unchanged" (no long-count tolerance needed).
- `distinctTasks` generates in skill order and redraws the same skill, so the reorder must happen on the skill list
  **before** generation. The reorder itself is rng-free, but generation then runs in the new order, so the tasks
  differ from today's for the same seed: tests compare skills and buckets across the two pickers, never generated
  tasks.
- `scene.start(key)` from a scene's ScenePlugin shuts the calling scene down and starts `key`; `TaskScene`'s
  `shutdown` listener already removes its `game.events` handlers.
- `PageButton` already guards against a press that began elsewhere (the "Dalej" release) — the same guard protects
  "Wróć" from the release of an answer tap.

## What We're NOT Doing

- No save-format change, no new saved field, no change to `MIGRATIONS` or to any fixture.
- No change to the adult gate (`balance.parentGate`), the hold (`holdMs` 2000, `moveTolerance` 30) or gap 28 "no
  feedback while held".
- No variety rule for variant rounds (word, dice, puzzle do not use the picker) or for `?e2eSkills` forced rounds; no
  change to `pickRoundSkills`/`pickSkills` (their long-count share tests keep their meaning), `unlockReady`,
  `unlockThreshold`, `withoutArtBlocked`, `withPictures` or `distinctTasks`.
- No finer "type" than `SkillDef.type` (research R-2; a `typeOf` parameter keeps the door open).
- No confirmation dialog for "Wróć" (autonomous decision A-4), no "Wróć" for a parent-placed learner (A-2), no import
  from the welcome screen.
- No edit of `context/foundation/prd.md` (FR-009) — foundation files are written by their 10x skill; a follow-up and a
  `[human]` row instead (A-7). No edit of `docs/ZADANIA.md` (read-only kit, profile § 6); the variety rule does not
  contradict its § 1 shares.
- Audit rows M-1, M-2, M-13, H-3, H-4 stay deferred (re-recorded as follow-ups); "Wróć" adds no new ordering hole.
- No roadmap status edit (non-roadmap change). The status "naprawione (#PR)" of F-01..F-03 in
  `docs/playtest-feedback.md` is set by the ship step once the PR number exists (PA-5) — not a phase row here.

## Implementation Approach

Pure rules in `src/core` first with failing seeded tests (variety picker, warm-up variety, `longPress` tap, the "Wróć"
predicate), then the thin scene wiring (`curriculum.ts`/`warmup.ts` call sites, `UIScene` hint, `TaskScene` button),
then docs and the seam sweep, then one e2e phase per browser risk. Every number lives in `balance.ts`, every string in
`pl.ts`, every geometry in `layout.ts`; each new player-visible element gets a DESIGN-GAP row (151 onward). Phases are
ordered so each is green alone and touches at most one new UI component.

## Critical Implementation Details

- **Variety picker contract (phase 1).** Per draw: roll the bucket exactly as `pickRoundSkills` does (same live/
  fallback buckets, same weights, one `rng.next()`); inside the chosen pool (the bucket, or on the review step the group
  chosen by one `rng.pick(groups)`) take the skills whose type count so far is below `maxPerType`; if none, the whole
  pool; then one `rng.pick` of that list. After all draws, an rng-free reorder: at each position take, among the
  remaining skills, the type with the highest remaining count that differs from the previous position's type (ties:
  the type whose first remaining skill came earliest in draw order; inside a type, draw order); if every remaining
  skill has the previous type, take it (relaxed). This is a greedy that yields no neighbours whenever the most frequent
  type has at most `ceil(n / 2)` tasks.
- **Warm-up (phase 2).** Type counts are shared across the 6 picks (cap 2 over the whole warm-up); the reorder runs
  inside each half (tasks 0–2 previous stage, 3–5 current), the second half seeded with the last type of the first half
  as "previous", so tasks 2 and 3 differ when possible. The seed is soft (plan-review F2): a greedy seeded with the
  previous type can create an in-half neighbour (second half `[A, A, B]` after an `A` gives `B A A`), so `buildWarmup`
  keeps the seeded order only when it has no same-type neighbour inside the half and otherwise uses the unseeded
  `spreadTypes` order (`A B A`, one neighbour across the boundary). In-half variety wins over the boundary.
- **"Wróć" exit order (phase 6)**, from research § F-02 (b): (1) cleanup as in `applyParentStage` (narrator `cancel`,
  `feedDrag({ type: 'reset' })`, `endFlyingStars`, camera tween kill; registry `narration`, `roomSwitch`, `hudTitle`
  cleared); (2) `registry.set(REGISTRY_KEYS.learner, null)` — `set`, not `remove` (the autosaver listens to
  `changedata`); (3) `saver.flush('now')`; (4) `scene.stop(SCENE_KEYS.ui)` and stop `SCENE_KEYS.room` when it is
  running or sleeping; (5) `this.scene.start(SCENE_KEYS.welcome)`. Never `advance`/`finishRound`/`countRound`, so no
  mastery, history, easing, unlock or variant count is written (the M-13 rule, deliberately).
- **Hint never holds the input switch** (phase 4): it is a HUD drawing, not an overlay, so follow-up F5 (UIScene
  long-press reset on `suspend`) does not join.

## Phase 1: Round variety rule for ordinary rounds (F-03)

Driver: tdd
Driver why: the varied picker and the reorder are absent pure functions with exact seeded oracles — failing tests lead.

### Overview

A new per-round picker caps a type at 2 and spreads types apart, wired into `buildAdaptiveRound`; buckets and the rng
stream stay as in `pickRoundSkills`.

### Changes Required:

#### 1. Pure picker and reorder

**File**: `src/core/round/variety.ts` (new)

**Intent**: `pickVariedSkills(buckets, weights, rng, count, rules, typeOf?)` per the contract in Critical
Implementation Details; `spreadTypes(skills, typeOf?, previousType?)` the rng-free reorder; `variedRound(...)` =
`spreadTypes(pickVariedSkills(...))`. `typeOf` defaults to `(s) => s.type`.

**Contract**: `rules: { readonly maxPerType: number }`; same `RangeError` as `pickRoundSkills` when no bucket has a
skill; consumes exactly the rng calls `pickRoundSkills` consumes for the same arguments (one `next()` + one `pick` per
draw, plus one `pick` per review-group draw). Imports only from `core` (no Phaser, ESLint boundary).

#### 2. Numbers

**File**: `src/data/balance.ts`

**Intent**: `balance.round.variety: { maxPerType: 2 }` with a comment citing F-03 / scope.md (the no-neighbour rule
is the reorder itself, always on; no switch needed).

**Contract**: new key only; existing `balance.round` keys unchanged.

#### 3. Call site

**File**: `src/core/curriculum.ts` `buildAdaptiveRound`

**Intent**: replace the `pickRoundSkills(...)` call with `variedRound(...)` taking `balance.round.variety`; everything
around it (art filter, picture mode, `reviewWeights`, `distinctTasks`, art redraws) unchanged.

**Contract**: signature of `buildAdaptiveRound` unchanged; `pickRoundSkills` stays exported and used by its tests.

#### 4. Tests

**File**: `tests/variety.test.ts` (new)

**Contract**: synthetic buckets (oracles from the rule, not the implementation): current `[A1, A2, B1]` only, 5 draws →
max type count 3 and order alternates (`A B A B A` by type); current `[A1, A2, A3]` only → 5 × A (relaxed) and order
unchanged; three types → no type above 2, no neighbours. Real curriculum, every playable step of E1–E6 × 200 seeds:
(a) the bucket of draw i equals the bucket of draw i of `pickRoundSkills` for the same seed (shares exactly kept);
(b) replay oracle — at any draw whose skill's type count was already ≥ 2, every skill of the rolled pool also had a
type at ≥ 2; (c) after the reorder, a same-type neighbour exists only when the round's top type count > 3;
(d) the reorder is a permutation of the drawn skills; (e) review step E6.11: every current-bucket draw stays in its
rolled group. One test that `buildAdaptiveRound` for a fixed seed returns tasks whose skills satisfy (c).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error: stub `variety.ts` first), green after; unit `<branch baseline> + N`
- Existing `tests/curriculumPick.test.ts`, `tests/pick.test.ts`, `tests/review.test.ts`, `tests/reviewGuards.test.ts`, `tests/artFilter.test.ts`, `tests/pictureMode.test.ts` green unchanged (`git diff --stat` of those files empty)
- Deliberate break: drop the cap filter → the synthetic `[A1, A2, B1]` case and oracle (b) red; skip `spreadTypes` → oracle (c) red; each restored; meta-check: (a) proves the shares only because the rng stream is aligned — a break that adds an extra `rng.next()` per draw must turn (a) red too (try it once)
- `npm run sample -- E1` … `E6` exit 0 (unchanged content)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] A one-off script in `$TMPDIR` (not committed) prints 5 `buildAdaptiveRound` rounds per stage E1–E6 at a mid step; read as a teacher: no round with 3+ tasks of one kind unless the step is one-type (e.g. E3.3 clock), no two same-kind tasks in a row where avoidable, rounds still mostly on the current step

---

## Phase 2: Variety in the warm-up (F-03)

Driver: tdd
Driver why: the warm-up variant of the picker is an absent pure rule with exact half-by-half oracles — failing tests lead.

### Overview

The 6-task warm-up uses the same cap over all 6 picks and the reorder inside each half.

### Changes Required:

#### 1. Uniform varied pick

**File**: `src/core/round/variety.ts`

**Intent**: `pickVariedFromStage(stage, rng, count, counts, rules, blocked?, typeOf?)` — the uniform pool of
`pickSkills` (playable minus `blocked`, the whole pool when the filter empties it) with the cap filter and one
`rng.pick` per draw; `counts` is a shared, caller-owned type tally so the two halves share the cap.

**Contract**: same rng calls as `pickSkills` for the same arguments; same `RangeError` text for a stage with no
playable skills.

#### 2. Call site

**File**: `src/core/round/warmup.ts` `buildWarmup`

**Intent**: draw the previous half and the current half with the shared tally, reorder each half with `spreadTypes`
(second half seeded with the last type of the first half), then `distinctTasks` as today; `rules` from
`balance.round.variety` passed by the caller (`TaskScene.freshRound`) or as a new optional argument defaulting to it —
the implementer picks the one that keeps `buildWarmup` callers compiling.

**Contract**: `buildWarmup` still returns `opts.length` tasks, `previousCount` of them first from the previous stage.

#### 3. Tests

**File**: `tests/warmup.test.ts` (extend), `tests/variety.test.ts`

**Contract**: halves stay in place (existing assertions unchanged); every stage E2–E6 × 200 seeds: no type above 2 over
the 6 unless the pool at that draw had no other type (replay oracle), no neighbours inside a half when its top count ≤ 2;
skills of each half are the skills `pickSkills` would draw from the same pools in the uncapped case (a stage pool with
6+ types and a seed where no cap fires: identical lists).

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-1 count> + N`; existing `tests/warmup.test.ts` assertions unchanged
- Deliberate break: give each half its own tally → the "cap over all 6" case red; restored; meta-check: the case must use a pool where the halves share a type (the previous and current stage both have ADD_SUB), otherwise the break proves nothing
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (the first-launch specs answer through the hook, not by task order) — e6b1d9c (e2e 138/139 + SV2-10 flake green 3/3 alone, orchestrator)

---

## Phase 3: Narrator off by default and the tap outcome of the hold (F-01, F-02 a core)

Driver: tdd
Driver why: a pin of `autoReadStages` and a `tap` result of the pure `longPress` reducer are absent and each is led by one failing test.

### Overview

Auto-read defaults to off everywhere; `longPress` reports a tap so the HUD can answer it in phase 4.

### Changes Required:

#### 1. Default

**File**: `src/data/balance.ts`

**Intent**: `balance.narrator.autoReadStages: []` with the comment rewritten: off for every stage by default, the
parent turns it on in the settings panel (F-01, maintainer 2026-10-20).

**Contract**: the type of the list must still accept stage ids (annotate it, e.g. `readonly StageId[]`, if `[]` would
narrow it to `never[]`); `effectiveAutoRead` and its callers unchanged.

#### 2. Tap outcome

**File**: `src/core/longPress.ts`

**Intent**: the result gains `tap: boolean`, true only for an `up` of the held finger while `holding` (short and
steady); every other path `false`. Update the header comment.

**Contract**: `{ state; fire; tap }`; `fire` semantics unchanged; `src/core/roomGesture.ts` compiles unchanged or
ignores the field explicitly.

#### 3. Tests

**Files**: `tests/narratorVoice.test.ts` (or a new `tests/narratorDefault.test.ts`), `tests/longPress.test.ts`

**Contract**: `balance.narrator.autoReadStages` equals `[]`; `effectiveAutoRead({ autoRead: null }, s, balance…)` is
false for every stage E1–E6 and `true` with `autoRead: true`. `longPress`: down→up → `tap: true, fire: false`; down→
move beyond tolerance→up → `tap: false`; down→tick past `holdMs`→up → `fire` once, `tap: false`; a second finger →
no tap; cancel → no tap; existing "a short tap (down, up) never fires" stays.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-2 count> + N`
- Deliberate break: `tap` true on every `up` → the drifted-press case red; `autoReadStages` back to `['E1','E2']` → the pin red; each restored; meta-check: the pin guards the data, the rule test guards `effectiveAutoRead` — both needed
- `grep -rn "autoReadStages" src` lists only `balance.ts` and the three readers (`TaskScene`, `RoomScene`, `UIScene`)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator.spec.ts` runs on E3 and asserts silence) — 9f0cb7c (e2e 138/139 + SV2-10 flake green 3/3 alone, orchestrator)

#### Manual Verification:

- [reviewer] Teacher read of the `src/data/` change: `npm run sample -- E1 --count 6` and `E2 --count 6` unchanged; the balance comment reads correctly in Polish context (no player text changed)

---

## Phase 4: The gear looks active and answers a tap with a hint (F-02 a)

Driver: impl
Driver why: layout tokens, one new HUD widget and UIScene glue around the phase-3 `tap` result — rendered UI, proven by screenshots and the phase-9 e2e.

### Overview

The gear gets the regular HUD look; the first short tap of a page load shows a hint bubble next to it for a few
seconds.

### Changes Required:

#### 1. Tokens and numbers

**Files**: `src/data/layout.ts` `HUD_LAYOUT.settings` (+ new `HUD_LAYOUT.settingsHint`), `src/data/balance.ts`
`balance.parentSettings`

**Intent**: `alpha` → 1 and `iconColor`/`fill`/`borderColor` from the speaker button's family (existing tokens, no new
colour); comment updated (not muted any more; gap rows 25, 28, 151). `settingsHint` geometry: a bubble left of / above
the gear, inside the screen, clear of the notebook's "Dalej" button and the room panel (implementer verifies against
`TASK_LAYOUT`/`ROOM_LAYOUT`), text wrap width, padding, colours from `PLACEHOLDER_COLORS`. `hintMs` (e.g. 3000) in
`balance.parentSettings` with a reason in the comment.

**Contract**: new keys only; `HUD_LAYOUT.settings` position and size unchanged (the hook target and gap 25 placement
stay).

#### 2. Copy

**File**: `src/data/pl.ts` (the `settings` or a HUD section)

**Intent**: `settingsHint: 'Przytrzymaj, żeby otworzyć ustawienia rodzica'` (wording fixed by the maintainer).

#### 3. Widget

**File**: `src/ui/widgets/SettingsHint.ts` (new)

**Intent**: a non-interactive bubble (rounded box + text) drawn in code from `HUD_LAYOUT.settingsHint`; `show()`,
`hide()`, `visible()`. DESIGN-GAP comment pointing at row 151. `SettingsIcon` class doc: drop "muted".

**Contract**: takes no input (no zone), so it never blocks a touch and never holds the input switch.

#### 4. Wiring

**File**: `src/scenes/UIScene.ts` `create`, `feed`

**Intent**: on `tap` from `longPress`, if `REGISTRY_KEYS.settingsHintShown` is not true: set it true, show the hint and
hide it after `hintMs` (scene clock); hide it when the settings open or the scene shuts down. Later taps do nothing.

**Contract**: new runtime key `REGISTRY_KEYS.settingsHintShown` in `src/data/layout.ts` with a "runtime only, not in
SAVE_KEYS" comment; `SAVE_KEYS` unchanged.

#### 5. Hook

**File**: `src/testing/e2eHook.ts` (+ a read-only `UIScene` getter)

**Intent**: the HUD part of the snapshot reports `settingsHint: boolean` (hint visible now).

**Contract**: hook build only; `npm run build` still prints `e2e hook: absent (`.

#### 6. Design gaps

**File**: `docs/design-gaps.md`

**Intent**: rows 25 and 28 rewritten (gear not muted; 28 keeps "no feedback while held"); new row **151** "The kit has
no hint for a tap on the settings icon" with the solution and file.

### Success Criteria:

#### Automated Verification:

- `grep -n "alpha: 0.7" src/data/layout.ts` no longer matches `HUD_LAYOUT.settings`; the HUD touch-target test (`MIN_TOUCH_TARGET`) green
- `grep -n "settingsHintShown" src/data/layout.ts` shows it outside `SAVE_KEYS`; `tests/` save-key tests green unchanged
- Deliberate break: show the hint on `fire` instead of `tap` → no automated test can see it here (canvas only); the break is proven in phase 9's e2e — record that the phase-4 proof is the `[visual]` rows below plus phase 9
- Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (`parent-settings.spec.ts` "#14 only a 2-second hold …" still green: a tap shows a hint, never the gate)

#### Manual Verification:

- [visual] Task screen at 1440 and 1024 wide: gear at full colour, matching the speaker button family, states: idle, hint shown after one tap, hint gone after `hintMs`
- [visual] Room screen at 1440 and 1024 wide: gear and hint do not cover the variant panel or a room task button
- [reviewer] Teacher read of the new `pl.ts` string (spelling, comma before "żeby")

---

## Phase 5: When "Wróć" is offered (F-02 b core)

Driver: tdd
Driver why: the predicate over saved v4 data is an absent pure function with exact cases — failing tests lead.

### Overview

One pure rule decides whether "Wróć" shows; a save round-trip proves a learner-less save with stars stays valid.

### Changes Required:

#### 1. Predicate

**File**: `src/core/placement.ts`

**Intent**: `firstRoundDone(learner, variants, warmupLength)` = `variants.roundsSince > 0 || variants.lastMinigame !==
null || variants.puzzleDay !== null || variants.puzzlesDone.length > 0 || learner.history.length > warmupLength`;
`ageBackOffered(learner, variants, warmupLength)` = `!learner.stageOverriddenByParent && !firstRoundDone(...)`.

**Contract**: pure, no balance import (the length is an argument; the scene passes `balance.warmup.length`).

#### 2. Tests

**File**: `tests/ageBack.test.ts` (new)

**Contract**: fresh child-placed learner → offered; `stageOverriddenByParent` → not; `roundsSince` 1 → not; after a
variant (`lastMinigame` set, `roundsSince` 0) → not; history of 6 (warm-up only) → offered; history of 7 → not; a v1
fixture lifted by `decodeSave`: `tests/fixtures/save-v1.json` holds only 2 history entries and fresh `variants` after
`MIGRATIONS[1]`, so it IS offered (the accepted edge in the brief, pinned so it stays a known decision, plan-review
F1); the same decoded learner with its history extended in the test to 7 entries → not offered. Save: `encodeSave` of a
session with `learner: null`, `stars: 7`, a bought salon task → `decodeSave` + `validateSave` accept it, stars and rooms
equal, `needsPlacement` true.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-4 count> + N`
- Deliberate break: drop the `history` clause → the v1-derived history-7 case red; drop the parent clause → its case red; each restored; meta-check: the v1 case must use a fixture whose `variants` are fresh after `MIGRATIONS[1]` (check it), otherwise it proves nothing
- `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

---

## Phase 6: "Wróć" on the warm-up and the first round (F-02 b)

Driver: impl
Driver why: scene glue — a reused `PageButton`, layout and copy tokens and the exit sequence in `TaskScene` around the phase-5 predicate; rendered UI, proven by screenshots and the phase-8 e2e.

### Overview

`TaskScene` shows "Wróć" in the left margin while `ageBackOffered` holds; a tap leaves to the age choice by the exit
order in Critical Implementation Details.

### Changes Required:

#### 1. Tokens and copy

**Files**: `src/data/layout.ts` (`TASK_LAYOUT.ageBack`), `src/data/pl.ts`

**Intent**: geometry inside the left margin (x 0–180, clear of the notebook at x 180), above the build id caption,
both sides ≥ `MIN_TOUCH_TARGET`, label fitting the box (smaller text style if needed); added to the interactive-
rectangle list checked against `MIN_TOUCH_TARGET`. Copy `pl.round.ageBack: 'Wróć'` (label fixed by the maintainer;
`resume: 'Wróć do notesu'` is a different button and is not reused).

**Contract**: DESIGN-GAP comment → row **152**.

#### 2. Scene

**File**: `src/scenes/TaskScene.ts` (`create`, `render`, new private `backToAge`)

**Intent**: a `PageButton` ("secondary" kind) created in `create`; `render` shows it when
`ageBackOffered(learner, variants, balance.warmup.length)` holds for the registry learner and variants, also on the
warm-up summary, hidden otherwise (after the first ordinary round's `finishRound` it is gone, and a parent stage change
that sets `stageOverriddenByParent` hides it at the next render). The tap runs `backToAge` (exit order, Critical
Implementation Details), with the `tap` cue like the other buttons.

**Contract**: `backToAge` never calls `advance`, `finishRound`, `countRound` or `applyRound`; `WelcomeScene` needs no
change (re-entry resets it); if it does, only its reset in `create`.

#### 3. Hook

**File**: `src/testing/e2eHook.ts`, `TaskScene.targets`

**Intent**: `targets.ageBack` (interior point, or `null` when hidden).

**Contract**: hook build only.

#### 4. Design gap

**File**: `docs/design-gaps.md`

**Intent**: row **152** "The kit has no way back to the age choice" (left-margin "Wróć", warm-up and first round only,
child-placed learner only).

### Success Criteria:

#### Automated Verification:

- `grep -n "backToAge" src/scenes/TaskScene.ts` shows no call to `advance`, `finishRound`, `countRound` inside it (reviewed by reading the method)
- The layout touch-target test covers `TASK_LAYOUT.ageBack` (add it to the checked list; red if the box is made 80 px high, restored)
- Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (first-launch specs unaffected: they never tap the margin)

#### Manual Verification:

- [visual] At 1440 and 1024 wide: "Wróć" on the warm-up (E3, age 8) with a tile task and with a keypad task, on the warm-up summary, on the first ordinary round of E1 (age 6); absent on the second ordinary round and for a parent-placed learner; the welcome screen reached by "Wróć" shows no HUD (star counter, gear); it covers no answer tile, keypad key, "Dalej" or the build id
- [reviewer] Reading `backToAge` against the exit order: cleanup → learner `null` → `flush('now')` → stop UI and Room → start welcome
- [human] Product choices the scope left open, decided by the agent (A-2 "Wróć" hidden when a parent chose the stage, A-3 visible through the whole warm-up/first round incl. mid-task, A-4 no confirmation): the maintainer confirms or asks for a change

---

## Phase 7: Docs, follow-ups and seam sweep

Driver: impl
Driver why: rule-file and plan text, the follow-ups file and a sweep of phases 1–6 — docs and glue, proven by the gate.

### Overview

The design plan, the rule files and the follow-ups say what the code now does; leftovers of phases 1–6 are removed.

### Changes Required:

#### 1. Design plan

**File**: `Martynka-urzadza.md`

**Intent**: the Założenia line "lektor (automatyczne czytanie poleceń to ustawienie rodzica, domyślnie włączone dla
E1–E2)" and the task-screen narrator bullet "domyślnie włączone dla E1–E2, wyłączone od E3" say: off by default for
every stage, the parent turns it on (maintainer decision 2026-10-20, playtest F-01). Add one sentence on "Wróć" in the
first-launch section and one on the variety rule next to the 60/30/10 round draw, only where those sections exist.

#### 2. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` if it repeats the same facts — grep first)

**Intent**: fix the stale facts: `buildWarmup`/`warmupResult` live in `src/core/round/warmup.ts` (not
`src/core/placement.ts`); "a muted gear" → the gear with its first-tap hint (`SettingsHint`,
`REGISTRY_KEYS.settingsHintShown`, `balance.parentSettings.hintMs`); the narrator sentence: auto-read off by default
(`autoReadStages` `[]`); add one sentence for this change (variety rule `src/core/round/variety.ts`,
`balance.round.variety`; "Wróć" `ageBackOffered` in `src/core/placement.ts`, `TaskScene.backToAge`; design gaps
151–152).

#### 3. Follow-ups

**File**: `context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md` (new)

**Intent**: each with a `Trigger:` line: PRD FR-009 contradicts the new default (Trigger: next `/10x-prd` refresh);
audit M-1 (`TaskScene.applyParentStage`), M-2, M-13, H-3, H-4 re-recorded (Trigger: next change to the `TaskScene`
round lifecycle / narrator); F4/F6 WelcomeScene guards marked closed in code; E1/E2 parent path silent until the first
tap marked moot (F-01); hint on every tap vs once (Trigger: playtest note that a parent missed it); a finer type key
(Trigger: maintainer counts set-the-clock and read-the-clock as different kinds); the adaptive-curriculum follow-up
"`firstPlayableSteps` (`pick.ts`) and `playableSteps` (`curriculum.ts`) filter steps by the same predicate — one source"
(its trigger "next change to `pick.ts` or `curriculum.ts`" fires in phase 1) re-recorded, deferred because merging
the predicates would move the warm-up pools that phase 2's "uncapped = `pickSkills`" oracle compares against
(Trigger: next change to the warm-up pools or to `stepPlayable`).

#### 4. Seam sweep

**Files**: anything phases 1–6 touched

**Intent**: no duplicated tally/reorder helpers between `variety.ts`, `pick.ts` and `warmup.ts`; no stale comment
that says "muted", "E1–E2 read by default" or "uniform warm-up" (`grep -rn "muted\|E1–E2\|E1-E2" src docs/design-gaps.md`);
`pick.ts` header comment names `variety.ts` as the round path; unused exports removed.

### Success Criteria:

#### Automated Verification:

- `grep -n "src/core/placement.ts" CLAUDE.md` no longer claims `buildWarmup`; `grep -n "muted gear" CLAUDE.md` empty
- `grep -c "^Trigger:" context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md` ≥ 6
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [human] PRD FR-009 (`context/foundation/prd.md`) still says auto-read is on for E1–E2 while the code (maintainer decision 2026-10-20) has it off everywhere — the maintainer refreshes it with `/10x-prd` or accepts the follow-up
- [reviewer] `Martynka-urzadza.md` edits match PA-1 and PA-3 wording; no other section changed

---

## Phase 8: "Wróć" takes the child back to the age choice — e2e (#12)

Driver: e2e
Driver why: risk #12 (first launch ends on the wrong stage) exists only across `TaskScene`, `WelcomeScene`, the HUD and the autosave — built in phase 6, contract `E2E=on`.

### Overview

One spec in `tests/e2e/first-launch.spec.ts` (hook build, port 4397) proves the way back and its limits.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/first-launch.spec.ts` (`#12` title), helpers in `tests/e2e/support/welcome.ts` only if needed

**Contract**: fresh context, `?e2eMonth=9`: `passWelcomeAsChild(page, 8, …)` → warm-up on E3 → answer one task right
(stars 1) → tap `targets.ageBack` → `screen` `welcome` → age 7 → warm-up on E2, star counter still 1 → reload → still
the E2 warm-up with "Wróć" offered → play the warm-up and the first ordinary round to the summary → `targets.ageBack`
`null`; reload → still `null`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate break: `ageBackOffered` always true → the final `null` assertion red; `backToAge` without `flush('now')` and a reload right after → the E2 assertion red, if the 500 ms debounce lets it), green after; restored
- `npx playwright test tests/e2e/first-launch.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`
- Full local gate green

---

## Phase 9: A tap on the gear shows the hint, only a hold opens the gate — e2e (#14)

Driver: e2e
Driver why: risk #14 (a child enters parent settings by a tap) is a touch-path behaviour of the HUD built in phase 4, contract `E2E=on`.

### Overview

The existing #14 hold spec gains the hint assertion; one new case pins "once per page load".

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/parent-settings.spec.ts`

**Contract**: in "#14 … only a 2-second hold …": after the first `tapScene(icon)` assert `settingsHint` true and the
gate absent; new `#14` case: tap → hint true → wait for it to hide (poll the hook, never a fixed sleep) → tap again →
hint stays false; then `openSettings` (hold) opens the gate as before.

### Success Criteria:

#### Automated Verification:

- Deliberate break: show the hint on every tap → the new case red; hint on `fire` instead of `tap` → the extended case red; each restored
- `npx playwright test tests/e2e/parent-settings.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1` over phase 8
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- Variety: synthetic buckets with exact outcomes; real curriculum × seeds with the bucket-alignment oracle (shares),
  the replay oracle (cap relaxes only when forced), the neighbour property; warm-up halves and the shared tally.
- `longPress` tap outcome; `autoReadStages` pin; `ageBackOffered` over v4 shapes and a v1 fixture; a learner-less save
  round-trip.

### Integration Tests:

- e2e #12 (way back, stars kept, survives reload, gone after the first round), #14 (tap hint once, hold opens gate).

### Manual Testing Steps:

1. Fresh device, age 8: the warm-up shows "Wróć" in the left margin; tap it; choose 7; stars kept.
2. Tap the gear once: the hint shows and hides; tap again: nothing; hold 2 s: the gate.
3. Play three E3 rounds: no round with three clock tasks unless on E3.3; no two same-kind tasks in a row.

## Performance Considerations

The picker filters lists of at most ~70 skills five times per round; negligible.

## Migration Notes

None: save format v4 unchanged (table in Overview). A saved `autoRead: null` now means "off" in E1–E2 too — the
intended behaviour change (PA-1).

## Known risks

- (plan-review F3) `TaskScene`'s `shutdown` handler does not stop `UIScene`; `backToAge` must stop it explicitly (exit
  order step 4) or the HUD stays over the welcome screen until the next `launch`. Row 6.4 [visual] also checks that the
  welcome after "Wróć" shows no HUD.
- (plan-review F5) Phase 4's "hint once" glue has no automated proof until phase 9 (canvas only); a regression between
  phases 4 and 9 is caught only by the [visual] rows.
- On a one-type step the cap relaxes (15 of 62 steps); per-skill practice inside a bucket shifts toward rarer types.

## Autonomous decisions

- **A-1 "Type" = `SkillDef.type`** (research R-2). Rejected: `params.variant`. Why: matches "generator" in scope.md and
  what a child perceives. Would change: the maintainer counting variants as types — `typeOf` is already a parameter.
- **A-2 "Wróć" hidden for a parent-placed learner** (`stageOverriddenByParent`, research open question 1). Rejected:
  every first round. Why: PA-3 is about the child correcting *her own* age; going back would undo the parent's choice.
  Would change: the maintainer wanting it for every learner.
- **A-3 "Wróć" visible during the whole warm-up / first round in the left margin** (incl. the warm-up summary), not only
  between tasks. Rejected: between tasks only. Why: a child who sees a too-hard task should leave at once; the open
  round is dropped (M-13 rule) and stars stay. Would change: a playtest showing accidental taps in the margin.
- **A-4 No confirmation for "Wróć"**. Rejected: a confirm dialog. Why: the cost of an accidental tap is one age tap; a
  dialog is harder for a 6-year-old than the mistake. Would change: playtest reports of lost warm-ups.
- **A-5 Cap only in the pick; neighbours handled by the rng-free reorder.** Rejected: also filtering "not previous
  type" during the pick (research). Why: the reorder makes the neighbour rule order-independent and keeps the pick's
  rng stream aligned; filtering both would bias skills further without improving the result. Would change: a test
  showing the reorder leaves avoidable neighbours.
- **A-6 Hint once per page load, not spoken**, runtime key `settingsHintShown` (D-4). Rejected: every tap; a saved
  flag. Why: the hint is for the adult; repeating it invites play with the gear; a saved flag would touch the format.
  Would change: playtest note that a parent missed it.
- **A-7 PRD FR-009 not edited in this change** (reverses change.md D-6). Why: CLAUDE.md "never hand-write files in
  `context/`" — foundation files belong to their 10x skill; D-6's own reversal condition fires. This decides against the
  PRD's literal text (FR-009 "domyślnie włączone dla E1–E2") → `[human]` row 7.4 and a follow-up. Would change: the
  maintainer allowing a one-line hand edit of the PRD.
- **A-8 No E1/E2 silence e2e** (research open question 4). Why: the unit pin of `autoReadStages` plus the existing E3
  silence spec cover the rule; a narrator e2e on E1 costs a full spec. Would change: a regression where a reader
  bypasses `effectiveAutoRead`.
- **A-9 Two e2e phases (8, 9), one per risk**, after the seam sweep (contract). Variety (F-03) has no e2e: pure core,
  hook-forced rounds bypass it.

## References

- Research: `context/changes/playtest-fixes-f01-f03/research.md`
- Change identity and PA-1..PA-6: `context/changes/playtest-fixes-f01-f03/change.md`
- Scope: `context/runs/2026-10-20-playtest-boot/scope.md` § 1
- Source: `docs/playtest-feedback.md` F-01, F-02, F-03
- Format example: `context/archive/2026-10-17-health-lines-and-smoke/plan.md`
- Test-plan risks #12, #13, #14: `context/foundation/test-plan.md`
- Audit rows M-1, M-2, M-13: `context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Round variety rule for ordinary rounds (F-03)

#### Automated

- [x] 1.1 New tests red before the change (assertion, not import error: stub `variety.ts` first), green after; unit `<branch baseline> + N` — 49a682f
- [x] 1.2 Existing `tests/curriculumPick.test.ts`, `tests/pick.test.ts`, `tests/review.test.ts`, `tests/reviewGuards.test.ts`, `tests/artFilter.test.ts`, `tests/pictureMode.test.ts` green unchanged (`git diff --stat` of those files empty) — 49a682f
- [x] 1.3 Deliberate break: drop the cap filter → the synthetic `[A1, A2, B1]` case and oracle (b) red; skip `spreadTypes` → oracle (c) red; each restored; meta-check: (a) proves the shares only because the rng stream is aligned — a break that adds an extra `rng.next()` per draw must turn (a) red too (try it once) — 49a682f
- [x] 1.4 `npm run sample -- E1` … `E6` exit 0 (unchanged content) — 49a682f
- [x] 1.5 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (local part green: lint, typecheck, unit 3662, deploy scripts, sample E1-E6, build absent; e2e left to the orchestrator) — 49a682f (e2e 139+0 by orchestrator)

#### Manual

- [ ] 1.6 [reviewer] A one-off script in `$TMPDIR` (not committed) prints 5 `buildAdaptiveRound` rounds per stage E1–E6 at a mid step; read as a teacher: no round with 3+ tasks of one kind unless the step is one-type (e.g. E3.3 clock), no two same-kind tasks in a row where avoidable, rounds still mostly on the current step

### Phase 2: Variety in the warm-up (F-03)

#### Automated

- [x] 2.1 New tests red before the change, green after; unit `<phase-1 count> + N`; existing `tests/warmup.test.ts` assertions unchanged — e6b1d9c
- [x] 2.2 Deliberate break: give each half its own tally → the "cap over all 6" case red; restored; meta-check: the case must use a pool where the halves share a type (the previous and current stage both have ADD_SUB), otherwise the break proves nothing — e6b1d9c
- [x] 2.3 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (the first-launch specs answer through the hook, not by task order)

### Phase 3: Narrator off by default and the tap outcome of the hold (F-01, F-02 a core)

#### Automated

- [x] 3.1 New tests red before the change, green after; unit `<phase-2 count> + N` — 9f0cb7c
- [x] 3.2 Deliberate break: `tap` true on every `up` → the drifted-press case red; `autoReadStages` back to `['E1','E2']` → the pin red; each restored; meta-check: the pin guards the data, the rule test guards `effectiveAutoRead` — both needed — 9f0cb7c
- [x] 3.3 `grep -rn "autoReadStages" src` lists only `balance.ts` and the three readers (`TaskScene`, `RoomScene`, `UIScene`) — 9f0cb7c
- [x] 3.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator.spec.ts` runs on E3 and asserts silence)

#### Manual

- [ ] 3.5 [reviewer] Teacher read of the `src/data/` change: `npm run sample -- E1 --count 6` and `E2 --count 6` unchanged; the balance comment reads correctly in Polish context (no player text changed)

### Phase 4: The gear looks active and answers a tap with a hint (F-02 a)

#### Automated

- [x] 4.1 `grep -n "alpha: 0.7" src/data/layout.ts` no longer matches `HUD_LAYOUT.settings`; the HUD touch-target test (`MIN_TOUCH_TARGET`) green — 27227e3
- [x] 4.2 `grep -n "settingsHintShown" src/data/layout.ts` shows it outside `SAVE_KEYS`; `tests/` save-key tests green unchanged — 27227e3
- [x] 4.3 Deliberate break: show the hint on `fire` instead of `tap` → no automated test can see it here (canvas only); the break is proven in phase 9's e2e — record that the phase-4 proof is the `[visual]` rows below plus phase 9 — 27227e3
- [x] 4.4 Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (`parent-settings.spec.ts` "#14 only a 2-second hold …" still green: a tap shows a hint, never the gate) — 27227e3 (e2e 139+0, orchestrator)

#### Manual

- [ ] 4.5 [visual] Task screen at 1440 and 1024 wide: gear at full colour, matching the speaker button family, states: idle, hint shown after one tap, hint gone after `hintMs`
- [ ] 4.6 [visual] Room screen at 1440 and 1024 wide: gear and hint do not cover the variant panel or a room task button
- [ ] 4.7 [reviewer] Teacher read of the new `pl.ts` string (spelling, comma before "żeby")

### Phase 5: When "Wróć" is offered (F-02 b core)

#### Automated

- [x] 5.1 New tests red before the change, green after; unit `<phase-4 count> + N` — 6bd7c17 (red: 5 of 7 failed, e.g. expected true to be false; unit 3674 + 7 = 3681)
- [x] 5.2 Deliberate break: drop the `history` clause → the v1-derived history-7 case red; drop the parent clause → its case red; each restored; meta-check: the v1 case must use a fixture whose `variants` are fresh after `MIGRATIONS[1]` (check it), otherwise it proves nothing — 6bd7c17 (history clause dropped: history 6/7 and v1 cases red; parent clause dropped: its case red; v1 fixture variants asserted fresh in the test)
- [x] 5.3 `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty — 6bd7c17 (empty)
- [x] 5.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` — PH (e2e 139+0, orchestrator)

### Phase 6: "Wróć" on the warm-up and the first round (F-02 b)

#### Automated

- [x] 6.1 `grep -n "backToAge" src/scenes/TaskScene.ts` shows no call to `advance`, `finishRound`, `countRound` inside it (reviewed by reading the method) — 33772b7
- [x] 6.2 The layout touch-target test covers `TASK_LAYOUT.ageBack` (add it to the checked list; red if the box is made 80 px high, restored) — 33772b7
- [x] 6.3 Full local gate green (build prints `e2e hook: absent (`); e2e (orchestrator) `<branch e2e baseline> + 0` (first-launch specs unaffected: they never tap the margin) — PH (e2e 139+0, orchestrator)

#### Manual

- [ ] 6.4 [visual] At 1440 and 1024 wide: "Wróć" on the warm-up (E3, age 8) with a tile task and with a keypad task, on the warm-up summary, on the first ordinary round of E1 (age 6); absent on the second ordinary round and for a parent-placed learner; the welcome screen reached by "Wróć" shows no HUD (star counter, gear); it covers no answer tile, keypad key, "Dalej" or the build id
- [ ] 6.5 [reviewer] Reading `backToAge` against the exit order: cleanup → learner `null` → `flush('now')` → stop UI and Room → start welcome
- [ ] 6.6 [human] Product choices the scope left open, decided by the agent (A-2 "Wróć" hidden when a parent chose the stage, A-3 visible through the whole warm-up/first round incl. mid-task, A-4 no confirmation): the maintainer confirms or asks for a change

### Phase 7: Docs, follow-ups and seam sweep

#### Automated

- [x] 7.1 `grep -n "src/core/placement.ts" CLAUDE.md` no longer claims `buildWarmup`; `grep -n "muted gear" CLAUDE.md` empty — P7SHA
- [x] 7.2 `grep -c "^Trigger:" context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md` ≥ 6 — P7SHA
- [ ] 7.3 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 7.4 [human] PRD FR-009 (`context/foundation/prd.md`) still says auto-read is on for E1–E2 while the code (maintainer decision 2026-10-20) has it off everywhere — the maintainer refreshes it with `/10x-prd` or accepts the follow-up
- [ ] 7.5 [reviewer] `Martynka-urzadza.md` edits match PA-1 and PA-3 wording; no other section changed

### Phase 8: "Wróć" takes the child back to the age choice — e2e (#12)

#### Automated

- [ ] 8.1 Spec red before (deliberate break: `ageBackOffered` always true → the final `null` assertion red; `backToAge` without `flush('now')` and a reload right after → the E2 assertion red, if the 500 ms debounce lets it), green after; restored
- [ ] 8.2 `npx playwright test tests/e2e/first-launch.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`
- [ ] 8.3 Full local gate green

### Phase 9: A tap on the gear shows the hint, only a hold opens the gate — e2e (#14)

#### Automated

- [ ] 9.1 Deliberate break: show the hint on every tap → the new case red; hint on `fire` instead of `tap` → the extended case red; each restored
- [ ] 9.2 `npx playwright test tests/e2e/parent-settings.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1` over phase 8
- [ ] 9.3 Full local gate green
