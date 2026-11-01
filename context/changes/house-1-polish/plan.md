# Kitchen in stages and the salon on cream (house-1 polish) — Implementation Plan

## Overview

Roadmap slice S-32 `house-1-polish` (milestone M-03, path of house 1; PRD FR-033, FR-038, FR-021, FR-035), autonomous
run `2026-11-01-bathroom-polish-lab`, branch `feat/house-1-polish` cut from `main` at `964285b` (S-31 merge #136).
Outcome: the child renovates the kitchen in stages like the children's room ("Posprzątaj kuchnię", "Odnów ściany",
"Odnów podłogę", then the six pieces), and the salon stands on the cream `#FFF5DF` surround like every other room (room
view, house cross-section, room-done card miniature, task-screen backdrop). Nothing the child already furnished in the
kitchen or the salon is lost.

Binding inputs: `context/runs/2026-11-01-bathroom-polish-lab/scope.md`, `change.md` D1-D6 and § Migration, `research.md`
(its Code References are the grounding), the pack `designs/martynka-house-1-polish-v1`. No lessons file exists in
`context/foundation/` (checked at this step), so no lesson is named in a phase.

**Save format v6 → v7 (overturns the orchestrator's starting decision "save stays v6", with evidence).** `RoomState.tasksDone`
counts POSITIONS in `RoomDef.tasks`; inserting two stage tasks at the front of the kitchen list changes the meaning of every
saved kitchen with `tasksDone ≥ 1` (research § A). A version step `MIGRATIONS[6]` remaps the saved kitchen once
(`0 → 0`, `k ≥ 1 → k + 2`, `chosen` untouched, no kitchen → nothing). It lands in its own `tdd` phase BEFORE the kitchen data
changes. `[human]` row 5.9.

Code outside room data, the art script table and assets that this slice changes, named for the product owner (change.md,
PR body „dla właściciela produktu”): `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS`), `src/core/types.ts` (`SaveV7`), a new
frozen `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs` (a per-file pack source in `ROOM_PACKS`, the salon
row stops recolouring), `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs` (one e2e save seam), `deploy/README.md` § 6 (one
docs-only rollback note). A phase that finds it must change star income, mastery, curriculum, task generators,
`balance.loader`, `HouseView`, `SalonBackdrop`, `roomCapture`, `RoomView`, the purchase flow or the worn-grade code stops with
`STATUS: BLOCKED` and records why.

## Current State Analysis

Grounded in `research.md` (sections A-F), spot-checked on this branch at `98775f8`:

- **Kitchen today** (`src/data/rooms.ts` `KITCHEN`): one stage `renovate` ("Odnów ściany i podłogę", 5, no `scene` →
  `kitchen/after`) then six slots 7/9/10/12/13/15 (71). Its comment says "New tasks go at the END of this list only".
  `CHILDREN` is the staged template: `clean-room` (`scene: 'children/children-stage-1'`), `paint-walls` (`-stage-2`),
  `renew-floor` (no `scene`).
- **One background rule** (`src/core/rooms.ts` `sceneKey`, `stageFade`, `stagesDone`) serves room, miniature, house cell and
  backdrop; `src/data/roomArt.ts` `roomArt` turns a stage task's `scene` into `assets/rooms/<key>.webp`. No new mechanism.
- **Save chain** (`src/core/save.ts`): `SAVE_VERSION = 6`, `MIGRATIONS` 1-5, `decodeSave`/`importProblem` loop the steps;
  `src/core/migrations/building.ts` `LIFT_V5_BUILDING` is the frozen, data-free pattern; `carryV2Salon` is the only step that
  rewrites `tasksDone`. `backup-v<from>` keys need no code (`createIdbSaveStore.backup`); `readBackups` loops to
  `SAVE_VERSION - 1`. A pre-v7 build meets v7 as `future` and refuses writes with `NewerSave` (generic, already tested).
- **Frozen v6 fixtures** loaded only by `tests/fixtureLoadPath.test.ts`: `save-v6`, `save-v6-bridge-done`,
  `save-v6-kitchen-done` (kitchen `tasksDone 7`, every slot chosen), `save-v6-children-done` (kitchen 7). No frozen v6
  kitchen mid-renovation exists.
- **v6 pins** (grep `SAVE_VERSION).toBe(6)` = 7 hits): `tests/save.test.ts` ×3, `saveV6.test.ts`, `saveV5.test.ts`, e2e
  `rooms-as-data.spec.ts`, `first-building-choice.spec.ts`; plus `v6of` helpers / `version: 6` in `saveV4`, `saveFile`,
  `autosave`, `legacySalonMigration`; `fixtureLoadPath` "writes v6" and the two kitchen equality cases.
- **Art script** (`scripts/make-task-art.mjs` `ROOM_PACKS`, `ROOM_JOBS`): one `pack` per row, output name = source name;
  the salon row (`SALON_V2`, `recolourBoard: true`, `BOARD_FILES`) recolours the board to `#BCD799` through
  `scripts/recolour-board.py`. The kitchen row reads `LOCATIONS_V2`.
- **Pack** `martynka-house-1-polish-v1`: `assets/room/kitchen-stage-{1,2}.png`, `salon-{before,after,shadows}-cream.png`
  (1920×1080, corners `#FFF5DF`); `salon-before-cream` is the salon-worn-v2 interior (more worn than today's before); slots
  unchanged. QA `passed: false` only on the order's own 1 % outline threshold (scope.md: not a refusal reason).
- **Budgets**: kitchen 21 → 23 files ≈ 0.97 MB; salon ≈ 1.18 MB; boot kitchen ≈ 37.2 s, salon ≈ 41.4 s against 48 s
  (`tests/bootBudget.test.ts`). Deploy smoke room-picture count derives from `ROOM_ART`: 144 → 146.
- **Backdrop**: the cream salon keeps ≈ 0.67 of the area around the notebook non-cream (today 1.00; kitchen 0.00, gap 182).
- **Worn grade** (`applyWornGrade`) touches furniture images only, never the `sceneKey` background; under Canvas
  `ROOM_LAYOUT.worn.canvasWash` covers the whole scene.
- **Counts.** Baseline on `main` at `964285b` (contract): unit 4233 (4230 passed + 3 skipped in CI), e2e 193. SEEN at this
  step with `gh run view 41330660160 --log` (sandbox disabled): job `build` (124919859656) step `Run npm test`
  `Tests  4230 passed | 3 skipped (4233)`, step `Run npm run build` `e2e hook: absent (2 chunks checked)`; job `deploy`
  (124920757998) step `Smoke check (deploy)` `ok   precache covers room pictures — 144 of 144 room pictures precached` and
  `all 24 checks ok`.

## Desired End State

- `SAVE_VERSION` 7; `MIGRATIONS[6] = LIFT_V6_KITCHEN_STAGES` (frozen, no `src/data` import): a saved kitchen with integer
  `tasksDone ≥ 1` gets `+2`, everything else passes through with `version: 7`. Frozen fixtures `save-v6-kitchen-mid.json`
  (v6 input, written by the v6 code) and `save-v7.json` (hand-written v7 oracle) exist; every v6 fixture loads, migrates,
  writes v7 and leaves `profile:default:backup-v6` equal to its raw bytes; `deploy/README.md` § 6 has a v7 "Uwaga" note.
- `KITCHEN.tasks` = `clean-kitchen` ("Posprzątaj kuchnię", 5, `scene: 'kitchen/kitchen-stage-1'`), `renew-walls` ("Odnów
  ściany", 6, `scene: 'kitchen/kitchen-stage-2'`), `renew-floor` ("Odnów podłogę", 7, no `scene` → `kitchen/after`), then
  the six slots unchanged (84 in all); 23 kitchen WebP; a migrated finished kitchen is done with no problem reported.
- The salon's `before`/`after`/`shadows` WebP come from the cream files of the pack under their old output names; no row
  recolours a board; salon slots, furniture, worn grade and contact shadows unchanged.
- `?e2eSave=v6-kitchen` (hook build only) seeds the frozen v6 mid-kitchen save.
- `tests/e2e/house-1-polish.spec.ts` proves, in the rendered frame, the three kitchen stages and the exact balance, the
  migrated v6 kitchen keeping its renewed walls and furniture, and the salon's cream surround.
- CLAUDE.md "Current state" has one S-32 sentence including the save-format v7 statement; gap rows and follow-ups recorded.
- Deploy smoke at ship: `146 of 146 room pictures precached`.

### Key Discoveries:

- `src/core/migrations/*` never import `src/data`: the kitchen step carries its own constants (room id `kitchen`, shift 2)
  and must stay correct even when `KITCHEN` changes again later.
- Between phase 1 and phase 2 a migrated finished v6 kitchen reads `tasksDone 9` against the 7-task list
  (`roomStateProblems` → `tasks-overflow`). This exists only on the branch (never shipped); phase 1 records it as an
  explicit temporary expectation in `tests/fixtureLoadPath.test.ts`, phase 2 removes it (S-31 placement-exemption
  precedent).
- `tests/roomArt.test.ts` "leaves no file … without a table entry" means the two kitchen stage files, the `KITCHEN` stage
  tasks and the copy land in ONE phase (2).
- Keeping the salon output names (`architecture-before`, `architecture-after`, `shadows`) keeps `ROOM_SCENE_FILES.salon`,
  `tests/fixtures/room-art-salon.json` and the `**/assets/rooms/salon/shadows.webp` route of
  `tests/e2e/salon-load-health.spec.ts` meaningful (a rename would silently disarm that route).
- `tests/rooms.test.ts` "salon, kitchen, Mostek and Hangar keep the old before/after ternary at every tasksDone" fails once
  the kitchen stages carry `scene`; only `SALON` has an append-only order pin today.

## What We're NOT Doing

- No new background mechanism (scope.md); no change to `sceneKey`, `stageFade`, `RoomView`, `HouseView`, `SalonBackdrop`,
  `roomCapture`, `celebrationView`, `wornGrade`, the purchase flow.
- No per-room `listVersion` field, no appended stages, no inference from state (research alternatives b-d rejected).
- No salon task-list change, no salon-worn-v2 furniture layers (D5), no new salon crop or code-side shrink of its cell (D4).
- No refund and no charge for the two new kitchen stages for a migrated child (she already paid for the renewed result).
- No "Zapis gry" runtime note for the kitchen move (research Open Question 4: lossless and invisible).
- No retirement of `scripts/recolour-board.py`, `BOARD_*`, `recolourBoard` or `tests/recolourBoard.test.ts` (kept unused;
  follow-up).
- No cream `UI_ART` `salonAfter` thumbnail (the pack has none; follow-up).
- No atlas, no WebP quality change; no change to `balance.loader` numbers (only its stale byte comment).
- No S-33 laboratory, no change to Mostek, Hangar, children's room or bathroom.

## Implementation Approach

Migration first, behind a version, with frozen inputs and a hand-written oracle (tdd); then the kitchen list, copy and art
as data on S-25's mechanism (impl); then the salon art swap (impl); then the browser seam for the old save (impl); then
docs, gaps, follow-ups, seam sweep and the visual pass (impl, last); finally one browser spec (e2e).

**E2E rule for every phase (scope.md):** a phase runs only the specs it adds or edits — or names as affected — each with the
single-spec command from `context/foundation/test-stack.md` (`npx playwright test tests/e2e/<name>.spec.ts`, sandbox
disabled), never the full suite. The orchestrator runs the full suite (`npx playwright test --workers=4`) ONCE after phase 6
from a pinned worktree; expected `193 + 3` (phase 6 adds three tests; phases 1-5 edit, never add).

## Critical Implementation Details

- **State sequencing (phase 1 fixture).** `save-v6-kitchen-mid.json` is written by the v6 code BEFORE `SAVE_VERSION` moves
  (a throwaway scratchpad script, `freshSession` + the real `encodeSave`, stamped `generation`/`writer` as `guardedPut`
  would), committed, and proven a genuine v6 write by decode + re-encode on the v6 code in the same phase's first red step.
  Never typed by hand, never edited afterwards.
- **Timing (phase 1 → 2).** The `tasks-overflow` expectation in `fixtureLoadPath` is the only temporary test state; it is a
  literal with a comment naming phase 2, and phase 2 must turn it back into `[]` red-first.

## Phase 1: Save format v7 — the kitchen moves onto the staged list

Driver: tdd
Driver why: `MIGRATIONS[6]`, `SAVE_VERSION` 7 and the frozen v6 mid-kitchen input are absent; literal oracles (the frozen v6 files and a hand-written v7 file) lead them red-first.

### Overview

A frozen v6 save with a kitchen in progress is captured from the v6 code, then the version step v6 → v7 remaps the kitchen
by meaning. The kitchen data does NOT change in this phase.

### Changes Required:

#### 1. Frozen v6 input

**File**: `tests/fixtures/save-v6-kitchen-mid.json` (new, frozen from this phase on)

**Intent**: what a device stores today for a child mid-kitchen (walls renewed, two pieces bought).

**Contract**: produced by the v6 code (see Critical Implementation Details): house-1 with the four cells the S-31 build
writes (salon (0,0), kitchen (0,1), children (1,0), bathroom (1,1)), `currentRoom: 'kitchen'`, `rooms.salon` at
`tasksDone 12` with every salon slot chosen, `rooms.kitchen = { tasksDone: 3, chosen: { 'kitchen-counter': 1,
'kitchen-fridge': 2 } }`, a stars value, a learner, `variants`, `version: 6`, `generation`, `writer`.

#### 2. Frozen migration step

**File**: `src/core/migrations/kitchenStages.ts` (new, frozen)

**Intent**: lift v6 to v7 so a saved kitchen keeps its meaning on the 9-task list.

**Contract**: `LIFT_V6_KITCHEN_STAGES = (raw: unknown): unknown` — returns a new object `{ ...raw, version: 7 }`; when
`raw.rooms` is a plain object whose `kitchen` is a plain object with an integer `tasksDone ≥ 1`, the copy's
`rooms.kitchen` is `{ ...kitchen, tasksDone: kitchen.tasksDone + 2 }`; `tasksDone 0`, a missing kitchen, a missing
`rooms` or a malformed kitchen pass through unchanged (validation after the chain reports malformed data, as today). Never
mutates its input. Header comment: FROZEN, never edited; the old one-step `renovate` produced exactly `kitchen/after`, the
result of the new third stage; constants local (`'kitchen'`, `2`); never imports `src/data`; a v6 kitchen with
`tasksDone > 7` stays flagged `tasks-overflow` by the same +2 (research R2).

#### 3. Save core

**Files**: `src/core/types.ts`, `src/core/save.ts`

**Contract**: `SaveV7 extends Omit<SaveV6, 'version'> { version: 7 }`, `SaveState = SaveV7`; `SAVE_VERSION = 7`;
`MIGRATIONS[6] = LIFT_V6_KITCHEN_STAGES`; header comment and `saveProblem`/`validateSave` doc comments name v7.
`encodeSave`, `toSession`, `validRoom`, `copyRoom`, `freshSession` unchanged.

#### 4. Frozen v7 oracle, new and moved tests

**Files**: `tests/fixtures/save-v7.json` (new, frozen, hand-written: the mid fixture's literal content with `version: 7`
and `rooms.kitchen.tasksDone 5`, chosen unchanged), `tests/saveV7.test.ts` (new), `tests/saveV6.test.ts`,
`tests/save.test.ts`, `tests/saveV5.test.ts`, `tests/saveV4.test.ts`, `tests/saveFile.test.ts`, `tests/autosave.test.ts`,
`tests/legacySalonMigration.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/idbStore.test.ts`,
`tests/e2e/rooms-as-data.spec.ts`, `tests/e2e/first-building-choice.spec.ts`

**Contract**:
- `saveV7.test.ts`: `SAVE_VERSION` 7; `MIGRATIONS[6](save-v6-kitchen-mid)` deep-equals `save-v7.json` minus nothing;
  literal cases on synthetic v6 objects: kitchen `tasksDone 0 → 0`, `1 → 3`, `7 → 9` (chosen kept), `8 → 10`; no `rooms`,
  `rooms` without `kitchen` (a base save: `bridge` untouched), `kitchen.tasksDone` a string → unchanged apart from
  `version: 7`; input not mutated (deep-frozen input); `decodeSave(save-v6-kitchen-mid)` → `ok`, `migratedFrom: 6`,
  kitchen `{ tasksDone: 5, chosen: same }`, salon, stars, learner field-equal; `save-v7.json` decodes with
  `migratedFrom: null`; a `{ version: 8 }` save is `future`; `importProblem(save-v6-kitchen-mid)` null and `parseImport` of
  an exported v6 envelope yields kitchen `tasksDone 5`; a source guard that `kitchenStages.ts` imports nothing from
  `src/data` and does not mention `KITCHEN`.
- `saveV6.test.ts`: keeps the `MIGRATIONS[5]` meaning; "is the current version" moves to `saveV7`; "decodes the v6 base
  fixture without a migration" now expects `migratedFrom: 6` (bridge untouched); "meets a v7 save as future" becomes v8.
  The mid fixture is proven a genuine v6 write: on the v6 code (before the bump, the first red step) it decodes `ok`,
  `migratedFrom: null`, and re-encodes equal except the store-stamped `generation`/`writer`; record that run in the handoff.
- Pins: every `toBe(6)` / `version: 6` encode expectation / `v6of` helper moves to 7 (helpers renamed `v7of` or kept
  generic); the two e2e `SAVE_VERSION` pins become 7.
- `fixtureLoadPath`: title "writes v7"; `FIXTURES` gains `save-v6-kitchen-mid` and `save-v7`; every v6 fixture leaves
  `profile:default:backup-v6` equal to its raw bytes (`save-v7` leaves none); the two kitchen cases expect
  `moved.rooms.kitchen` = `{ ...raw.rooms.kitchen, tasksDone: raw.rooms.kitchen.tasksDone + 2 }` and — TEMPORARY, comment
  "S-32 phase 1: the 9-task kitchen list lands in phase 2, which restores []" — `roomStateProblems` equal to the one
  kitchen `tasks-overflow` problem (exact shape as the function returns it); a new case "save-v6-kitchen-mid stays in the
  kitchen with tasksDone 5 and its two pieces".
- `idbStore`: `readBackups` returns a stored `backup-v6`.

#### 5. Rollback note

**File**: `deploy/README.md` § "6. Deploy, rollback, status", **Rollback** bullet

**Contract**: a note "Uwaga (format v7, house-1-polish)" in the wording of the v6 note: a rollback below the v7 build shows
the `pl.saveFuture` card and overwrites nothing; the kitchen step runs once. Docs only; no script under `deploy/` changes.

### Success Criteria:

#### Automated Verification:

- `tests/saveV7.test.ts` and the new `fixtureLoadPath` case red against v6 (no `MIGRATIONS[6]`), green after; unit `baseline + N`
- Deliberate break: shift by 1 instead of 2 → the `1 → 3` literal and the `save-v7.json` deep-equal red; shift `tasksDone 0` too → the `0 → 0` case red; import `KITCHEN` into the step → the source guard red; leave `SAVE_VERSION` at 6 with `MIGRATIONS[6]` present → the version pin and "writes v7" red; each restored; meta-check: the v6 input is proven by the v6 code, the v7 oracle is a hand-written file, neither is computed by the step under test
- `git diff 98775f8 -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5*.json tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json tests/fixtures/save-v6-kitchen-done.json tests/fixtures/save-v6-children-done.json src/core/migrations/building.ts src/core/migrations/house.ts src/core/migrations/legacySalon.ts` empty
- `git diff --stat 98775f8 -- src/data public scripts src/ui src/scenes` empty; `git diff --stat 98775f8 -- deploy/` shows `deploy/README.md` only
- Single specs (sandbox disabled), never the full suite: `rooms-as-data`, `first-building-choice`, `save-migration` green
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); full e2e left to the orchestrator after phase 6

---

## Phase 2: The kitchen renovates in three stages (data, copy, art)

Driver: impl
Driver why: an art-script source override, two generated WebP files, a task list and two copy keys on S-25's mechanism, proven by the existing room-art/room-data invariants and the phase-1 exemption turning back — data and art glue.

### Overview

The kitchen gets the pack's two in-between backgrounds and its three stage tasks at the front; a migrated finished kitchen
is now consistent again.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/kitchen/kitchen-stage-{1,2}.webp` (generated)

**Contract**: a pack-root constant `HOUSE_1_POLISH = join(ROOT, 'designs/martynka-house-1-polish-v1')`; a `scene` entry of a
`ROOM_PACKS` row may be a string (from the row's `pack`, as today) or `{ pack, id, as? }` (from that pack, output name
`as ?? id`); `ROOM_JOBS` reads both forms; the pack-existence loop also checks every per-file pack. Kitchen row `scene` =
`['kitchen-before', 'kitchen-after', 'kitchen-shadows', { pack: HOUSE_1_POLISH, id: 'kitchen-stage-1' }, { pack:
HOUSE_1_POLISH, id: 'kitchen-stage-2' }]`. Doc comment of `ROOM_PACKS` updated. `convert()` settings unchanged; every other
output byte-identical. If `npm run art` fails for a tool or sandbox reason, re-run the one command with the sandbox disabled
(profile § 8); if it still fails the phase stops `STATUS: BLOCKED` with the error line — never hand-convert a WebP, never
write into `designs/`. Re-measure the two files' bytes against research (87 604 / 86 592 B).

#### 2. Room data and copy

**Files**: `src/data/rooms.ts`, `src/data/pl.ts`

**Contract**: `KITCHEN.tasks` = `{ kind: 'stage', id: 'clean-kitchen', label: 'cleanKitchen', cost: 5, scene:
'kitchen/kitchen-stage-1' }`, `{ kind: 'stage', id: 'renew-walls', label: 'renewWalls', cost: 6, scene:
'kitchen/kitchen-stage-2' }`, `{ kind: 'stage', id: 'renew-floor', label: 'renewFloor', cost: 7 }`, then the six slot
tasks unchanged. The list comment becomes: new tasks go at the END only, except through a save-format step (S-32 inserted
three stages at the front with v7, `MIGRATIONS[6]`); costs follow the children's stages (S-17 tunes). `pl.room.tasks` gains
`cleanKitchen: 'Posprzątaj kuchnię'`, `renewWalls: 'Odnów ściany'` (the pack's stage labels); `renewFloor` reused; `renovate`
stays (salon, bathroom, bridge, hangar). `ROOM_SCENE_FILES.kitchen` unchanged (stage keys come from the tasks).

#### 3. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-kitchen.json`, `tests/rooms.test.ts`,
`tests/roomsData.test.ts`, `tests/fixtureLoadPath.test.ts`, and every test the grep below finds

**Contract**:
- `roomArt`: kitchen count 21 → 23; `room-art-kitchen.json` gains the two entries written from the pack (key, url, 1920×1080,
  label from the copy), not dumped from `roomArt()`; weight per room still ≤ 1 550 000 B.
- `rooms.test.ts`: the kitchen leaves "… keep the old before/after ternary …" (title updated: salon, Mostek, Hangar, bathroom
  if it lists it); a staged-kitchen case: `sceneKey` for `tasksDone` 0..9 = `kitchen/before`, `kitchen/kitchen-stage-1`,
  `kitchen/kitchen-stage-2`, then `kitchen/after` ×7; `stageFade` at 1 and 2 names the previous key; `wornPieces` and
  `contactShadowPieces` empty for the kitchen at every `tasksDone` 0..9 (kids-room follow-up 2 / bathroom 11 pin).
- `roomsData.test.ts`: a kitchen order pin — literal ids `['clean-kitchen', 'renew-walls', 'renew-floor', 'place-counter',
  'place-fridge', 'place-kitchen-table', 'set-up-coffee', 'place-bench', 'set-out-dishes']` and costs `[5, 6, 7, 7, 9, 10, 12,
  13, 15]` (sum 84), with a comment that changing anything but the end needs a save-format step.
- `fixtureLoadPath`: the phase-1 temporary `tasks-overflow` expectations return to `roomStateProblems … toEqual([])` (red
  before the data change, green after); the kitchen-done and children-done landings unchanged otherwise.
- Specs: `grep -rlnE "KITCHEN|'kitchen'|kitchen/" tests/e2e` — every hit is run singly; the expected state is "stays true"
  (they derive costs and order from `KITCHEN.tasks`); any edit needs a reason recorded in the handoff as a table
  (spec / assertion / why), and an edit for a reason other than "the kitchen now has three stages" is a finding, not an edit.

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the two new `public/assets/rooms/kitchen/kitchen-stage-{1,2}.webp`
- `npx vitest run tests/roomArt.test.ts tests/rooms.test.ts tests/roomsData.test.ts tests/fixtureLoadPath.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: swap the two stage `scene` keys → the `sceneKey` literal red; delete `kitchen-stage-2.webp` → the size/orphan cases red; put `renovate` back as the first task → the order pin and the fixture `[]` cases red; each restored; meta-check: the order pin and the art fixture are literals from the pack and the plan, not from `KITCHEN`; whether each stage looks right is the visual pass (phase 5)
- `npm run build` then `grep -o "assets/rooms/kitchen/" dist/sw.js | wc -l` = 23
- `git diff --stat <phase-1 sha> -- src/core src/scenes src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar tests/fixtures/save-*.json` empty
- Every spec the phase-2 e2e grep names, run singly (sandbox disabled), green; full e2e left to the orchestrator after phase 6
- Full local gate green

#### Manual Verification:

- [reviewer] Polish-language read of the two new kitchen labels in `src/data/pl.ts` (imperative + accusative: "Posprzątaj kuchnię", "Odnów ściany", "Odnów podłogę"), each fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 146 of 146 room pictures precached` (SEEN at plan time in Deploy run 41330660160, job `deploy` 124920757998: `ok   precache covers room pictures — 144 of 144 room pictures precached`; expected 144 + 2; a row only the post-merge Deploy log proves is ticked by the orchestrator's docs PR, not on main)

---

## Phase 3: The salon on the cream surround (art)

Driver: impl
Driver why: three scene files swapped through the phase-2 per-file source with their old output names and the salon row's recolour switched off — art pipeline, no logic a failing test could lead.

### Overview

The salon's before, after and shadows backgrounds come from the polish pack. Nothing in the salon's data changes.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/salon/{architecture-before,architecture-after,shadows}.webp`
(regenerated)

**Contract**: salon row `scene` = `[{ pack: HOUSE_1_POLISH, id: 'salon-before-cream', as: 'architecture-before' }, { pack:
HOUSE_1_POLISH, id: 'salon-after-cream', as: 'architecture-after' }, { pack: HOUSE_1_POLISH, id: 'salon-shadows-cream',
as: 'shadows' }]`, `recolourBoard: false`; furniture and decor still from `SALON_V2`. `BOARD_COLOUR`, `BOARD_FILES`,
the `recolourBoard` field and `scripts/recolour-board.py` stay (no row uses them; follow-up). `ROOM_SCENE_FILES.salon`
unchanged. Re-measure the three files against research (75 794 / 70 842 / 68 792 B).

#### 2. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-salon.json` (only if a recorded size or label changes;
expected unchanged), and every spec the grep below finds

**Contract**: salon count stays 37; `bootBudget` salon ≤ 48 s (≈ 41.4 s). Specs: `grep -rlnE "assets/rooms/salon|isSalonPixel|backdropPixel|housePixel|worn|salon-style" tests/e2e`
— each hit run singly; expected "stays true" (no spec asserts a board colour, research § E); an edit needs a reason in the
handoff table.

### Success Criteria:

#### Automated Verification:

- `npm run art` then `git status --short public/assets` shows exactly the three modified salon files
- `npx vitest run tests/roomArt.test.ts tests/bootBudget.test.ts tests/recolourBoard.test.ts` green; unit `<phase-2 count> + 0` (no test added; the swap is proven by the art fixtures and the phase-6 cream pixel)
- Deliberate break: give the after entry `as: 'salon-after-cream'` → `npm run art` writes an orphan and `roomArt` "no file without a table entry" red; set the salon row `recolourBoard: true` → `npm run art` exits non-zero on the board-mask guard (or recolours the cream — either way the file differs from research's measured bytes); each restored and the art re-run; meta-check: what proves the cream is visible is the rendered pixel of phase 6, not these file checks
- `git diff --stat <phase-2 sha> -- src tests/fixtures/save-*.json public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar` empty (no source change; only the script and three salon files)
- Every spec the phase-3 e2e grep names, run singly (sandbox disabled), green, including `salon-load-health` (its `shadows.webp` route still matches) and `salon-style`; full e2e left to the orchestrator after phase 6
- Full local gate green

---

## Phase 4: An e2e seam for a saved v6 kitchen

Driver: impl
Driver why: one more frozen-fixture save seam on the `v5-salon` precedent, proven by the existing `e2eSave` unit cases and the build guard — test infrastructure glue.

### Overview

The hook build can start on the frozen v6 mid-kitchen save, so phase 6 can prove the move in the browser.

### Changes Required:

#### 1. Seam and marker

**Files**: `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `tests/e2eSave.test.ts`

**Contract**: `E2ESaveSeam` and `E2E_SAVE_SEAMS` gain `'v6-kitchen'`; `e2eSaveStore` serves `structuredClone(
save-v6-kitchen-mid.json)` for it (comment: frozen v6 bytes, a kitchen with walls renewed and two pieces, so the current
build meets a real v6 save and lifts it to v7); the doc comment listing seams gains it and its `v5-salon` entry says
"lifts it to v6 and on to v7" (plan review F2); `E2E_HOOK_MARKERS` gains
`'v6-kitchen'`; `e2eSave.test.ts` accepts `?e2eSave=v6-kitchen` and the store returns the fixture.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/e2eSave.test.ts` green (new case red before the seam); unit `<phase-3 count> + N`
- Deliberate break: drop `'v6-kitchen'` from `E2E_SAVE_SEAMS` → the new `e2eSave` case red; reference the string `'v6-kitchen'` from `src/main.ts` → `npm run build` fails on the `e2e hook:` guard; each restored; meta-check: the guard proves the seam is absent from `dist/` only because the marker is listed, phase 6 proves the seam works
- `npm run build` prints `e2e hook: absent (`; `grep -rl "v6-kitchen" dist/` empty
- `git diff --stat <phase-3 sha> -- src/core src/data src/scenes src/ui public scripts tests/fixtures` empty
- Full local gate green; no e2e in this phase (no spec touched; phase 6 uses the seam)

---

## Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-4 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/house-1-polish/follow-ups/review-fixes.md` (new),
`src/data/balance.ts` (comment only)

**Contract**: CLAUDE.md "Current state": ONE compact S-32 sentence — the kitchen in three stages (`clean-kitchen`,
`renew-walls`, `renew-floor`, 5/6/7, then the six slots, 84; art `kitchen-stage-{1,2}` from `martynka-house-1-polish-v1`
through the per-file `{ pack, id, as }` source of `ROOM_PACKS`), the salon on cream (three scene files from the same pack
under the old names, no board recolour, worn grade kept), and **save format v7** (`SAVE_VERSION` 7, `MIGRATIONS[6]`
`LIFT_V6_KITCHEN_STAGES` in `src/core/migrations/kitchenStages.ts`: a saved kitchen `tasksDone ≥ 1` +2, `backup-v6`,
frozen `save-v6-kitchen-mid.json` and `save-v7.json`, a pre-v7 build meets the save as `future`, `?e2eSave=v6-kitchen`),
follow-ups path; earlier wording that now misleads is fixed ("save format v6 now (`SAVE_VERSION` 6, S-28)" in the S-11
sentence, "KITCHEN … one stage", "the board around the diorama is `#BCD799`" in the salon-style sentence — say it was
until S-32). `balance.loader` byte comment refreshed with the measured room totals. Gap rows: 109 narrowed (the kitchen
now has in-between backgrounds), 203 (the kitchen joins the mid-renovation rule), 182 re-judged with the visual frames
(kitchen unchanged; the cream salon backdrop keeps ≈ two thirds visible), 169/171 noted (the worn grade now sits on the
worn-v2 cream before); new row 206 (the pack's README asks for the salon-worn-v2 furniture layers in the before state; the
game keeps the code grade, D5); new row 207 (the salon's tight corner crop fills its house cell more than the other rooms,
D4). Follow-ups with `Trigger:` lines: kids-room 2 / bathroom 11 re-recorded with a narrower trigger (a staged room that
has `worn` or `contactShadows`), pinned by phase 2; kitchen-room 19 / house-cross-section 12 re-recorded with the measured
salon share; final-art-salon "future slots appended at the end" re-recorded with the version-step exception;
final-art-salon F / gap 109 closed for the kitchen; salon-load-health M-6 / bathroom 10 (precache set grows by two room
pictures; service-worker install warning unchanged) re-recorded with the new count; audit-art-renderer script items
re-checked against the changed script; kitchen-room 4 / kids-room 12 / hangar 4 (pack thumbnails) carried with the note
that `UI_ART` `salonAfter` still shows the green board; NEW: retire `scripts/recolour-board.py`, `BOARD_*`,
`recolourBoard`, `tests/recolourBoard.test.ts` (`Trigger:` the next art-script change or an audit); NEW: cream salon
thumbnail (`Trigger:` the designer delivers thumbnails); kitchen-room 13 / hangar 8 (kitchen task wording owes the designer's
copy; `Trigger:` the next change to `src/data/rooms.ts` kitchen rows — FIRES in phase 2): re-recorded with the three new stage
labels named and the reviewer read of row 2.8 cited, the designer's wording still owed (plan review F3); NEW: an exported v6 file imported after v7 is migrated (proven by
unit), a v7 file on a v6 build is `future` (`Trigger:` a rollback); every other open follow-up whose `Trigger:` names a
file this slice changed — included, closed with evidence, or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers — `SAVE_VERSION` 6 or "v6" as the CURRENT format in comments of `src/`, `tests/`,
`scripts/`, `deploy/README.md`; `renovate` referenced for the kitchen; "New tasks go at the END of this list only" without
the exception; `BCD799` outside the script and its test; a second copy of the +2 rule outside `kitchenStages.ts` (tests use
literals, not a helper re-implementation); gap numbers cited in comments match the rows; no temporary `tasks-overflow`
expectation left (`grep -n "S-32 phase 1" tests` empty).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "SAVE_VERSION. 7|kitchenStages|save-v7|kitchen-stage|salon-before-cream" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/house-1-polish/follow-ups/review-fixes.md` ≥ 8; `grep -cE "^\| 20[67] " docs/design-gaps.md` = 2
- Seam sweep: `grep -rn "S-32 phase 1" tests` empty; `grep -rnE "SAVE_VERSION\)\.toBe\(6\)" tests` empty; `npm run art` then `git status --short public/assets` empty
- `git diff --stat <phase-4 sha> -- src/core src/scenes src/ui src/main.ts src/testing src/data/rooms.ts src/data/pl.ts src/data/curriculum tests/fixtures public scripts` empty, except comment-only lines the seam sweep fixed, each listed in the handoff (file / line / old → new wording); `git diff <phase-4 sha> -- src scripts | grep -E '^[+-][^+-]' | grep -vE '^[+-]\s*(//|/?\*)'` empty (plan review F2)
- Full local gate green; full e2e left to the orchestrator after phase 6

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: kitchen (1) before (task "Posprzątaj kuchnię"), (2) stage 1 clean (task "Odnów ściany"), (3) stage 2 walls (task "Odnów podłogę"), (4) after (task "Postaw szafki"), (5) fully furnished; (6) the cross-fade between stages under normal motion (one frame mid-fade) and under reduced motion; salon on cream (7) before (worn-v2 interior, code-graded furniture, contact shadows), (8) after furnished, (9) the salon before under the Canvas renderer (`canvasWash` over the new background); (10) the house cross-section with the salon done on cream and the kitchen mid-renovation (stage 2) framed, (11) the same with both done; (12) the salon room-done card miniatures, (13) the kitchen room-done card miniatures (four tiles); (14) the task-screen backdrop with the salon current (before and after), (15) with the kitchen current (judge gap 182); (16) a v6 kitchen loaded through `?e2eSave=v6-kitchen` (after look, two pieces, task "Postaw stół i krzesła"); (17) the kitchen under `?e2eArt=room` (stand-in boxes for the stage keys); compare (1)-(4) against `designs/martynka-house-1-polish-v1/screenshots/kitchen-stage-{0,1,2,3}.png`, (7)/(8) against `salon-{before,after}-comparison.png`, (11) against `house-four-rooms.png`
- [human] Accept save format v7 (overturns the run's starting decision "save stays v6", scope.md): `MIGRATIONS[6]` moves every saved kitchen onto the staged list (`tasksDone ≥ 1` +2, nothing lost, nothing charged twice); a rollback below this build shows existing players the "nowszy zapis" card until the roll-forward (`deploy/README.md` § 6)
- [human] Accept the kitchen stage costs 5/6/7 then 7/9/10/12/13/15 = 84 (children's stage split; a migrated child gets the two new stages without paying; S-17 tunes)
- [human] Accept the salon cell fill (D4, gap 207, checklist P2 on `martynka-house-1-polish-v1`): the salon keeps the pack's tight corner crop and fills its house cell more than the other rooms
- [human] Accept the salon before look (D5, gap 206): the pack's worn-v2 interior on cream under the code worn grade on the furniture, not the salon-worn-v2 furniture layers the pack README names — decided against the pack README, not the PRD
- [human] On a real tablet, installed and then offline: a child mid-kitchen on the old build updates and finds her walls and pieces still there; the kitchen stages and the cream salon draw
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4230 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41330660160, job `build` 124919859656, steps `Run npm test`: `Tests  4230 passed | 3 skipped (4233)` and `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds; ticked by the orchestrator's docs PR, not on main)

---

## Phase 6: Kitchen stages, the moved v6 kitchen and the cream salon in the browser — e2e (FR-033, FR-021, FR-038; #16, #2)

Driver: e2e
Driver why: the stage backgrounds, the migrated old save in a real IndexedDB boot and the cream surround exist only in the rendered frame and browser storage; built by phases 1-4, after the phase-5 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow, balance exact) and #2 (a save written by version N loads in N+1).

### Overview

One spec against the hook build modelled on `tests/e2e/kids-room.spec.ts` (stage pixels) and `tests/e2e/save-migration.spec.ts`
/ `first-building-choice.spec.ts` (`v5-salon` seam), reading the RENDERED frame (`renderedPixel`, profile § 8) for every
"is it visible" risk, never a texture.

### Changes Required:

#### 1. Spec

**Files**: `tests/e2e/house-1-polish.spec.ts` (new); `playwright.config.ts` (add `house-1-polish` to the `ROUND_SPEC`
alternation, project `chromium-hook`; no other field); helpers reused from `tests/e2e/support/` and `kids-room.spec.ts`
(move a helper to `support/` if both need it, test code only)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#16 S-32 FR-033 the kitchen renovates in three stages, each a new background in the rendered frame, then is furnished; the
  balance is exact` — `e2eStars` = salon + kitchen totals; finish the salon, "Dalej" → kitchen, `tasksDone 0`; a wall point
  (measured on the four WebP, recorded in a comment) reads the before colour, then after each stage purchase the stage-1,
  stage-2 and after colours (tolerance 12 per channel, each pair of consecutive looks differing ≥ 30 in a channel at that
  point); stars after each purchase = previous − cost (5, 6, 7, then the slots); the card appears at the end.
- `#2 S-32 FR-021 a v6 kitchen with renewed walls and two pieces opens on v7 unchanged to the eye` — `?e2eSave=v6-kitchen`;
  room `kitchen`, `tasksDone 5`, `chosen` = the fixture's, current task `place-kitchen-table`, `shown` counter/fridge
  variants = fixture; the wall point reads the AFTER colour (not before, not a stage); `save` reports `migratedFrom: 6`,
  the hook store log reaches `writtenVersion 7` with `ops` starting `['write', 'backup']` and exactly one `backup`, and
  `save.backup` is `'done'`. (Plan review F1: the `e2eSaveStore` log carries neither the backup's bytes nor its `from`, and a
  reload re-seeds the in-memory store with the v6 fixture, so byte equality of `backup-v6` and persistence across a reload
  are proven by the unit `fixtureLoadPath` cases, not by this spec; do not extend the hook to claim them.)
- `#2 S-32 FR-038 the salon stands on cream in the room and in the house cross-section` — a fresh house child in the salon:
  a board point outside the room box (measured on `architecture-before.webp`, e.g. a corner region, recorded) reads cream
  `(255, 245, 223)` ±12 in the room before and after the stage purchase; "Dom" → the same relative point inside the salon's
  `ground-left` cell reads cream ±12 and a point inside the room interior does not (> 40 in a channel).

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each test run alone with `-g`): swap the two kitchen stage `scene` keys → test 1 red; shift by 1 in `LIFT_V6_KITCHEN_STAGES` → test 2 red (stage-2 look, `tasksDone 4`); set the salon row back to `SALON_V2` with `recolourBoard: true` and re-run `npm run art` → test 3 red (green board); each restored (art re-run, `git status --short public/assets` empty); green after; meta-check: the colours are read from the rendered frame, so a layer covering the background would also fail
- `npx playwright test tests/e2e/house-1-polish.spec.ts --list` lists 3 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `193 + 3`, total equal to `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/saveV7.test.ts`: the step on the frozen v6 input vs the hand-written v7 oracle; literals 0/1/7/8, no kitchen, base save, malformed; no mutation; future v8; import; source guard (phase 1).
- Version pins and `fixtureLoadPath` (every fixture writes v7, `backup-v6`, the kitchen landings) (phases 1, 2).
- `tests/rooms.test.ts`, `tests/roomsData.test.ts`, `tests/roomArt.test.ts`: kitchen `sceneKey` per `tasksDone`, order/cost pin, art entries, worn/contact-shadow emptiness (phase 2).
- `tests/bootBudget.test.ts`, `tests/deployCheck.test.ts`: kitchen and salon budgets, picture count (phases 2, 3).
- `tests/e2eSave.test.ts`: the `v6-kitchen` seam (phase 4).

### Integration Tests:

- Deploy smoke: room pictures 146 of 146 (at ship).
- e2e: phase-6 spec; specs named by the phase 1-3 greps run singly; full suite once by the orchestrator after phase 6.

### Manual Testing Steps:

1. House child with enough `?e2eStars`: finish the salon (cream surround), "Dalej" → kitchen before; buy the three stages, watch each background; buy the six pieces.
2. "Dom" mid-kitchen → salon cell on cream, kitchen cell at its stage.
3. `?e2eSave=v6-kitchen` → kitchen after look, two pieces, next task "Postaw stół".
4. Task screen with salon / kitchen current → backdrop.
5. Tablet, installed, offline: stages and cream salon draw.

## Performance Considerations

Kitchen boot set grows by ≈ 174 KB (≈ 37.2 s against 48 s at 50 KB/s); the salon set shrinks slightly (≈ 41.4 s, still the
worst case). Precache grows by two files (≈ 0.17 MB). The migration is one object spread per load.

## Migration Notes

v6 → v7: `MIGRATIONS[6]` `LIFT_V6_KITCHEN_STAGES` (frozen): kitchen `tasksDone` `0 → 0`, `k ≥ 1 → k + 2`, `chosen` untouched,
no kitchen → unchanged; every other field passes through. The first write after the migration copies the raw v6 save to
`profile:default:backup-v6` (write-once). A rollback below the v7 build meets `future`, shows `pl.saveFuture` and overwrites
nothing (`deploy/README.md` § 6 note). Import of a v6 file migrates through `decodeSave`. Salon: no state change (art only).

## Known risks

- The phase-6 purchase run (salon 12 + kitchen 9 purchases) is load-sensitive; a timeout is judged with `--last-failed
  --workers=1` (profile § 8).
- The worn-v2 before under the code grade may look doubly worn (D5) — judged by the visual frames (7), (9).
- `npm run art` depends on local tools and the local-only `designs/` packs; a missing tool ends phase 2 or 3 as BLOCKED, never
  a hand-made WebP.
- Plan review F4 (migration audit, recorded): every kitchen state a v6 build can store was checked against the code —
  absent kitchen (salon in renovation, a base save `base-1`, a child who went back from the house to the base): untouched;
  `tasksDone 0` (moved in, nothing bought; `chosen` is `{}`): untouched; `1` (old stage only) → `3` (all three stages, after
  look, which the old stage showed); `2..6` with `chosen` slot keys (slot ids unchanged, `roomStateProblems`
  `chosen-not-bought` index check stays consistent because every slot index moves by the same +2); `7` done → `9` done
  (`currentRoom` `kitchen` or a later room unchanged; `nextRoom` at load as today); a kitchen visited in change mode is
  `visiting`, runtime only, never saved. The step runs only from v6 (`decodeSave` loops `from..SAVE_VERSION-1`), so it is
  applied once per save; a v5 save with a kitchen passes `MIGRATIONS[5]` then `[6]` (the kitchen list has not changed since
  S-22, `git log -S place-counter -- src/data/rooms.ts` = one commit). Import (`parseImport` → `decodeSave`) and the backup
  key (`backup-v${from}`, `readBackups` loops to `SAVE_VERSION - 1`) need no code. A pre-v7 build meets v7 as `future` and
  its `guardedPut` refuses with `NewerSave`. Residual: an older tab that writes v6 after this page wrote v7 is refused; an
  older tab that wrote v6 before this page's first write is overwritten by this page's own migrated memory (generic
  `olderWriter`, unchanged).
- Plan review F5: the phase-3 break "salon row `recolourBoard: true`" names two acceptable outcomes; the implementer records
  which one happened (exit code or the changed bytes) in the handoff.
- A child who finished the kitchen on v6 already moved on; the +2 keeps the kitchen done — proven by `fixtureLoadPath`
  (`save-v6-kitchen-done`, `save-v6-children-done`).

## Autonomous decisions

Maintainer decisions (scope.md), change.md D1-D6 and research R1-R5 are kept. Decided at this step (no `AskUserQuestion`;
complexity MEDIUM, 0 open product questions after research, structure decided from the artifacts: 6 phases, no UI component
added or edited):

- **P1 — save v7 with the meaning remap (R1, R2, D2)**, overturning scope.md's starting decision "save stays v6" with the
  evidence in research § A. Rejected: per-room `listVersion` (still needs a bump, `copyRoom` drops unknown keys), appending
  stages (contradicts FR-033 "najpierw ściany i podłoga"), inference (ambiguous at `tasksDone 1`). `[human]` row 5.7. Would
  change: the maintainer refusing a format step — then the stages could only be appended (a different product).
- **P2 — migration phase before the data phase, with one temporary `tasks-overflow` expectation** in `fixtureLoadPath`
  between them (S-31 placement-exemption precedent), rather than one combined phase (the step prompt requires the migration
  as its own tdd phase first). Would change: nothing; the intermediate state never ships.
- **P3 — fixtures: a NEW frozen `save-v6-kitchen-mid.json` (tasksDone 3, two pieces) as the mid-renovation input, the
  existing `save-v6-kitchen-done.json` as the finished input, a hand-written `save-v7.json` oracle**; the `tasksDone 1`
  boundary as a unit literal. Rejected: a mid fixture at `tasksDone 1` (covers no `chosen`). Would change: a bug only visible
  at the boundary in a real write (then add a second frozen fixture).
- **P4 — kitchen stage ids `clean-kitchen`, `renew-walls`, `renew-floor`**, labels `cleanKitchen`/`renewWalls` new and
  `renewFloor` reused (R5), costs 5/6/7 (D3). `[human]` row 5.8. Would change: S-17, the teacher read.
- **P5 — per-file `{ pack, id, as? }` scene source in `ROOM_PACKS`** (kitchen mixes packs, salon renames) rather than a
  row-level `scenePack` (covers only the salon). Would change: nothing foreseen.
- **P6 — keep salon output names (R3)**; keep `recolour-board.py` and its test unused with a follow-up (R4). Would change: an
  audit asking to trim the script now.
- **P7 — salon cell fill as the pack shows it (D4)**, gap 207, `[human]` row 5.9. Would change: the visual gate showing the cell
  clipped or the author ordering a recrop.
- **P8 — salon before = pack's worn-v2 cream interior + code worn grade (D5)**, against the pack README's furniture-layer
  advice (not the PRD), gap 206, `[human]` row 5.10. Would change: frames (7)/(9) showing a clash, or the author's answer to
  roadmap Unknown 3.
- **P9 — the browser proof of the old save uses a new `v6-kitchen` seam** (`v5-salon` precedent) in its own small phase 4,
  so the e2e phase only writes a spec. Would change: nothing.
- **P10 — no "Zapis gry" note for the kitchen move** (research Open Question 4). Would change: a playtest parent asking what
  changed.

## References

- Research: `context/changes/house-1-polish/research.md`; identity and decisions: `context/changes/house-1-polish/change.md`; run scope: `context/runs/2026-11-01-bathroom-polish-lab/scope.md`
- Format example: `context/archive/2026-11-01-bathroom-room/plan.md`; save-version precedent: `context/archive/2026-10-31-first-building-choice/plan.md` (phases 1-2); staged room: `context/archive/2026-11-01-kids-room/plan.md`
- Pack: `designs/martynka-house-1-polish-v1/manifest.json` (`rooms.kitchen.stages`, `rooms.salon`), `README.md`, `qa-report.json`, `screenshots/`
- Code: `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS`, `decodeSave`, `importProblem`), `src/core/migrations/building.ts` (`LIFT_V5_BUILDING`), `src/core/rooms.ts` (`sceneKey`, `stageFade`, `roomStateProblems`, `wornPieces`, `contactShadowPieces`), `src/data/rooms.ts` (`KITCHEN`, `CHILDREN`, `SALON`), `src/data/roomArt.ts` (`roomArt`, `ROOM_SCENE_FILES`), `src/data/pl.ts` (`room.tasks`), `scripts/make-task-art.mjs` (`ROOM_PACKS`, `ROOM_JOBS`), `src/testing/e2eHook.ts` (`E2E_SAVE_SEAMS`, `e2eSaveStore`), `vite/e2eHookGuard.mjs` (`E2E_HOOK_MARKERS`), `deploy/README.md` § 6
- PRD: `context/foundation/prd.md` FR-021, FR-033, FR-035, FR-038; test plan `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Save format v7 — the kitchen moves onto the staged list

#### Automated

- [x] 1.1 `tests/saveV7.test.ts` and the new `fixtureLoadPath` case red against v6 (no `MIGRATIONS[6]`), green after; unit `baseline + N` — 13cb528
- [x] 1.2 Deliberate break: shift by 1 instead of 2 → the `1 → 3` literal and the `save-v7.json` deep-equal red; shift `tasksDone 0` too → the `0 → 0` case red; import `KITCHEN` into the step → the source guard red; leave `SAVE_VERSION` at 6 with `MIGRATIONS[6]` present → the version pin and "writes v7" red; each restored; meta-check: the v6 input is proven by the v6 code, the v7 oracle is a hand-written file, neither is computed by the step under test — 13cb528
- [x] 1.3 `git diff 98775f8 -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5*.json tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json tests/fixtures/save-v6-kitchen-done.json tests/fixtures/save-v6-children-done.json src/core/migrations/building.ts src/core/migrations/house.ts src/core/migrations/legacySalon.ts` empty — 13cb528
- [x] 1.4 `git diff --stat 98775f8 -- src/data public scripts src/ui src/scenes` empty; `git diff --stat 98775f8 -- deploy/` shows `deploy/README.md` only — 13cb528
- [x] 1.5 Single specs (sandbox disabled), never the full suite: `rooms-as-data`, `first-building-choice`, `save-migration` green — 13cb528
- [x] 1.6 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); full e2e left to the orchestrator after phase 6 — 13cb528

### Phase 2: The kitchen renovates in three stages (data, copy, art)

#### Automated

- [x] 2.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the two new `public/assets/rooms/kitchen/kitchen-stage-{1,2}.webp` — d2b8c24
- [x] 2.2 `npx vitest run tests/roomArt.test.ts tests/rooms.test.ts tests/roomsData.test.ts tests/fixtureLoadPath.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-1 count> + N` — d2b8c24
- [x] 2.3 Deliberate break: swap the two stage `scene` keys → the `sceneKey` literal red; delete `kitchen-stage-2.webp` → the size/orphan cases red; put `renovate` back as the first task → the order pin and the fixture `[]` cases red; each restored; meta-check: the order pin and the art fixture are literals from the pack and the plan, not from `KITCHEN`; whether each stage looks right is the visual pass (phase 5) — d2b8c24
- [x] 2.4 `npm run build` then `grep -o "assets/rooms/kitchen/" dist/sw.js | wc -l` = 23 — d2b8c24
- [x] 2.5 `git diff --stat <phase-1 sha> -- src/core src/scenes src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar tests/fixtures/save-*.json` empty — d2b8c24
- [x] 2.6 Every spec the phase-2 e2e grep names, run singly (sandbox disabled), green; full e2e left to the orchestrator after phase 6 — d2b8c24
- [x] 2.7 Full local gate green — d2b8c24

#### Manual

- [ ] 2.8 [reviewer] Polish-language read of the two new kitchen labels in `src/data/pl.ts` (imperative + accusative: "Posprzątaj kuchnię", "Odnów ściany", "Odnów podłogę"), each fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [ ] 2.9 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 146 of 146 room pictures precached` (SEEN at plan time in Deploy run 41330660160, job `deploy` 124920757998: `ok   precache covers room pictures — 144 of 144 room pictures precached`; expected 144 + 2; a row only the post-merge Deploy log proves is ticked by the orchestrator's docs PR, not on main)

### Phase 3: The salon on the cream surround (art)

#### Automated

- [x] 3.1 `npm run art` then `git status --short public/assets` shows exactly the three modified salon files — b1d6f31
- [x] 3.2 `npx vitest run tests/roomArt.test.ts tests/bootBudget.test.ts tests/recolourBoard.test.ts` green; unit `<phase-2 count> + 0` (no test added; the swap is proven by the art fixtures and the phase-6 cream pixel) — b1d6f31
- [x] 3.3 Deliberate break: give the after entry `as: 'salon-after-cream'` → `npm run art` writes an orphan and `roomArt` "no file without a table entry" red; set the salon row `recolourBoard: true` → `npm run art` exits non-zero on the board-mask guard (or recolours the cream — either way the file differs from research's measured bytes); each restored and the art re-run; meta-check: what proves the cream is visible is the rendered pixel of phase 6, not these file checks — b1d6f31
- [x] 3.4 `git diff --stat <phase-2 sha> -- src tests/fixtures/save-*.json public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar` empty (no source change; only the script and three salon files) — b1d6f31
- [x] 3.5 Every spec the phase-3 e2e grep names, run singly (sandbox disabled), green, including `salon-load-health` (its `shadows.webp` route still matches) and `salon-style`; full e2e left to the orchestrator after phase 6 — b1d6f31
- [x] 3.6 Full local gate green — b1d6f31

### Phase 4: An e2e seam for a saved v6 kitchen

#### Automated

- [x] 4.1 `npx vitest run tests/e2eSave.test.ts` green (new case red before the seam); unit `<phase-3 count> + N` — 7a76b76
- [x] 4.2 Deliberate break: drop `'v6-kitchen'` from `E2E_SAVE_SEAMS` → the new `e2eSave` case red; reference the string `'v6-kitchen'` from `src/main.ts` → `npm run build` fails on the `e2e hook:` guard; each restored; meta-check: the guard proves the seam is absent from `dist/` only because the marker is listed, phase 6 proves the seam works — 7a76b76
- [x] 4.3 `npm run build` prints `e2e hook: absent (`; `grep -rl "v6-kitchen" dist/` empty — 7a76b76
- [x] 4.4 `git diff --stat <phase-3 sha> -- src/core src/data src/scenes src/ui public scripts tests/fixtures` empty — 7a76b76
- [x] 4.5 Full local gate green; no e2e in this phase (no spec touched; phase 6 uses the seam) — 7a76b76

### Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 5.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "SAVE_VERSION. 7|kitchenStages|save-v7|kitchen-stage|salon-before-cream" CLAUDE.md` present — e46d7f2
- [x] 5.2 `grep -c "Trigger:" context/changes/house-1-polish/follow-ups/review-fixes.md` ≥ 8; `grep -cE "^\| 20[67] " docs/design-gaps.md` = 2 — e46d7f2
- [x] 5.3 Seam sweep: `grep -rn "S-32 phase 1" tests` empty; `grep -rnE "SAVE_VERSION\)\.toBe\(6\)" tests` empty; `npm run art` then `git status --short public/assets` empty — e46d7f2
- [x] 5.4 `git diff --stat <phase-4 sha> -- src/core src/scenes src/ui src/main.ts src/testing src/data/rooms.ts src/data/pl.ts src/data/curriculum tests/fixtures public scripts` empty, except comment-only lines the seam sweep fixed, each listed in the handoff (file / line / old → new wording); `git diff <phase-4 sha> -- src scripts | grep -E '^[+-][^+-]' | grep -vE '^[+-]\s*(//|/?\*)'` empty (plan review F2) — e46d7f2
- [x] 5.5 Full local gate green; full e2e left to the orchestrator after phase 6 — e46d7f2

#### Manual

- [ ] 5.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: kitchen (1) before (task "Posprzątaj kuchnię"), (2) stage 1 clean (task "Odnów ściany"), (3) stage 2 walls (task "Odnów podłogę"), (4) after (task "Postaw szafki"), (5) fully furnished; (6) the cross-fade between stages under normal motion (one frame mid-fade) and under reduced motion; salon on cream (7) before (worn-v2 interior, code-graded furniture, contact shadows), (8) after furnished, (9) the salon before under the Canvas renderer (`canvasWash` over the new background); (10) the house cross-section with the salon done on cream and the kitchen mid-renovation (stage 2) framed, (11) the same with both done; (12) the salon room-done card miniatures, (13) the kitchen room-done card miniatures (four tiles); (14) the task-screen backdrop with the salon current (before and after), (15) with the kitchen current (judge gap 182); (16) a v6 kitchen loaded through `?e2eSave=v6-kitchen` (after look, two pieces, task "Postaw stół i krzesła"); (17) the kitchen under `?e2eArt=room` (stand-in boxes for the stage keys); compare (1)-(4) against `designs/martynka-house-1-polish-v1/screenshots/kitchen-stage-{0,1,2,3}.png`, (7)/(8) against `salon-{before,after}-comparison.png`, (11) against `house-four-rooms.png`
- [ ] 5.7 [human] Accept save format v7 (overturns the run's starting decision "save stays v6", scope.md): `MIGRATIONS[6]` moves every saved kitchen onto the staged list (`tasksDone ≥ 1` +2, nothing lost, nothing charged twice); a rollback below this build shows existing players the "nowszy zapis" card until the roll-forward (`deploy/README.md` § 6)
- [ ] 5.8 [human] Accept the kitchen stage costs 5/6/7 then 7/9/10/12/13/15 = 84 (children's stage split; a migrated child gets the two new stages without paying; S-17 tunes)
- [ ] 5.9 [human] Accept the salon cell fill (D4, gap 207, checklist P2 on `martynka-house-1-polish-v1`): the salon keeps the pack's tight corner crop and fills its house cell more than the other rooms
- [ ] 5.10 [human] Accept the salon before look (D5, gap 206): the pack's worn-v2 interior on cream under the code worn grade on the furniture, not the salon-worn-v2 furniture layers the pack README names — decided against the pack README, not the PRD
- [ ] 5.11 [human] On a real tablet, installed and then offline: a child mid-kitchen on the old build updates and finds her walls and pieces still there; the kitchen stages and the cream salon draw
- [ ] 5.12 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4230 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41330660160, job `build` 124919859656, steps `Run npm test`: `Tests  4230 passed | 3 skipped (4233)` and `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds; ticked by the orchestrator's docs PR, not on main)

### Phase 6: Kitchen stages, the moved v6 kitchen and the cream salon in the browser — e2e (FR-033, FR-021, FR-038; #16, #2)

#### Automated

- [x] 6.1 Spec red before (deliberate breaks, each test run alone with `-g`): swap the two kitchen stage `scene` keys → test 1 red; shift by 1 in `LIFT_V6_KITCHEN_STAGES` → test 2 red (stage-2 look, `tasksDone 4`); set the salon row back to `SALON_V2` with `recolourBoard: true` and re-run `npm run art` → test 3 red (green board); each restored (art re-run, `git status --short public/assets` empty); green after; meta-check: the colours are read from the rendered frame, so a layer covering the background would also fail — 89e442b
- [x] 6.2 `npx playwright test tests/e2e/house-1-polish.spec.ts --list` lists 3 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `193 + 3`, total equal to `npx playwright test --list | tail -1` — 89e442b
- [x] 6.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`) — 89e442b
