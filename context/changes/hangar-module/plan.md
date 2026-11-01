# Hangar with the rocket, the second module of the base — Implementation Plan

## Overview

Roadmap slice S-30 `hangar-module` (milestone M-03, Stream D "Baza kosmiczna"; PRD FR-047), autonomous run
`2026-10-31-space-base`, branch `feat/hangar-module` cut from `main` at `a4a0aee` (S-29 merge). Outcome: a child with the
space base, after Mostek, renovates the Hangar with the rocket (walls and floor, then rocket, rover, workbench, crates,
lamp and mat in 3 variants each); the module is building data plus art files, and the base cross-section shows it in its
second cell (`ground-right`).

Binding inputs: `context/runs/2026-10-31-space-base/scope.md` (maintainer decisions, orchestrator starting decisions),
`change.md` D1-D6, `research.md` R1-R5 (its Code References are the grounding). No lessons file exists in
`context/foundation/` (checked at this step), so no lesson is named in a phase.

**The point of the slice is the roadmap Risk: no code outside data and art.** No file under `src/scenes`, `src/core`,
`src/ui`, `src/main.ts` or `src/testing` changes. The only non-`src/data` code file is the art script
`scripts/make-task-art.mjs`. **Save format stays v6 (`SAVE_VERSION` 6), no migration;** one frozen fixture is ADDED
(`tests/fixtures/save-v6-bridge-done.json`, a v6 save as the S-29 build writes it with Mostek finished). A phase that finds
it must change a scene, core module, the save format, star income, mastery, curriculum, variants, task generators, the
salon, kitchen or Mostek data or pictures, `MINIGAME_WORDS` or `balance.loader` stops with `STATUS: BLOCKED` and records
why (that would be the roadmap Risk materialising).

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `4a420c2`:

- **The base is data.** `HOUSES` (`src/data/houses.ts`) has `base-1` = `[{ room: 'bridge', floor: 0, place: 0 }]`;
  `HOUSE_GEOMETRY['base-1']` already has four cells, `ground-right` (floor 0, place 1, 1060,636, 608×342) drawn as the
  closed airlock today.
- **A room is data.** `BRIDGE` (`src/data/rooms.ts`, `bridgeSlots` copied from the v1 manifest, costs 6/10/13/14/17/19/21
  = 100), `ROOMS`, `ROOM_SCENE_FILES.bridge` (`src/data/roomArt.ts`), `pl.room.{names,tasks,slots,variants}`
  (`src/data/pl.ts`); `ROOM_ART`, the precache, `precacheCovers('room pictures', …)` in `scripts/check-deploy.ts` and
  `tests/bootBudget.test.ts` (`it.each(Object.keys(ROOMS))`) all derive from `ROOMS`.
- **Flow is generic.** `RoomScene.moveAfterDone` → `nextRoom` → `roomInRenovation` (`src/core/house.ts`) picks the first
  known not-done room of the data house; `houseRoomList` builds the card tiles; at load `main.ts` runs
  `repairCurrentRoom` → `mergeHouse` → `nextRoom`, so a finished Mostek opens in the Hangar without re-showing the card
  (card set only in the purchase branch of `RoomScene`).
- **Art script.** `scripts/make-task-art.mjs` names only the v1 base pack, twice (`SPACE_BASE` and `SPACE`, the same
  path); the v2 pack `designs/bystrow-space-base-v2` (manifest `rooms.hangar`: three scene files and six slots × natural,
  sunny, mint) is not referenced. Cream `#FFF5DF` board → `recolourBoard: false` (bridge and kitchen rows).
- **Budget.** Measured WebP (research (b)): 21 Hangar files 606 452 B; a Hangar boot ≈ 1 495 564 B = 29.9 s vs 48 s
  (`balance.loader.totalMs` − 2 s headroom); salon stays the worst case (41.8 s). `tests/roomArt.test.ts` cap 1 550 000 B
  per room holds.
- **Tests that pin a one-room base** (expected edits, not regressions): `tests/roomsData.test.ts` "is the stage first,
  then six furniture tasks, and the only room of the base", "keeps the child in Mostek after the last task: Dalej stays";
  `tests/roomArt.test.ts` (`ROOM_ART` snapshot equality, "has 37 salon, 21 kitchen and 21 bridge entries");
  `tests/e2e/base-cross-section.spec.ts` "#16 #2 S-29 FR-046 … 'Dalej' stays in Mostek …"; and (found at plan review)
  `tests/houseCells.test.ts` "shows the bridge as current and the rest closed, also with the Mostek done", whose second
  expectation calls `houseCells(b(), base, 'bridge', () => true)`: with the Hangar row the all-done callback makes
  `ground-right` `done`, so that line flips to `['current', 'done', 'closed', 'closed']`.
- **Counts.** Contract baseline on `main` a4a0aee: unit 4185, e2e 187. CI lines seen at this step (gh, plain command) in
  Deploy run 41278603357: job `deploy` 124766298916 step `Smoke check (deploy)` prints
  `ok   precache covers room pictures — 79 of 79 room pictures precached`; job `build` 124765733845 prints
  `Tests  4182 passed | 3 skipped (4185)` (ANSI codes between `Tests` and the number) and `e2e hook: absent (2 chunks checked)`.

## Desired End State

- `HANGAR: RoomDef` in `src/data/rooms.ts` (stage + six slots from `designs/bystrow-space-base-v2/manifest.json`
  `rooms.hangar`, costs 6/10/13/14/17/19/21 = 100), in `ROOMS`; `ROOM_SCENE_FILES.hangar`; Polish copy in
  `pl.room.{names,tasks,slots,variants}`; 21 WebP under `public/assets/rooms/hangar/` made by `npm run art`.
- `HOUSES['base-1']` = Mostek then `{ room: 'hangar', floor: 0, place: 1 }`. After the last Mostek purchase the card shows
  two tiles (Mostek done, Hangar), "Dalej" opens the Hangar; after the last Hangar purchase the card shows the same two
  tiles done and "Dalej" keeps the child in the Hangar in change mode with "Baza". The cross-section shows Mostek done in
  `ground-left` and the Hangar framed in `ground-right`.
- A v6 save with Mostek finished (frozen fixture) loads into the Hangar with nothing lost.
- Deploy smoke: `100 of 100 room pictures precached` with no script change.
- Gap 196 edited (the last module is now the Hangar), gap 201 added (Hangar wording ours); CLAUDE.md "Current state" has
  one S-30 sentence; follow-ups recorded with `Trigger:` lines.
- `tests/e2e/hangar-module.spec.ts` proves the cross-section with two modules (rendered frame) and the Hangar bought to
  the end.

### Key Discoveries:

- `tests/roomArt.test.ts` "leaves no file … without a table entry" means the 21 WebP files, the `HANGAR` room, the scene-file
  row and the copy (labels) must land in ONE phase.
- Adding the Hangar to `ROOMS` alone keeps it unreachable (not in any house); only the `HOUSES` row (phase 2) changes what a
  child sees, so phase 1 keeps every e2e green.
- The `HOUSES` row flips `tests/e2e/base-cross-section.spec.ts` #16 ("Dalej" now moves to the Hangar): phase 2 edits it.

## What We're NOT Doing

- No change in `src/scenes`, `src/core`, `src/ui`, `src/main.ts`, `src/testing`, `vite/` (roadmap Risk).
- No third module, no "Wkrótce" teaser tile after the Hangar, no module-specific card title (D3; gap 196 stays open, narrowed).
- No e2e save seam for a finished-Mostek save (research R4): the frozen-fixture unit test plus the in-session e2e path prove it.
- No balance change; no `balance.loader` comment edit (decision P5); no change to Mostek costs, art or copy.
- No `roomArtCheck` wiring into `scripts/check-deploy.ts` (dead helper, research (e); recorded as a follow-up).
- No pack thumbnail for the Hangar (`thumbnail` optional, Mostek has none; kitchen-room follow-up 4 not fired).
- No save-format change, no migration, no `deploy/README.md` rollback line (research (d): an S-29 build sends a `hangar`
  child back to Mostek and keeps `rooms.hangar`).

## Implementation Approach

Room first (data, copy, art and their table tests, still unreachable), then the one `HOUSES` row that switches it on with
the flipped flow tests and the frozen-fixture proof, then docs, gaps, follow-ups, seam sweep and the visual pass, finally
one browser spec. Phases: impl, tdd, impl, e2e. No phase adds a UI component.

## Phase 1: The Hangar room as data, copy and art (unreachable)

Driver: impl
Driver why: art conversion through the script plus data rows copied from the pack manifest, proven by the existing room-art and room-data invariants — art pipeline and data glue.

### Overview

The Hangar exists as a room with its pictures and Polish text, precached and budget-checked, but no house lists it yet.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/hangar/*.webp` (21, generated)

**Intent**: convert the v2 pack like the Mostek pack (FR-047 "pliki grafiki").

**Contract**: a pack-root constant for `designs/bystrow-space-base-v2` (e.g. `SPACE_BASE_V2`); a `ROOM_PACKS` row
`{ room: 'hangar', pack: <v2 root>, scene: ['hangar-before', 'hangar-after', 'hangar-shadows'], decor: [], furniture:
hangar-<rocket|rover|workbench|crates|lamp|mat>-<natural|sunny|mint>, recolourBoard: false }`, same shape as the bridge
row. `convert()` settings unchanged; every other output byte-identical. Needs `cwebp` and Python with Pillow 12.1.0 +
numpy 2.4.3 (the salon recolour runs in the same script). The kit-existence loop covers the new root via `ROOM_PACKS`.

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`

**Intent**: the Hangar as a `RoomDef`, a sibling of `BRIDGE` (D1, D5).

**Contract**: `hangarSlots: SlotDef[]` copied slot by slot from `manifest.json` `rooms.hangar.slots` (id, x, y, width,
height, z, anchor, visibleRect; variants `hangar/hangar-<slot>-<natural|sunny|mint>`); manifest order and values:
rocket 754,254 321×532 z25; rover 1114,624 418×292 z40; workbench 404,434 384×292 z20; crates 264,544 183×242 z35; lamp
1384,404 212×276 z18; mat 664,644 552×270 z5. `HANGAR` = `id: 'hangar'`, `scene: { before: 'hangar/before', after:
'hangar/after', shadows: 'hangar/shadows' }`, `decor: []`, `worn: []`, `contactShadows: []` (README: no extra shadow
ellipses), tasks: stage `renovate` 6, then `place-rocket` 10, `place-rover` 13, `place-workbench` 14, `stack-crates` 17,
`place-work-lamp` 19, `lay-launch-mat` 21 (labels `placeRocket`, `placeRover`, `placeWorkbench`, `stackCrates`,
`placeWorkLamp`, `layLaunchMat`); a header comment naming the pack and FR-047 like the Mostek one. `ROOMS` gains
`[HANGAR.id]: HANGAR` after `BRIDGE`. `ROOM_SCENE_FILES.hangar` = `{ before: 'hangar-before', after: 'hangar-after',
shadows: 'hangar-shadows' }`.

#### 3. Polish copy (teacher read)

**File**: `src/data/pl.ts`

**Intent**: child-facing text with correct gender/number agreement (CLAUDE.md working rules; research (f)).

**Contract**:

| key | text |
|---|---|
| `room.names.hangar` | Hangar |
| `room.slots['hangar-rocket' / 'hangar-rover' / 'hangar-workbench' / 'hangar-crates' / 'hangar-lamp' / 'hangar-mat']` | rakieta / łazik księżycowy / stół warsztatowy / skrzynie z częściami / lampa warsztatowa / mata startowa |
| `room.variants` | rocket, lamp, mat: `['Naturalna', 'Słoneczna', 'Miętowa']`; rover, workbench: `['Naturalny', 'Słoneczny', 'Miętowy']`; crates: `['Naturalne', 'Słoneczne', 'Miętowe']` |
| `room.tasks` | `placeRocket` Postaw rakietę · `placeRover` Postaw łazik · `placeWorkbench` Postaw stół warsztatowy · `stackCrates` Ustaw skrzynie z częściami · `placeWorkLamp` Postaw lampę · `layLaunchMat` Połóż matę startową |

A comment cites design gap 201 (the pack gives only masculine family labels; the agreed forms and task labels are ours).
`renovate` ("Odnów ściany i podłogę") is reused.

#### 4. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-hangar.json` (new snapshot), `tests/roomsData.test.ts`,
`tests/roomHit.test.ts`

**Contract**: snapshot equality adds `roomArt(ROOMS.hangar)` = the new fixture (written from the pack, not dumped from
`roomArt()`: keys and urls from the manifest file names, width/height from the source PNG sizes, labels from the caption
table below) and `ROOM_ART` = salon + kitchen + bridge +
hangar; the count case names "21 hangar entries"; a `describe('hangar data (FR-047)')` with a manifest literal
(`[id, x, y, width, height, z]` per slot, written from the manifest, not from `hangarSlots`), stage first then six slot
tasks, costs `[6, 10, 13, 14, 17, 19, 21]` summing to 100, every slot bought once; `unreachableSlots` (`src/core/roomHit.ts`)
over the Hangar with all six bought = `[]`. The existing invariants (`it.each` over `ROOMS`: inside the scene, distinct z,
copy for every slot/variant/task, stand-in labels without `-`/`/`, per-room weight, boot budget) cover the rest.

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/hangar/`
- `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `4185 + N`
- Deliberate break: change the rover's `x` in `hangarSlots` → the manifest literal red; delete `hangar-mat-mint.webp` → the size/orphan cases red; drop `'hangar-crates'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `hangarSlots`; the art cases prove files and tables agree, the picture looking right is the visual pass (phase 3)
- `npm run build` then `grep -o "assets/rooms/hangar/" dist/sw.js | wc -l` = 21 (sw.js is one line)
- `git diff --stat a4a0aee -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/bridge` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `187 + 0`

#### Manual Verification:

- [reviewer] Teacher read of the Hangar copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun's gender/number (skrzynie plural → Naturalne), task labels in imperative + accusative (rakietę, matę startową), each task label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` is not affected (no task content changed), stated in the handoff
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 100 of 100 room pictures precached` (line seen verbatim at plan time in Deploy run 41278603357, job `deploy` 124766298916: `ok   precache covers room pictures — 79 of 79 room pictures precached`; expected after this slice: 100 of 100)

---

## Phase 2: The Hangar joins the base

Driver: tdd
Driver why: the `HOUSES` row is absent and the flipped flow tests (Dalej moves to the Hangar, cells, the finished-Mostek fixture) lead it red-first — pure data contracts.

### Overview

One data row puts the Hangar in `ground-right`; "Dalej" after Mostek leads into it; a saved finished Mostek opens there.

### Changes Required:

#### 1. House row

**File**: `src/data/houses.ts`

**Intent**: D2 — the v2 README places the Hangar at (1060,636), the existing `ground-right` cell.

**Contract**: `HOUSES['base-1'].rooms` = `[{ room: 'bridge', floor: 0, place: 0 }, { room: 'hangar', floor: 0, place: 1 }]`;
any comment saying the base has one module is updated.

#### 2. Frozen fixture

**File**: `tests/fixtures/save-v6-bridge-done.json` (new, frozen)

**Contract**: a v6 save as the S-29 build writes it: `house` `{ id: 'base-1', rooms: [bridge only] }`, `currentRoom:
'bridge'`, `rooms.bridge` `tasksDone: 7` with a chosen variant for each of the six slots, a stars value, a learner (copy
the shape of `tests/fixtures/save-v6.json`). Never edited after this phase.

#### 3. Tests

**Files**: `tests/roomsData.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`,
`tests/e2e/base-cross-section.spec.ts`

**Contract**:
- `roomsData`: "the only room of the base" → `houseRoomList(base-1)` = `[{ room: 'bridge' }, { room: 'hangar',
  unlockAfter: 'bridge' }]` (the shape `houseRoomList` in `src/core/house.ts` returns for a second room); "Dalej stays in Mostek" → after the last Mostek task `nextRoom` moves to `hangar`
  (`movedFrom: 'bridge'`); new "keeps the child in the Hangar after its last task: Dalej stays" (gap 196 moved, D3).
- `houseCells`: base with Mostek current and nothing done → `['current', 'closed', 'closed', 'closed']` (unchanged); the
  existing "also with the Mostek done" line (today `() => true`) becomes `doneSet('bridge')` (Mostek done, Hangar not) →
  `['current', 'closed', 'closed', 'closed']`, and the test title stays honest (a known room not reached is closed); with
  `currentRoom 'hangar'` and Mostek done → `['done', 'current', 'closed', 'closed']`, `ground-right` room `hangar`.
- `fixtureLoadPath`: `save-v6-bridge-done` joins `FIXTURES` (round-trip, nothing dropped); a case in the FR-049 block
  mirrors `main.ts`'s load order (`repairCurrentRoom` → `mergeHouse` → `nextRoom`) and expects house `base-1` with both
  cells, `currentRoom 'hangar'`, `rooms.bridge` equal to the fixture's, stars kept.
- e2e `base-cross-section.spec.ts` #16: title becomes `#16 #2 S-29 S-30 FR-046 FR-047 after the last Mostek purchase the
  card hides "Baza"; "Dalej" moves to the Hangar; a reload keeps it`; after `cardNext` room `hangar`, `houseLabel 'Baza'`;
  the house view has `ground-left` `done` and `ground-right` `current`; after reload `roomSwitch` → room `hangar`, not
  done, house `base-1`. The card-hides-"Baza" and stars-keep-growing assertions stay.

### Success Criteria:

#### Automated Verification:

- The flipped and new unit cases red before the `HOUSES` row exists, green after; unit `<phase-1 count> + N`
- Deliberate break: give the Hangar row `place: 2` → the `houseCells` case red; drop the row → the roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts`, so a reorder in `main.ts` would not be caught here — the e2e reload in #16 is the browser proof of the same path
- `npx playwright test tests/e2e/base-cross-section.spec.ts` (sandbox disabled) green, 3 tests
- `git diff --stat <phase-1 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/core/save.ts src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h -- tests/fixtures/save-v6.json` unchanged by this slice
- Full local gate green; e2e (orchestrator, `--workers=4`) `187 + 0`

---

## Phase 3: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-2 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/hangar-module/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-30 sentence (the Hangar `hangar` as the base's second module:
`HANGAR` in `src/data/rooms.ts`, 7 tasks costing 6-21 = 100, art from `bystrow-space-base-v2` in
`public/assets/rooms/hangar/`, the `HOUSES['base-1']` row in `ground-right`, no code outside data and the art script,
save v6 unchanged, frozen `save-v6-bridge-done.json`), and the S-28/S-29 wording that the Mostek is the base's only/last
module updated. Gap row 201: the kit has no Hangar wording (task labels, agreed variant forms are ours). Row 196: the last
module is now the Hangar (Mostek's card shows the Hangar tile and "Dalej" leads to it). Follow-ups with `Trigger:` lines:
base-cross-section 5 (narrowed; trigger "a third base module or a designer answer for the last-module celebration");
atlas (kitchen-room 5 / first-building-choice 5: not fired, Hangar boot 29.9 s vs 48 s, carried); kitchen-room 4
(thumbnails, not fired, carried); `FIRST_ROOM` (first-building-choice 18 / base-cross-section 8, not fired, carried);
the unused `roomArtCheck` (new, trigger "the next change to `scripts/check-deploy.ts`"); every other open follow-up whose
`Trigger:` names a file or set this slice changed (`src/data/rooms.ts`, `src/data/houses.ts`, `src/data/roomArt.ts`,
`src/data/pl.ts`, `scripts/make-task-art.mjs`) — included, closed with evidence, or re-recorded. Kitchen-room 6 ("the
precache set") is already closed (first-building-choice follow-up 6, house-cross-section added the install warning) and
audit-art-renderer 2 (`make-task-art.mjs` without `-I`) is already closed (house-cross-section follow-ups): cite, do not
reopen.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers — the duplicate v1 constants `SPACE_BASE` / `SPACE` in `scripts/make-task-art.mjs`
(merge into one, outputs byte-identical); wording "only room of the base", "only module", "no next module", "Mostek has
no next room", "until S-30", "S-30 adds" in `src/`, `tests/`, `scripts/`; gap numbers cited in comments match the rows; a
duplicated `[6, 10, 13, 14, 17, 19, 21]` literal outside data/tests; `pl.ts` comment for the Hangar cites row 201.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "HANGAR|save-v6-bridge-done|assets/rooms/hangar" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/hangar-module/follow-ups/review-fixes.md` ≥ 5; `grep -cE "^\| 201 " docs/design-gaps.md` = 1
- Seam sweep: `grep -rnE "until S-30|S-30 adds|only room of the base" src tests scripts` empty; `grep -c "bystrow-space-base-v1'" scripts/make-task-art.mjs` = 1; `npm run art` then `git status --short public/assets` empty (byte-identical after the merge of the constants)
- `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `187 + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the Mostek room-done card with two tiles (Mostek done, Hangar next); (2) the Hangar at the start after "Dalej" (before look, first task "Odnów ściany i podłogę"); (3) the Hangar variant panel open on the rocket (three thumbnails, Polish captions); (4) the Hangar fully furnished in the natural family; (5) the Hangar room-done card (two tiles done, no teaser, no "Baza" button); (6) the Hangar after "Dalej" (change mode and "Baza"); (7) the base cross-section with Mostek done in `ground-left` and the Hangar framed in `ground-right`; (8) the Hangar under `?e2eArt=room` (stand-in boxes with Polish labels); compare (4) against `designs/bystrow-space-base-v2/screenshots/hangar-after-natural.png`, (7) against `designs/bystrow-space-base-v2/screenshots/base-with-two-modules.png`, (2) against `designs/bystrow-space-base-v2/previews/hangar-before.png`
- [human] Accept the Hangar costs 6/10/13/14/17/19/21 = 100 stars (roadmap unknown "Ceny Hangara", owner: author; decision D1, S-17 tunes)
- [human] Accept the Hangar wording (gap 201): "stół warsztatowy" (pack label) instead of the roadmap's "stół z narzędziami", "Postaw lampę", the agreed variant forms; and the Hangar as the base's last module (card with two tiles, no teaser, "Dalej" stays, gap 196, D3)
- [human] On a real tablet, installed and then offline: a base child who finished Mostek opens the Hangar and its pictures draw (precache)
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4182 + N> passed | 3 skipped` and `e2e hook: absent (` (as seen at plan time in Deploy run 41278603357, job `build` 124765733845: `Tests  4182 passed | 3 skipped (4185)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

---

## Phase 4: The Hangar in the browser — e2e (FR-047; #16, #2)

Driver: e2e
Driver why: the risk exists only in the rendered cross-section and the purchase flow across two modules (the Hangar picture in `ground-right`, the card tiles, the balance); built by phases 1-2, after the phase-3 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow, balance exact) and #2 (the module survives a reload).

### Overview

One spec against the hook build modelled on `tests/e2e/base-cross-section.spec.ts`, reading the rendered frame for the
"visible" risk (profile § 8), not a texture.

### Changes Required:

#### 1. Purchase helper (test code only)

**File**: `tests/e2e/support/hook.ts` (or a sibling support file)

**Contract**: `buyAllTasks(page, room: RoomDef)` — the loop of `base-cross-section.spec.ts` #16 (task button, first
thumbnail, "Wybieram", poll `tasksDone`), reused by #16 there and by the new spec. No product code.

#### 2. Spec

**Files**: `tests/e2e/hangar-module.spec.ts` (new); `playwright.config.ts` (add `hangar-module` to the `ROUND_SPEC`
alternation, project `chromium-hook`; no other field)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#2 S-30 FR-047 the base shows Mostek done and the Hangar framed in its second cell; a tap returns to the Hangar` —
  `passWelcome(…, 'space')` with `e2eStars` = Mostek total, buy Mostek, "Dalej" → room `hangar`, `tasksDone 0`; "Baza" →
  `houseView` cells `['done', 'current', 'closed', 'closed']` with `ground-right` room `hangar`; `renderedPixel` at a point
  inside `ground-right` where the Hangar miniature and the base airlock differ by more than 40 in a channel (point and
  colour chosen from the pack PNGs, recorded in a comment) is NOT the airlock colour; tap `ground-left` → room `bridge`
  visiting, back; tap `ground-right` → room `hangar`, `visiting` null; reload → room `hangar`.
- `#16 S-30 FR-047 the Hangar is bought to the end: the card shows Mostek and Hangar with no teaser; "Dalej" stays in the
  Hangar with change mode; the balance is exact` — `e2eStars` = Mostek total + Hangar total (200), buy both modules;
  Hangar card `items` = two `room` items (`bridge`, `hangar`), both `done`, no `teaser`; balance 0 after the last
  purchase (the save's stars, not the counter label); "Dalej" → room `hangar`, mode button present, `houseLabel 'Baza'`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`): move the Hangar row to `place: 2` → test 1 red; add a third unknown room to `HOUSES['base-1']` → test 2 red (teaser appears); set a Hangar cost to 22 → test 2's balance red; point `ROOM_SCENE_FILES.hangar.after` at the before file → test 1's pixel red (or record why the miniature point does not see it and pick a point that does); each restored; green after
- `npx playwright test tests/e2e/hangar-module.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green; `base-cross-section.spec.ts` green with the shared helper; full e2e (orchestrator, `--workers=4`) `187 + 2`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/roomsData.test.ts`: Hangar manifest literal, costs 100, base room list, "Dalej" into and inside the Hangar (phases 1, 2).
- `tests/roomArt.test.ts`: snapshot, 21 entries, sizes, orphans, labels, weight (phase 1).
- `tests/houseCells.test.ts`: base cell states with the Hangar (phase 2).
- `tests/fixtureLoadPath.test.ts`: `save-v6-bridge-done` round-trip and load into the Hangar (phase 2).
- `tests/bootBudget.test.ts`, `tests/roomHit.test.ts`: Hangar covered by `ROOMS` iteration / one explicit case.

### Integration Tests:

- Deploy smoke: `room pictures` 100 of 100 (proven at ship, no script change).
- e2e: phase-4 spec; `base-cross-section.spec.ts` (#16 edited in phase 2) and `first-building-choice.spec.ts` stay green.

### Manual Testing Steps:

1. Base child with `?e2eStars=100`: buy Mostek → card with two tiles → "Dalej" → Hangar before look.
2. "Baza" → Mostek done left, Hangar framed right → tap the Hangar.
3. `?e2eStars=200`: finish both → Hangar card, "Dalej" stays with change mode.
4. Tablet, installed, offline: the Hangar pictures draw.

## Performance Considerations

Boot loads only the room in renovation: a Hangar boot ≈ 1 495 564 B = 29.9 s at 50 KB/s against 48 s; the salon stays
the worst case. Precache grows by about 606 KB. Runtime: the Hangar art loads behind the Mostek card reveal through
`roomArtLoader` (from the precache).

## Migration Notes

None. Save v6 already carries `house`, `rooms`, `currentRoom`; the load path rebuilds the house from data and `nextRoom`
moves a finished Mostek to the Hangar. Rollback to the S-29 build: `repairCurrentRoom` sends `hangar` back to Mostek,
`mergeHouse` keeps the saved cell, `rooms.hangar` stays (research (d)); no `deploy/README.md` line.

## Known risks

- The Hangar miniature in `ground-right` may read poorly at 608×342 (dark rocket on a dark floor); visual frame (7) and the
  `[human]` rows decide; would change: a designer re-export.
- The phase-4 purchase runs (7 and 14 buys) are load-sensitive; a timeout is judged with `--last-failed --workers=1`
  (scope process limits).
- A child who finished Mostek before S-30 meets the Hangar at the next start without the celebration that announces it
  (card only at purchase; S-22 precedent for the kitchen); would change: a playtest note.

## Autonomous decisions

Maintainer decisions (scope.md), D1-D6 (change.md) and R1-R5 (research) are kept; none is overturned. Decided at this step
(no `AskUserQuestion`; the skill's complexity and structure confirmations were decided from the artifacts: LOW-MEDIUM
complexity, 0 open product questions after research, 4 phases):

- **P1 — task labels as research recommended** ("Postaw rakietę", "Postaw łazik", "Postaw stół warsztatowy", "Ustaw
  skrzynie z częściami", "Postaw lampę", "Połóż matę startową"; keys `placeRocket` … `layLaunchMat`). Rejected: "Powieś
  lampę" (the sprite stands), "stół z narzędziami" (pack label wins, D5). Would change: the teacher read in phase 1 or a
  designer's wording; `[human]` row 3.3.
- **P2 — the frozen fixture `save-v6-bridge-done.json` plus a load-order mirror test** instead of an e2e save seam (R4).
  Rejected: a `?e2eSave=v6-bridge-done` seam (code in `src/testing/e2eHook.ts` and `vite/e2eHookGuard.mjs`, against the
  roadmap Risk). Would change: a bug in the `main.ts` load order that the mirror test cannot see.
- **P3 — the Hangar room lands unreachable in phase 1, the `HOUSES` row alone in phase 2** so each phase is green and the
  e2e flip is one reviewed edit. Rejected: one data phase (mixes art conversion with the flow flip). Would change: nothing.
- **P4 — the existing S-29 e2e #16 is edited in phase 2 (not deleted)** to "Dalej moves to the Hangar": it keeps the
  card-hides-"Baza" and stars proofs; the new spec covers the Hangar's own end. Would change: nothing.
- **P5 — no `balance.loader` comment clause.** The comment already says `tests/bootBudget.test.ts` checks every room as the
  worst case; the salon stays the worst. Rejected: a clause with Hangar numbers (balance.ts in a data-only slice's diff
  for no runtime change). Would change: the Hangar becoming the heaviest room.
- **P6 — `buyAllTasks` helper extracted in the e2e phase** (test code), used by both specs. Would change: nothing.
- **P7 — `[human]` rows** carry the author-owned unknown (costs, roadmap "Owner: autor"), the copy deviation from the
  roadmap wording and the last-module behaviour. No deviation from the PRD's literal text (FR-047 names only "Hangar z
  rakietą … drugim modułem bazy"), so no PRD `[human]` row is needed.

## References

- Research: `context/changes/hangar-module/research.md`; identity and decisions: `context/changes/hangar-module/change.md`; run scope: `context/runs/2026-10-31-space-base/scope.md`
- Format example: `context/archive/2026-11-01-base-cross-section/plan.md`; follow-ups `context/archive/2026-11-01-base-cross-section/follow-ups/review-fixes.md` (5), `context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md` (4, 5, 6), `context/archive/2026-10-31-first-building-choice/follow-ups/review-fixes.md` (5, 18)
- Pack: `designs/bystrow-space-base-v2/manifest.json` (`rooms.hangar`), `README.md`, `screenshots/base-with-two-modules.png`, `screenshots/hangar-after-*.png`, `previews/hangar-before.png`
- Code: `src/data/rooms.ts` (`BRIDGE`, `ROOMS`), `src/data/houses.ts` (`HOUSES`), `src/data/roomArt.ts` (`ROOM_SCENE_FILES`), `src/data/pl.ts` (`room`), `scripts/make-task-art.mjs` (`ROOM_PACKS`, `SPACE_BASE`, `SPACE`), `src/core/house.ts` (`nextRoom`, `mergeHouse`, `houseRoomList`), `src/main.ts` (load branch), `tests/e2e/base-cross-section.spec.ts` (#16)
- PRD: `context/foundation/prd.md` FR-047; test plan `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: The Hangar room as data, copy and art (unreachable)

#### Automated

- [x] 1.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/hangar/` — 041e279
- [x] 1.2 `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `4185 + N` — 041e279
- [x] 1.3 Deliberate break: change the rover's `x` in `hangarSlots` → the manifest literal red; delete `hangar-mat-mint.webp` → the size/orphan cases red; drop `'hangar-crates'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `hangarSlots`; the art cases prove files and tables agree, the picture looking right is the visual pass (phase 3) — 041e279
- [x] 1.4 `npm run build` then `grep -o "assets/rooms/hangar/" dist/sw.js | wc -l` = 21 (sw.js is one line) — 041e279
- [x] 1.5 `git diff --stat a4a0aee -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/bridge` empty — 041e279
- [x] 1.6 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `187 + 0` — local gate green at 041e279, e2e left to the orchestrator — orchestrator e2e at 987232b: 181 passed + 6 load timeouts, `--last-failed --workers=1` 6 passed → 187 + 0

#### Manual

- [x] 1.7 [reviewer] Teacher read of the Hangar copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun's gender/number (skrzynie plural → Naturalne), task labels in imperative + accusative (rakietę, matę startową), each task label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` is not affected (no task content changed), stated in the handoff — impl review: six captions nominative, variant forms agree (rakieta/lampa/mata -a, łazik/stół -y, skrzynie -e), labels imperative + accusative, the longest ("Ustaw skrzynie z częściami", 26 chars) is shrunk by `labelScale`, never cut; `sample` E1-E6 0 violations
- [ ] 1.8 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 100 of 100 room pictures precached` (line seen verbatim at plan time in Deploy run 41278603357, job `deploy` 124766298916: `ok   precache covers room pictures — 79 of 79 room pictures precached`; expected after this slice: 100 of 100)

### Phase 2: The Hangar joins the base

#### Automated

- [x] 2.1 The flipped and new unit cases red before the `HOUSES` row exists, green after; unit `<phase-1 count> + N` — de5ab57
- [x] 2.2 Deliberate break: give the Hangar row `place: 2` → the `houseCells` case red; drop the row → the roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts`, so a reorder in `main.ts` would not be caught here — the e2e reload in #16 is the browser proof of the same path — de5ab57
- [x] 2.3 `npx playwright test tests/e2e/base-cross-section.spec.ts` (sandbox disabled) green, 3 tests — de5ab57
- [x] 2.4 `git diff --stat <phase-1 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/core/save.ts src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h -- tests/fixtures/save-v6.json` unchanged by this slice — de5ab57
- [x] 2.5 Full local gate green; e2e (orchestrator, `--workers=4`) `187 + 0` — orchestrator e2e at 987232b: 181 passed + 6 load timeouts, `--last-failed --workers=1` 6 passed → 187 + 0

### Phase 3: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 3.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "HANGAR|save-v6-bridge-done|assets/rooms/hangar" CLAUDE.md` present — 862dca7
- [x] 3.2 `grep -c "Trigger:" context/changes/hangar-module/follow-ups/review-fixes.md` ≥ 5; `grep -cE "^\| 201 " docs/design-gaps.md` = 1 — 862dca7
- [x] 3.3 Seam sweep: `grep -rnE "until S-30|S-30 adds|only room of the base" src tests scripts` empty; `grep -c "bystrow-space-base-v1'" scripts/make-task-art.mjs` = 1; `npm run art` then `git status --short public/assets` empty (byte-identical after the merge of the constants) — 862dca7
- [x] 3.4 `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty — 862dca7
- [x] 3.5 Full local gate green; e2e (orchestrator, `--workers=4`) `187 + 0` — local gate green (unit 4194 + 0), e2e left to the orchestrator — 862dca7 · orchestrator e2e at 702b130: `--workers=3` 181 passed + 8 load timeouts (Codex running), `--last-failed --workers=1` 8 passed → 189 = 187 + 2

#### Manual

- [x] 3.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the Mostek room-done card with two tiles (Mostek done, Hangar next); (2) the Hangar at the start after "Dalej" (before look, first task "Odnów ściany i podłogę"); (3) the Hangar variant panel open on the rocket (three thumbnails, Polish captions); (4) the Hangar fully furnished in the natural family; (5) the Hangar room-done card (two tiles done, no teaser, no "Baza" button); (6) the Hangar after "Dalej" (change mode and "Baza"); (7) the base cross-section with Mostek done in `ground-left` and the Hangar framed in `ground-right`; (8) the Hangar under `?e2eArt=room` (stand-in boxes with Polish labels); compare (4) against `designs/bystrow-space-base-v2/screenshots/hangar-after-natural.png`, (7) against `designs/bystrow-space-base-v2/screenshots/base-with-two-modules.png`, (2) against `designs/bystrow-space-base-v2/previews/hangar-before.png` — 862dca7
- [ ] 3.7 [human] Accept the Hangar costs 6/10/13/14/17/19/21 = 100 stars (roadmap unknown "Ceny Hangara", owner: author; decision D1, S-17 tunes)
- [ ] 3.8 [human] Accept the Hangar wording (gap 201): "stół warsztatowy" (pack label) instead of the roadmap's "stół z narzędziami", "Postaw lampę", the agreed variant forms; and the Hangar as the base's last module (card with two tiles, no teaser, "Dalej" stays, gap 196, D3)
- [ ] 3.9 [human] On a real tablet, installed and then offline: a base child who finished Mostek opens the Hangar and its pictures draw (precache)
- [ ] 3.10 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4182 + N> passed | 3 skipped` and `e2e hook: absent (` (as seen at plan time in Deploy run 41278603357, job `build` 124765733845: `Tests  4182 passed | 3 skipped (4185)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

### Phase 4: The Hangar in the browser — e2e (FR-047; #16, #2)

#### Automated

- [x] 4.1 Spec red before (deliberate breaks, each run alone with `-g`): move the Hangar row to `place: 2` → test 1 red; add a third unknown room to `HOUSES['base-1']` → test 2 red (teaser appears); set a Hangar cost to 22 → test 2's balance red; point `ROOM_SCENE_FILES.hangar.after` at the before file → test 1's pixel red (or record why the miniature point does not see it and pick a point that does); each restored; green after — baa785b
- [x] 4.2 `npx playwright test tests/e2e/hangar-module.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green; `base-cross-section.spec.ts` green with the shared helper; full e2e (orchestrator, `--workers=4`) `187 + 2`; total equals `npx playwright test --list | tail -1` — baa785b · orchestrator e2e at 702b130: `--workers=3` 181 passed + 8 load timeouts (Codex running), `--last-failed --workers=1` 8 passed → 189 = 187 + 2
- [x] 4.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`) — baa785b
