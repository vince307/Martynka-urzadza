# Kids' room, the third room of house 1 — Implementation Plan

## Overview

Roadmap slice S-25 `kids-room` (milestone M-03, path of house 1; PRD FR-033, FR-035), autonomous run
`2026-11-01-kids-room`, branch `feat/kids-room` cut from `main` at `bfdf193`. Outcome: a child who finished the kitchen
renovates the children's room in stages (clean up, paint the walls, renew the floor; each stage shows the next pack
background), then furnishes it (bed in 3 forms, desk, bookcase, toy chest, reading nook, wardrobe, 3 variants each).
The room sits in the `upper-left` cell of the house-1 cross-section, so house 1 has three of its four rooms (bathroom =
S-31).

Binding inputs: `context/runs/2026-11-01-kids-room/scope.md`, `change.md` D1-D7, `research.md` (its Code References are
the grounding). No lessons file exists in `context/foundation/` (checked at this step), so no lesson is named in a phase.

**The roadmap Risk is the point: "a room is data".** The children's room itself is data and art. Two things are NOT
data, both named for the product owner (change.md, the PR body, `[human]` rows):

1. **D1, staged renovation** — one pure helper `sceneKey` in `src/core/rooms.ts` (plus `stageFade`) replaces the four
   copies of "`stagesDone > 0 ? after : before`"; an optional `scene` on a stage task (`src/core/types.ts`). Touched
   outside data: `src/core/types.ts`, `src/core/rooms.ts`, `src/core/backdrop.ts`, `src/ui/widgets/RoomView.ts`,
   `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts` (one snapshot field), and the logic of `src/data/roomArt.ts`.
2. **The "Pokój gotowy!" card tiles** — 3 tiles overflow the card (research NEW finding); fixed in layout data
   (`src/data/layout.ts` `ROOM_DONE_LAYOUT.tiles`), which also narrows the existing two-tile cards.

Save format stays v6 (`SAVE_VERSION` 6), no migration; one frozen fixture is ADDED
(`tests/fixtures/save-v6-kitchen-done.json`). A phase that finds it must change the save format, star income, mastery,
curriculum, variants, task generators, `balance.loader`, the salon/kitchen/Mostek/Hangar data or pictures, `HouseView`,
`RoomDoneCard` code or the celebration rules stops with `STATUS: BLOCKED` and records why (D1's own reversal condition).

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `7e14b7b`:

- **Background choice is copied four times**: `RoomView.render` (`renovated = stagesDone(room, state) > 0`, then
  `renovated ? room.scene.after : room.scene.before`), `miniaturePieces` (`src/ui/widgets/RoomView.ts`, piece 0),
  `backdropMode` (`src/core/backdrop.ts`), and `RoomScene.fadeStage` (`src/scenes/RoomScene.ts`, always ghosts
  `room.scene.before` + `scene.shadows` + `buildWorn(emptyRoomState())`, comment "DESIGN-GAP … no in-between
  backgrounds (brief P3.6)").
- **Stage count is already generic**: `stagesDone` (`src/core/rooms.ts`) counts stage tasks in the done prefix;
  `RoomTaskDef` (`src/core/types.ts`) allows any number of `{ kind: 'stage' }`; `stepPanel` buys back-to-back stages
  with the panel closed. `wornPieces`, `contactShadowPieces`, `shownVariant` gate on `stagesDone > 0` / `=== 0` and stay
  (the kids room has no worn pieces, contact shadows, decor or `shownBeforePurchase` slot).
- **Room art table**: `src/data/roomArt.ts` `roomArt` maps the fixed roles of `ROOM_SCENE_FILES` (`before`, `after`,
  `shadows`) to `assets/rooms/<room>/<file>.webp` and furniture keys `<room>/<file>` through `urlOf`. Stage textures
  beyond the role pair would never load. `src/data/` may import only types and `core/text/*` from core (ESLint), so
  `roomArt` reads `room.tasks` itself.
- **A room is data** for the rest: `ROOMS` (`src/data/rooms.ts`), `ROOM_SCENE_FILES`, `ROOM_PACKS` in
  `scripts/make-task-art.mjs` (`scene` is a free list of file ids), `pl.room.{names,tasks,slots,variants}`
  (`src/data/pl.ts`), `HOUSES['house-1']` (`src/data/houses.ts`, today salon (0,0) and kitchen (0,1));
  `HOUSE_GEOMETRY['house-1']` already has `upper-left` (252,236, 608×342) and the shell art draws both floors.
- **Card overflow**: `ROOM_DONE_LAYOUT.tiles` width 440, gap 60 in `card` width 1144: 3 tiles = 1440 px.
  `RoomDoneCard.show` centres `items.length` tiles; `tests/layout.test.ts` checks `2 * tiles.width + tiles.gap`. Thumb
  `1920 × 0.13` ≈ 250 px; caption "Pokój dziecięcy" ≈ 258 px at `FONT_SIZES.bar` 36.
- **Save landing** (research (d)): a v6 save with salon + kitchen done goes `repairCurrentRoom` → `mergeHouse` →
  `nextRoom` → `currentRoom 'children'`, `movedFrom 'kitchen'`, no format change. Rollback keeps every room and sends
  `currentRoom` to `salon`.
- **Budget** (research (b)): kids D1 boot set 862 160 B vs salon 1 203 384 B (worst case, passes
  `tests/bootBudget.test.ts`). No atlas.
- **Tests that pin a two-room house 1** (expected edits in phase 4): `tests/roomsData.test.ts` "lists the salon first,
  then the kitchen …"; `tests/e2e/kitchen-room.spec.ts` "#16 S-22 the kitchen furnishes like the salon and ends with
  its own card" ("Dalej has no further room"); `tests/e2e/rooms-as-data.spec.ts` (`HOUSE` constant with two cells,
  card items `['room:true:true', 'room:false:true']`); possibly `tests/houseCells.test.ts`,
  `tests/e2e/house-cross-section.spec.ts` (`rooms` of cells; states stay `closed` for a known room not reached) and the
  `tests/save*.test.ts` / `tests/themeBack.test.ts` users of `FIRST_HOUSE` — the phase-4 agent greps and lists each.
- **Counts.** Contract baseline on `main` bfdf193: unit 4194 locally (4191 + 3 skipped in CI), e2e 189. CI lines SEEN at
  this step (`gh run view 41293904884 --log`, sandbox disabled): job `deploy` 124811306663 step `Smoke check (deploy)`:
  `ok   precache covers room pictures — 100 of 100 room pictures precached`; job `build` 124810627941:
  `Tests  4191 passed | 3 skipped (4194)` and `e2e hook: absent (2 chunks checked)`.

## Desired End State

- A stage task may name the background it reveals (`scene?: string`); `sceneKey(room, state)` is the one rule for the
  room background (the `scene` of the last done stage task that has one, else `scene.after` once any stage is done,
  else `scene.before`); `stageFade(room, state)` is the one rule for what the stage cross-fade ghosts. Salon, kitchen,
  Mostek and Hangar look and fade exactly as before.
- `CHILDREN: RoomDef` (`id: 'children'`) in `src/data/rooms.ts`: three stage tasks (`children/children-stage-1`,
  `children/children-stage-2`, then the after picture), six slots from `designs/martynka-evolution-v1/manifest.json`
  `rooms.children`, costs 5/6/7 + 7/9/10/12/13/15 = 84 (plan review F1: every task costs 5-21, `tests/roomsData.test.ts`
  and PRD FR-016); 23 WebP in `public/assets/rooms/children/`; Polish copy.
- `HOUSES['house-1']` gains `{ room: 'children', floor: 1, place: 0 }`. After the kitchen the card shows three tiles and
  "Dalej" opens the children's room; after its last purchase the card shows three done tiles, no teaser, and "Dalej"
  keeps the child there in change mode with "Dom". The cross-section shows the children's room in `upper-left`.
- A v6 save with the kitchen finished (frozen fixture) loads into the children's room with nothing lost.
- The room-done card fits three tiles (`tiles.width` 340, `gap` 32, `thumbScale` 0.12, mark 28/22); its layout test checks
  the longest house list and that the done mark stays clear of the miniature.
- Deploy smoke: `123 of 123 room pictures precached` with no script change.
- Gap rows 202-204 added, the fade gap row narrowed; CLAUDE.md "Current state" has one S-25 sentence; follow-ups recorded.
- `tests/e2e/kids-room.spec.ts` proves the staged backgrounds in the rendered frame, the purchase flow to the end and the
  `upper-left` cell.

### Key Discoveries:

- `src/data/roomArt.ts` cannot import `sceneKey` (data → core boundary): it collects stage `scene` keys from
  `room.tasks` directly, and `tests/roomArt.test.ts` must collect "every scene key drawn" through the same rule.
- Keys `children/children-stage-1` make `urlOf(key)` give `assets/rooms/children/children-stage-1.webp`, the file the
  art script writes for scene id `children-stage-1` — no new URL rule.
- The last stage task carries no `scene`, so it falls back to `scene.after` and `roomArt` emits no duplicate entry.
- `tests/roomArt.test.ts` "leaves no file … without a table entry" means the 23 files, `CHILDREN`, the scene-file row
  and the copy land in ONE phase (phase 3).
- Adding `CHILDREN` to `ROOMS` alone keeps it unreachable; only the `HOUSES` row (phase 4) changes what a child sees, and
  that row makes every house-1 card three tiles, so the tile resize lands in the same phase.

## What We're NOT Doing

- No change to `HouseView`, `RoomDoneCard` code, `celebrationView`, `SalonBackdrop`, `roomCapture`, `roomArtLoader`,
  `artHealth`, the save format or migrations (D1's bound; research (a)).
- No `wornPieces`/`contactShadowPieces`/`shownVariant`/`RoomView` shadow-and-decor gate change: they keep
  `stagesDone > 0` (handoff decision; S-32 may revisit).
- No kitchen stages (S-32), no bathroom (S-31), no teaser tile after the children's room, no residents.
- No `children-before.png` conversion (D1: `before` = `children-stage-0`); no `children-bed-sunny/-mint` (not slot variants).
- No atlas, no WebP quality change (budget measured).
- No `?e2eSave=v6-kitchen-done` seam (fixture unit test + in-session e2e prove the landing, as S-30).
- No pack thumbnail for the room (`thumbnail` optional; kitchen-room follow-up 4 not fired).
- No `deploy/README.md` rollback line (research (d)).
- No count-dependent tile width in `RoomDoneCard` (layout data only).

## Implementation Approach

Pure rule first (tdd), then wire it into the four background sites and the art table with every existing room
unchanged (impl), then the children's room as data/art/copy still unreachable (impl), then the one `HOUSES` row with the
card fit, the frozen fixture and the flipped tests (tdd), then docs, gaps, follow-ups, seam sweep and the visual pass
(impl), finally one browser spec (e2e). No phase adds a UI component.

## Phase 1: One rule for the room background (`sceneKey`, `stageFade`)

Driver: tdd
Driver why: the helpers are absent and pure (core, no Phaser): a failing test on a three-stage synthetic room leads them.

### Overview

`src/core/rooms.ts` gains the background rule and the fade rule; `backdropMode` uses it. Nothing visible changes.

### Changes Required:

#### 1. Stage task scene

**File**: `src/core/types.ts`

**Intent**: a stage task may name the full-scene picture it reveals (D1, option A).

**Contract**: `RoomTaskDef` stage branch gains `scene?: string` (a room-art texture key; doc comment: absent = the room's
`scene.after`). The slot branch is unchanged.

#### 2. Pure rules

**File**: `src/core/rooms.ts`

**Intent**: one place for "which background does the room show" and "what does the stage cross-fade start from".

**Contract**:
- `sceneKey(room: RoomDef, state: RoomState): string` — `stagesDone === 0` → `room.scene.before`; else the `scene` of the
  LAST done stage task, or `room.scene.after` when that task has no `scene`.
- `stageFade(room: RoomDef, state: RoomState): { from: string; neglected: boolean } | null` — for the state right AFTER a
  purchase: `null` when the last done task is not a stage (or `tasksDone === 0`); else `from` = `sceneKey` of the state
  with `tasksDone - 1`, `neglected` = that previous state had `stagesDone === 0` (only then the shadows and worn ghosts
  join the fade, today's behaviour).

#### 3. Backdrop

**File**: `src/core/backdrop.ts`

**Contract**: `backdropMode` reads `sceneKey(room, state)`; its doc comment names the rule.

#### 4. Tests

**Files**: `tests/rooms.test.ts`, `tests/backdrop.test.ts`

**Contract**: a synthetic room (literal in the test, not from `src/data`) with three stage tasks (`scene` on the first two,
none on the third) then one slot: `sceneKey` at `tasksDone` 0..4 = before, s1, s2, after, after; `stageFade` at 1 =
`{ from: before, neglected: true }`, 2 = `{ from: s1, neglected: false }`, 3 = `{ from: s2, neglected: false }`, 4 =
`null`, 0 = `null`; for `ROOMS.salon` and `ROOMS.kitchen` `sceneKey` equals the old ternary at every `tasksDone` (the
salon/kitchen guard); `backdropMode` on the synthetic room at stage 1 asks for the stage-1 key.

### Success Criteria:

#### Automated Verification:

- New cases red before the helpers exist, green after; unit `4194 + N`
- Deliberate break: make `sceneKey` return the FIRST done stage's `scene` → the `tasksDone` 2 case red; make `stageFade` report `neglected: true` always → case 2 red; each restored; meta-check: the expectations are literals from the synthetic room, not computed by `sceneKey`
- `git diff --stat bfdf193 -- src/ui src/scenes src/data src/testing` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `189 + 0`

---

## Phase 2: The four background sites and the art table use the rule

Driver: impl
Driver why: glue — the room view, miniature, stage fade and art table switch to the phase-1 helpers with no visible change for existing rooms.

### Overview

Every place that draws or loads a room background goes through `sceneKey`/`stageFade`, and stage backgrounds named in
room data are in the art table. Existing rooms render and fade exactly as before.

### Changes Required:

#### 1. Room view and miniature

**File**: `src/ui/widgets/RoomView.ts`

**Intent**: `RoomView.render` and `miniaturePieces` pick the background with `sceneKey`; the stand-in fill
(`wallBefore`/`wallAfter`), the shadows layer, worn pieces and decor keep their `renovated` (`stagesDone > 0`) gate.

**Contract**: no other behaviour change; `drawBackdrop` still gets `renovated` and whether the chosen key is missing.

#### 2. Stage cross-fade and snapshot

**Files**: `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts` (snapshot type only, if typed there)

**Intent**: `fadeStage` ghosts `stageFade(room, state).from`; the shadows and worn ghosts only when `neglected`. The
DESIGN-GAP comment narrows: rooms whose pack has in-between backgrounds name them on the stage tasks. The room snapshot
gains `stagesDone: number` next to `stageDone` (e2e tells stage 1 from stage 2).

**Contract**: `fadeStage` keeps its trigger (`step.bought?.kind === 'stage'`), duration, ease, reduced-motion return and
`clearGhosts`; `RoomScene.redraw` is not touched (house-cross-section follow-up 21 stays unfired). **Fired follow-up
(plan review F5):** salon-style impl-review F4 ("`ghostTweens` keeps finished tweens until sleep", Trigger: "a second
stage task in a room or the next change to `fadeStage`") fires twice here; the tween's `onComplete` also drops that tween
from `ghostTweens` (next to `dropGhost`), so three back-to-back stage purchases leave no finished tween behind; a stage
bought while the previous fade still runs simply adds its ghost on top (both at `depth.scene + 0.1`, both fade to 0).
final-art-salon F1 (fade paused while the scene sleeps) stays closed (salon-style folded it); `clearGhosts` is unchanged.

#### 3. Art table

**File**: `src/data/roomArt.ts`

**Intent**: `roomArt(room)` also emits one entry per stage task `scene` key (`url: urlOf(key)`, `SCENE_SIZE`,
`label: ''`), after the role entries, without duplicates; header comment names the rule (hangar-module follow-up 5: what
is drawn is in the table).

**Contract**: for salon, kitchen, bridge, hangar the output is byte-identical (snapshots `tests/fixtures/room-art-*.json`
unchanged).

#### 4. Tests

**Files**: `tests/roomArt.test.ts`, `tests/stageSceneWiring.test.ts` (new, source test like `tests/backdropRestoreWiring.test.ts`)

**Contract**: `roomArt.test` "labels every stand-in…" and "exactly the texture keys…" collect scene keys as
`Object.values(room.scene)` + every stage task `scene` (a local helper in the test); a synthetic room with stage scenes
gets one entry per stage key with the `urlOf` URL. The wiring test reads the sources of `RoomView.ts`, `RoomScene.ts`,
`backdrop.ts` and asserts each calls `sceneKey`/`stageFade` and none holds the pattern `scene.after : ` /
`? room.scene.after` any more.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/roomArt.test.ts tests/stageSceneWiring.test.ts tests/rooms.test.ts tests/backdrop.test.ts tests/bootBudget.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: restore the ternary in `miniaturePieces` → the wiring test red; drop the stage-key entries from `roomArt` → the synthetic-room case red; each restored; meta-check: the wiring test proves the call sites, not the pixels — the rendered proof is phase 6
- `git diff --stat <phase-1 sha> -- tests/fixtures src/data/rooms.ts src/data/houses.ts src/data/pl.ts public` empty (existing rooms unchanged)
- Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0` (salon stage specs `room-purchase`, `salon-style`, `salon-art`, `canvas-renderer` unchanged)

---

## Phase 3: The children's room as data, copy and art (unreachable)

Driver: impl
Driver why: art conversion through the script plus data rows copied from the pack manifest, proven by the existing room-art and room-data invariants — art pipeline and data glue.

### Overview

The children's room exists with its pictures and Polish text, precached and budget-checked, but no house lists it yet.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/children/*.webp` (23, generated)

**Contract**: a pack-root constant for `designs/martynka-evolution-v1` if none exists; a `ROOM_PACKS` row `{ room:
'children', scene: ['children-stage-0', 'children-stage-1', 'children-stage-2', 'children-after', 'children-shadows'],
decor: [], furniture: children-bed-<natural|house|drawers> + children-<desk|books|toys|reading|wardrobe>-<natural|sunny|mint>,
recolourBoard: false }` (cream board like the kitchen). `convert()` settings unchanged; every other output byte-identical.
Needs `cwebp` and Python with Pillow 12.1.0 + numpy 2.4.3 (present on the maintainer's machine at plan review:
`/usr/local/bin/cwebp`, `python3` Pillow 12.1.0, numpy 2.4.3; the script reads `designs/` only and writes
`public/assets/`). If either is missing or `npm run art` fails for a tool or sandbox reason (plan review F6), the phase
stops `STATUS: BLOCKED` with the error line: never hand-convert or resize a WebP outside the script, never pin other
versions, never write into `designs/`. If the sandbox blocks the tools, re-run the one command with the sandbox disabled
(profile § 8) before calling it BLOCKED.

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`

**Contract**: `childrenSlots: SlotDef[]` copied slot by slot from `manifest.json` `rooms.children.slots` (id, x, y,
width, height, z, anchor, visibleRect; variants `children/<file id>`): bed 405,239 410×407 z20 (variants natural, house,
drawers); desk 1258,397 290×262 z25; books 810,286 220×324 z15; toys 411,578 371×251 z40; reading 1211,558 367×301 z45;
wardrobe 1028,308 216×346 z18. `CHILDREN` = `id: 'children'`, `scene: { before: 'children/before', after:
'children/after', shadows: 'children/shadows' }`, `decor: []`, `worn: []`, `contactShadows: []` (`shadowEllipses: []`),
tasks in this order: stage `clean-room` (label `cleanRoom`, 5, `scene: 'children/children-stage-1'`), stage
`paint-walls` (`paintWalls`, 6, `scene: 'children/children-stage-2'`), stage `renew-floor` (`renewFloor`, 7, no
`scene`), slots `place-bed` (`placeBed`, 7), `place-desk` (`placeDesk`, 9), `place-bookcase` (`placeBookcase`, 10),
`place-toy-chest` (`placeToyChest`, 12), `set-up-reading-nook` (`setUpReadingNook`, 13), `place-wardrobe`
(`placeWardrobe`, 15); a header comment naming the pack, FR-033 and D1. `ROOMS` gains `[CHILDREN.id]: CHILDREN` after
`KITCHEN`. `ROOM_SCENE_FILES.children` = `{ before: 'children-stage-0', after: 'children-after', shadows:
'children-shadows' }`.

#### 3. Polish copy (teacher read)

**File**: `src/data/pl.ts`

| key | text |
|---|---|
| `room.names.children` | Pokój dziecięcy |
| `room.slots['children-bed' / '-desk' / '-books' / '-toys' / '-reading' / '-wardrobe']` | łóżko / biurko i krzesło / regał na książki / skrzynia na zabawki / kącik czytelniczy / szafa |
| `room.variants` | bed: `['Baldachim', 'Domek', 'Z szufladami']`; desk: `['Naturalne', 'Słoneczne', 'Miętowe']`; books, reading: `['Naturalny', 'Słoneczny', 'Miętowy']`; toys, wardrobe: `['Naturalna', 'Słoneczna', 'Miętowa']` |
| `room.tasks` | `cleanRoom` Posprzątaj pokój · `paintWalls` Pomaluj ściany · `renewFloor` Odnów podłogę · `placeBed` Postaw łóżko · `placeDesk` Postaw biurko i krzesło · `placeBookcase` Postaw regał na książki · `placeToyChest` Postaw skrzynię na zabawki · `setUpReadingNook` Urządź kącik czytelniczy · `placeWardrobe` Postaw szafę |

A comment cites design gap 202 (the pack gives stage nouns and masculine family labels; the imperatives and agreed forms
are ours).

#### 4. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-children.json` (new snapshot), `tests/roomsData.test.ts`,
`tests/roomHit.test.ts`

**Contract**: snapshot equality adds `roomArt(ROOMS.children)` = the new fixture (written from the pack: keys and urls
from the manifest file names, sizes from the PNGs, labels from the copy table — not dumped from `roomArt()`), 23 entries
(3 roles + 2 stage keys + 18 furniture); `ROOM_ART` = salon + kitchen + children + bridge + hangar in `ROOMS` order; a
`describe('children data (FR-033)')` with a manifest literal (`[id, x, y, width, height, z]` per slot, from the manifest),
three stage tasks first then six slot tasks in the pack's `renovation.furnishings` order, costs
`[5, 6, 7, 7, 9, 10, 12, 13, 15]` summing to 84, the two stage `scene` keys and none on the third; `unreachableSlots`
over the room with all six bought = `[]`. **Placement exemption (plan review F2, S-30 precedent `041e279`):** the
invariant "is keyed by its own id and placed in exactly one house of HOUSES" (`tests/roomsData.test.ts`, `describe('every
room in ROOMS')`) is red while `CHILDREN` is in `ROOMS` but in no house; this phase changes ONLY its expected count to
`id === 'children' ? 0 : 1` with a comment "S-25 phase 3: no house lists the children's room yet; phase 4 adds its
HOUSES row and removes this exemption". The `it.each(ROOMS)` invariants cover the rest (inside the scene, distinct z,
copy for every slot/variant/task, stand-in labels, weight, boot budget).

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the 23 new files under `public/assets/rooms/children/`
- `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: change the desk's `x` in `childrenSlots` → the manifest literal red; delete `children-stage-1.webp` → the size/orphan cases red; drop `'children-toys'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `childrenSlots`; whether the picture looks right is the visual pass (phase 5)
- `npm run build` then `grep -o "assets/rooms/children/" dist/sw.js | wc -l` = 23
- `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/bridge public/assets/rooms/hangar` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0`

#### Manual Verification:

- [reviewer] Teacher read of the children copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun (biurko i krzesło → -e plural/neuter, regał/kącik → -y, skrzynia/szafa → -a), task labels imperative + accusative (skrzynię, szafę, łóżko), each label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 123 of 123 room pictures precached` (line SEEN at plan time in Deploy run 41293904884, job `deploy` 124811306663: `ok   precache covers room pictures — 100 of 100 room pictures precached`; expected after this slice: 123 of 123)

---

## Phase 4: The children's room joins house 1

Driver: tdd
Driver why: the `HOUSES` row and the three-tile fit are absent; the flipped flow tests, the longest-list layout test and the finished-kitchen fixture lead them red-first — data contracts.

### Overview

One data row puts the room in `upper-left`; "Dalej" after the kitchen leads into it; a saved finished kitchen opens
there; the card fits three tiles.

### Changes Required:

#### 1. House row

**File**: `src/data/houses.ts`

**Contract**: `HOUSES['house-1'].rooms` = salon (0,0), kitchen (0,1), `{ room: 'children', floor: 1, place: 0 }`.

#### 2. Card tiles

**File**: `src/data/layout.ts`

**Intent**: three tiles fit the 1144 card (research NEW finding).

**Contract** (revised by plan review F3): the done mark (`markInset`, `markRadius`) is drawn on the card `Graphics` at
`depth.card`, BELOW the miniature images (`depth.card + 1`, opaque background), so it must not overlap the thumb rect, or
the "done" shape sign is half hidden (at width 320 with today's thumb 0.13 and mark 34/26 the circle x 260-312 overlaps
the thumb x 35-285). Numbers: `tiles.width` 340, `gap` 32 (3·340 + 2·32 = 1084 ≤ 1144), `thumbScale` 0.12 (230×130,
right edge at 285.2 of the tile), `markInset` 28, `markRadius` 22 (circle x 290-334, y 6-50: clear of the thumb, inside
the tile); caption (≈258) fits; `left` updated or removed if unused. Other numbers satisfying the test below are fine. A
comment names gap 204 and the S-31 limit (4 tiles do not fit the 1144 card at this width).

#### 3. Frozen fixture

**File**: `tests/fixtures/save-v6-kitchen-done.json` (new, frozen; never edited after this phase)

**Contract**: a v6 save as the S-30 build writes it (shape of `tests/fixtures/save-v6-bridge-done.json`): `house`
`{ id: 'house-1', rooms: [salon (0,0), kitchen (0,1)] }`, `currentRoom: 'kitchen'`, `rooms.salon` and `rooms.kitchen` at
full `tasksDone` with a chosen variant for each of their own slots (so `roomStateProblems` = []), a stars value, a learner.

#### 4. Tests

**Files**: `tests/layout.test.ts`, `tests/roomsData.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`,
`tests/e2e/kitchen-room.spec.ts`, `tests/e2e/rooms-as-data.spec.ts`, and every other test the grep below finds

**Contract**:
- `layout`: "lays the room list tiles …" uses `n` = the longest `houseRoomList(h, ROOMS).length` over `HOUSES` (3) instead
  of 2; the rest of the case unchanged; plus the done-mark circle (`width - markInset ± markRadius`, `markInset ±
  markRadius`) lies inside the tile and does not intersect the thumb rect (`(width - scene.width·thumbScale) / 2` …,
  `thumbTop` … `thumbTop + scene.height·thumbScale`) — red with the 320/40 numbers and today's mark.
- `roomsData`: the phase-3 placement exemption is removed (the invariant is back to `toHaveLength(1)` for every room,
  and turns red first if the row is missing); the house-1 list = `[{ room: 'salon' }, { room: 'kitchen', unlockAfter:
  'salon' }, { room: 'children', unlockAfter: 'kitchen' }]`; new "moves a finished kitchen into the children's room" (`nextRoom`, `movedFrom
  'kitchen'`, empty state, salon and kitchen untouched); new "keeps the child in the children's room after its last task:
  Dalej stays".
- `houseCells`: house-1 with `children` current and salon + kitchen done → `['done', 'done', 'current', 'closed']`,
  `upper-left` room `children`.
- `fixtureLoadPath`: `save-v6-kitchen-done` joins `FIXTURES` (round-trip); a case mirroring `main.ts` (`repairCurrentRoom`
  → `mergeHouse` → `nextRoom`) expects rooms `['salon', 'kitchen', 'children']` in the house, `currentRoom 'children'`,
  `movedFrom 'kitchen'`, salon and kitchen equal to the fixture's, stars kept.
- **The e2e assertions that change, each with why** (plan review F4; grep at review time; the ONLY reason any of them
  changes is that house 1 now lists a third, known room after the kitchen, so the card gains one tile and "Dalej" after
  the kitchen has a next room; every other line of these tests stays as it is):

  | spec / test | assertion today | after this phase | why |
  |---|---|---|---|
  | `kitchen-room.spec.ts` "#2 S-22 after the salon …" | card items `['room:true:true', 'room:false:true']` | `[…, 'room:false:false']` | children listed, locked until the kitchen is done |
  | `kitchen-room.spec.ts` "#16 S-22 the kitchen furnishes …" (title gains S-25) | `slice(0, 2)` `['room:true', 'room:true']`; comment "Dalej has no further room"; after "Dalej" `currentRoom` `'kitchen'`, then `modeButton` | the `slice(0, 2)` line stays and a third item `room:false:true` is asserted; after "Dalej" `currentRoom` is `'children'` and `rooms.kitchen` equals the state before "Dalej"; the change-mode proof of the kitchen is KEPT through a visit: `openHouse`, tap the `ground-right` cell (`targets.houseCells`), `visiting` `'kitchen'`, then the existing `modeButton` / `changeTo` / stars lines unchanged | "Dalej" now has a next room; the free change of a done kitchen is still proved, by the visit path that `house-cross-section.spec.ts` uses for the salon |
  | `rooms-as-data.spec.ts` `HOUSE` constant (used by both #10 tests and #2) | two cells | three cells (`children` floor 1 place 0) | the loaded and written house is the data house (`mergeHouse` puts the data rows first) |
  | `rooms-as-data.spec.ts` "#10 … a finished salon reloads into the kitchen" | card items two | `[…, 'room:false:false']` | as kitchen-room #2; `Object.keys(after.rooms)` stays `['salon', 'kitchen']` (no state before the move) |
  | `room-change.spec.ts` salon-to-the-end test | `card?.items` `toHaveLength(2)` | `toHaveLength(3)` and `items[2]` `{ kind: 'room', id: 'children', done: false, unlocked: false }` | third tile |

  Unchanged on purpose (they stay true): `salon-extra-slots.spec.ts` `items[0]`/`items[1]` (index-based);
  `house-cross-section.spec.ts` cell states (`upper-left` holds a known room not reached: `closed`, as before);
  `first-building-choice.spec.ts`, `base-cross-section.spec.ts`, `hangar-module.spec.ts` (the base). The phase also runs
  `grep -rn "house-1\|FIRST_HOUSE\|'kitchen'\|items).toHaveLength" tests` and lists every hit in the handoff with "edited
  (row above)" or "stays true (why)"; a test flipped for any reason not in this table is a finding, not an edit.

### Success Criteria:

#### Automated Verification:

- The new and flipped unit cases red before the `HOUSES` row and the tile change, green after; unit `<phase-3 count> + N`
- Deliberate break: give the children row `place: 1` → the `houseCells` case red; set `tiles.width` back to 440 → the layout case red; drop the row → roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts` — the e2e reload (phase 6) is the browser proof of the same path
- `npx playwright test tests/e2e/kitchen-room.spec.ts tests/e2e/rooms-as-data.spec.ts tests/e2e/house-cross-section.spec.ts` (sandbox disabled) green
- `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-3 sha>.. -- tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0`

---

## Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-4 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/kids-room/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-25 sentence (the room `children` "Pokój dziecięcy" as the third
room of house 1 in `upper-left`: `CHILDREN` in `src/data/rooms.ts`, three stage tasks then six slots costing 5-15 = 84,
art from `martynka-evolution-v1` in `public/assets/rooms/children/`, `sceneKey`/`stageFade` in `src/core/rooms.ts` as the
one background rule with `scene` on a stage task, card tiles 340/32 with a smaller miniature, save v6 unchanged, frozen
`save-v6-kitchen-done.json`), and the S-22/S-23 wording that the kitchen is house 1's last room updated. Gap rows: 202
(kids-room wording ours: stage imperatives, slot tasks, agreed variant forms), 203 (the staged miniature/cell rule:
latest stage background reached), 204 (room-done card with 3 tiles: narrower tiles for every card; 4 tiles need more);
the existing fade gap row (brief P3.6) narrowed. Follow-ups with `Trigger:` lines: atlas (kitchen-room 5 fired: measured,
not needed, carried with trigger "boot budget under 2 s headroom or a room heavier than the salon"); house-cross-section
13 / rooms-as-data 11 closed (`children` at `upper-left`); hangar 5 satisfied (stage keys in `roomArt`), carried;
four-tile card (new, Trigger: S-31); `wornPieces`/`contactShadowPieces` meaning "until the first stage" (new, Trigger:
S-32); kitchen-room 4 (thumbnails) and house-cross-section 21 not fired, carried; salon-style F4 (`ghostTweens`) closed by
phase 2 with its evidence; fired by this slice's `RoomView.render` / `RoomScene` / room-art-set edits and re-recorded
with the reason they stay open: final-art-salon VO2/F5/F7 and salon-extra-slots VO2 (one stand-in drawer, overlapping
stand-in labels; frame 12 checks the children stand-ins), rooms-as-data 12 / kitchen-room 8 (`RoomView.render` stand-in
drawer), salon-extra-slots L-R8/L-R11 (`RoomScene` refusals, `celebrate`), salon-load-health M-6 second half (service-worker
install warn, room art set); every other open follow-up whose
`Trigger:` names a file this slice changed — included, closed with evidence, or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers — any remaining `scene.after : ` / `? room.scene.after` outside `sceneKey`; stale
comments "no in-between backgrounds", "kitchen is the last room", "until S-25", "S-25 adds", "two rooms" in `src/`,
`tests/`, `scripts/`; the `tests/roomArt.test.ts` scene-key helper not duplicated elsewhere in tests; gap numbers cited in
comments match the rows; `pl.ts` comment cites row 202; the `stageDone` boolean kept only where e2e still reads it; no
placement exemption left in `tests/roomsData.test.ts` (`grep -n "id === 'children' ? 0" tests` empty, plan review F2).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "CHILDREN|sceneKey|save-v6-kitchen-done|assets/rooms/children" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/kids-room/follow-ups/review-fixes.md` ≥ 5; `grep -cE "^\| 20[234] " docs/design-gaps.md` = 3
- Seam sweep: `grep -rnE "scene\.after :|until S-25|S-25 adds" src tests scripts --exclude=rooms.ts` empty (`sceneKey` itself lives in `src/core/rooms.ts`); `npm run art` then `git status --short public/assets` empty
- `git diff --stat <phase-4 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the kitchen room-done card with three tiles (salon done, kitchen done, children next); (2) the children's room at the start after "Dalej" (stage-0 look, task "Posprzątaj pokój"); (3) after "Posprzątaj pokój" (stage-1 look, task "Pomaluj ściany"); (4) after "Pomaluj ściany" (stage-2 look, task "Odnów podłogę"); (5) after "Odnów podłogę" (after look, task "Postaw łóżko"); (6) the variant panel open on the bed (three forms Baldachim, Domek, Z szufladami); (7) the room fully furnished in the natural family; (8) the children's room-done card (three done tiles, no teaser); (9) after "Dalej" (change mode and "Dom"); (10) the house cross-section with the children's room framed in `upper-left`, salon and kitchen done; (11) the house cross-section mid-renovation (after stage 2: the cell miniature shows stage-2); (12) the room under `?e2eArt=room` (stand-in boxes with Polish labels); (13) the salon room-done card with three tiles (two-tile cards no longer exist in house 1; base cards with two narrower tiles: Mostek card); compare (5)/(7) against `designs/martynka-evolution-v1/screenshots/children-form-0.png`, (6) against `children-form-0-chooser.png`, (10) against `designs/martynka-house-1-polish-v1` preview `house-four-rooms.png`
- [human] Accept D1 against the roadmap promise "dodany wyłącznie jako dane i grafika": the staged renovation needed `sceneKey`/`stageFade` in `src/core/rooms.ts`, `scene` on a stage task, and edits in `RoomView`, `RoomScene.fadeStage`, `backdrop.ts`, `roomArt.ts` logic and one e2e snapshot field (FR-033 allows walls and floor as separate steps; S-32 reuses it as data)
- [human] Accept the room-done card change: tiles 340 wide with 32 gap and a miniature at 0.12 on every card (two-tile base cards look narrower); four tiles (S-31) need a further change (gap 204)
- [human] Accept the children's room costs 5/6/7 (stages) + 7/9/10/12/13/15 = 84 stars (D3 as revised by plan review F1; S-17 tunes)
- [human] Accept the children's wording (gap 202): "Posprzątaj pokój", "Pomaluj ściany", "Odnów podłogę", the slot task labels, the agreed variant forms (Naturalne for "biurko i krzesło", Naturalna for skrzynia/szafa), and the bed forms from the pack
- [human] On a real tablet, installed and then offline: a child who finished the kitchen opens the children's room and its pictures draw at each stage (precache)
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4191 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41293904884, job `build` 124810627941: `Tests  4191 passed | 3 skipped (4194)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

---

## Phase 6: The children's room in the browser — e2e (FR-033; #16, #2)

Driver: e2e
Driver why: the staged backgrounds exist only in the rendered frame and the purchase flow crosses three rooms; built by phases 1-4, after the phase-5 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow, balance exact) and #2 (the room survives a reload).

### Overview

One spec against the hook build modelled on `tests/e2e/base-cross-section.spec.ts` and `tests/e2e/kitchen-room.spec.ts`,
reading the RENDERED frame (`renderedPixel`, profile § 8) for every "is it visible" risk, never a texture.

### Changes Required:

#### 1. Spec

**Files**: `tests/e2e/kids-room.spec.ts` (new); `playwright.config.ts` (add `kids-room` to the `ROUND_SPEC` alternation,
project `chromium-hook`; no other field); reuse `buyAllTasks`/`finishSalon` from `tests/e2e/support/salon.ts` (extend
the support file, test code only, if a helper to reach the kitchen's end is missing)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#16 S-25 FR-033 the children's room renovates in three stages, each a new background in the rendered frame, then is
  furnished to the end; the balance is exact; the card shows three done rooms and "Dalej" stays` — `e2eStars` = salon +
  kitchen + children totals; finish salon and kitchen, "Dalej" → room `children`, `tasksDone 0`, `stagesDone 0`; before
  each stage purchase and after it read `renderedPixel` at a room point where consecutive stage pictures differ (plan
  candidate: room (1200, 410), RGB stage-0 ≈ (205,139,88), stage-1 ≈ (232,202,158), stage-2 ≈ (247,232,201), after ≈
  (246,206,157), measured on the pack PNGs; the implementer re-measures on the WebP and records the point(s) in a
  comment; a second point is fine) and expect the pixel to move to the new picture (tolerance per channel, after the
  `ANIMATION.stageFadeMs` fade — or reduced motion on). Plan review F7: at stage 0 the view also draws the `shadows`
  layer over the background, and the room UI may sit over a point, so the expected value per stage is the WebP value
  composed with what the view draws there (checked against a first rendered read and a frame), and every transition
  also asserts the rendered pixel differs from the previous read by ≥ 30 in one channel — never a texture read; `stagesDone` 1, 2, 3; then buy the six slots; stars after each
  purchase = the previous minus the cost (the save's stars, not the label); card `items` = three `room` items `salon`,
  `kitchen`, `children`, all `done`, no `teaser`; "Dalej" → room `children`, mode button present, `houseLabel 'Dom'`.
- `#2 S-25 FR-033 the house shows the children's room in its upper-left cell; a reload keeps the child there` — reach
  the children's room after stage 1; "Dom" → `houseView` cells `['done', 'done', 'current', 'closed']` with
  `upper-left` room `children`; `renderedPixel` at a point inside `upper-left` is NOT the closed-cell cream (point chosen
  where the stage-1 miniature and the closed cell differ by more than 40 in a channel, recorded in a comment); tap
  `upper-left` → room `children`, `visiting` null; reload → `currentRoom 'children'`, `tasksDone 1`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each test run alone with `-g`): make `sceneKey` ignore the stage `scene` (always `after` once staged) → test 1's stage pixel red; give the children row `place: 1` → test 2 red; set a children cost to 16 → test 1's balance red; add an unknown room to `HOUSES['house-1']` → test 1 red (teaser appears); each restored; green after; meta-check: the pixel is read from the rendered frame, so a background covered by another layer would also fail
- `npx playwright test tests/e2e/kids-room.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `189 + 2`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/rooms.test.ts`, `tests/backdrop.test.ts`: `sceneKey`, `stageFade` on a synthetic three-stage room; salon/kitchen guard (phase 1).
- `tests/stageSceneWiring.test.ts`: the four sites call the rule (phase 2).
- `tests/roomArt.test.ts`: stage keys in the table; children snapshot, 23 entries, sizes, orphans, labels, weight (phases 2, 3).
- `tests/roomsData.test.ts`: children manifest literal, costs 84, house-1 list, "Dalej" into and inside the room (phases 3, 4).
- `tests/layout.test.ts`: the card fits the longest house list (phase 4).
- `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`: `upper-left` cell; `save-v6-kitchen-done` round-trip and landing (phase 4).
- `tests/bootBudget.test.ts`, `tests/roomHit.test.ts`: children covered by `ROOMS` iteration / one explicit case.

### Integration Tests:

- Deploy smoke: `room pictures` 123 of 123 (proven at ship, no script change).
- e2e: phase-6 spec; `kitchen-room.spec.ts` and `rooms-as-data.spec.ts` (edited in phase 4); salon stage specs unchanged.

### Manual Testing Steps:

1. House child with enough `?e2eStars`: finish salon and kitchen → card with three tiles → "Dalej" → stage-0 room.
2. Buy the three stages, watching each background change; then the bed forms.
3. "Dom" mid-renovation → the `upper-left` cell shows the stage reached.
4. Finish → card with three done tiles, "Dalej" stays with change mode.
5. Tablet, installed, offline: the stage pictures draw.

## Performance Considerations

Boot loads only the room in renovation: the children's boot set ≈ 862 KB of room art vs the salon's 1.20 MB (worst case,
passes `tests/bootBudget.test.ts`). Precache grows by about 0.86 MB. Runtime: the art loads behind the kitchen card
reveal through `roomArtLoader` (from the precache). Three extra stage textures in memory while the room is shown.

## Migration Notes

None. Save v6 already carries `house`, `rooms`, `currentRoom`; stages are tasks counted by `tasksDone` in the new room
only. Rollback to the S-30 build: `repairCurrentRoom` sends `children` to `salon`, `mergeHouse` keeps the saved cell,
`rooms.children` stays (research (d)); no `deploy/README.md` line.

## Known risks

- The stage-1 → stage-2 → after differences may be subtle at the cell miniature size (608×342); visual frame (11) decides.
- The phase-6 purchase run (salon 12 + kitchen 7 + children 9 purchases) is load-sensitive; a timeout is judged with
  `--last-failed --workers=1` (profile § 8).
- Narrower tiles may make base cards look sparse; `[human]` row and visual frame (13).
- A child who finished the kitchen before S-25 meets the room at the next start without the card that announces it
  (card only at purchase; S-22/S-30 precedent).
- (plan review) The smaller miniature (0.12) on every card is a look change for the salon/kitchen/base cards; visual
  frames (1), (8), (13) and `[human]` row 5.8 judge it. If the tile reads cramped, the alternative is moving the mark
  (code in `RoomDoneCard`, out of this slice's bound), recorded as a follow-up, not done here.
- (plan review) `npm run art` depends on local tools and the local-only `designs/` packs; a missing tool ends phase 3 as
  BLOCKED, never a hand-made WebP.

## Autonomous decisions

Maintainer decisions (scope.md), D1-D7 (change.md) and the research decisions (handoff §6) are kept; none is
overturned (plan review revised D3's numbers, R1 below). Decided at this step (no `AskUserQuestion`; complexity MEDIUM, 0 open product questions after research,
structure decided from the artifacts: 6 phases, ≤ 0 new UI components each):

- **P1 — `sceneKey` semantics: the `scene` of the LAST done stage task, else `scene.after` once staged, else
  `scene.before`; the last stage omits `scene`.** Rejected: the last stage naming `children/after` explicitly (a second
  key for the same picture, a duplicate `roomArt` entry); rejected: option B (`stages` list on `RoomDef.scene`, handoff).
  Would change: S-32 needing a stage that returns to an earlier picture.
- **P2 — `stageFade` as a pure helper** (from-key + `neglected`) instead of computing the previous state in the scene,
  so the fade rule is unit-tested. Would change: nothing.
- **P3 — costs 5/6/7 + 7/9/10/12/13/15 = 84** (revised by plan review F1 from 3/4/5 = 78: the invariant "whole costs
  of 5-21 stars" in `tests/roomsData.test.ts` and PRD FR-016's start of 5 stars rule out 3 and 4; the kitchen curve for
  slots, the three stages the cheapest allowed and rising). `[human]` row
  5.4. Would change: S-17 measurements or the maintainer naming a price.
- **P4 — wording**: "Posprzątaj pokój", "Pomaluj ściany", "Odnów podłogę" (the pack's "Sprzątanie", "Malujemy ściany",
  "Odnawiamy podłogę" are nouns / 1st person plural); slot tasks "Postaw …" except "Urządź kącik czytelniczy" (kitchen
  "Urządź kącik kawowy" precedent); variant forms agree with the caption. Gap 202, `[human]` row 5.5. Would change: the
  phase-3 teacher read or a designer list.
- **P5 — card tiles narrower on every card** (research recommendation 320/40, revised by plan review F3 to 340/32 with
  thumb 0.12 and mark 28/22 so the done mark is not hidden under the miniature), not count-dependent widths in `RoomDoneCard`
  (scene code, against the data promise). `[human]` row 5.3. Would change: the visual gate showing a clipped caption
  (then fit captions with `labelScale`).
- **P6 — D1 vs the roadmap's "wyłącznie dane i grafika"**: kept (research: the bound held); `[human]` row 5.2 names it.
  FR-033's own text allows walls and floor as separate steps, so no PRD deviation. Would change: the maintainer preferring
  data-only (fallback: one `renovate` stage, `children-before` → `children-after`).
- **P7 — the frozen fixture `save-v6-kitchen-done.json` plus a load-order mirror test** instead of an e2e save seam
  (S-30 precedent P2). Would change: a bug in the `main.ts` load order the mirror cannot see.
- **P8 — `stagesDone` added to the room snapshot** (`src/testing/e2eHook.ts`, hook build only) so e2e tells stages apart;
  the `stageDone` boolean stays for the existing specs. Would change: nothing.
- **P9 — the phase-4 e2e edits flip, not delete,** kitchen-room #16 and rooms-as-data (the card and house literals): they
  keep their purchase and reload proofs. Would change: nothing.
- **P10 — rendered-pixel candidate (1200, 410)** measured on the pack PNGs (11×11 mean, ≥ 41 per transition in one
  channel); the e2e implementer re-measures on the WebP. Would change: a weaker difference after conversion (pick a
  second point per transition).

### Plan review (`reviews/plan-review.md`)

- **R1 (F1) — costs 5/6/7 + 7/9/10/12/13/15 = 84**, not 3/4/5 = 78. Rejected: lowering the test's floor (PRD FR-016
  starts at 5 stars and the invariant guards every room); rejected: one stage of 5 with two of 0 (a free task is not a
  purchase). `[human]` row 5.9 now names 84. Would change: S-17 or the maintainer naming prices.
- **R2 (F3) — tiles 340/32, thumb 0.12, mark 28/22**, with a layout test that the done mark is clear of the miniature.
  Rejected: drawing the mark above the pictures (a `RoomDoneCard` code change, against the bound); rejected: 360/22 at
  0.13 (10 px from the card edge). Would change: the visual gate showing the 0.12 miniature too small to read.
- **R3 (F2) — a temporary placement exemption in phase 3, removed in phase 4**, as S-30 did (`041e279`). Rejected:
  merging phases 3 and 4 (one agent would carry art, data, copy, the house row, the card and six spec edits).

## References

- Research: `context/changes/kids-room/research.md`; identity and decisions: `context/changes/kids-room/change.md`; run scope: `context/runs/2026-11-01-kids-room/scope.md`
- Format example: `context/archive/2026-11-01-hangar-module/plan.md`; room slice: `context/archive/2026-10-31-kitchen-room/plan.md`
- Follow-ups: `context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md` (4, 5), `context/archive/2026-10-31-house-cross-section/follow-ups/review-fixes.md` (13, 21), `context/archive/2026-10-30-rooms-as-data/follow-ups/review-fixes.md` (11), `context/archive/2026-11-01-hangar-module/follow-ups/review-fixes.md` (5)
- Pack: `designs/martynka-evolution-v1/manifest.json` (`rooms.children`, `renovation`), `screenshots/children-form-{0,1,2}.png`, `children-form-*-chooser.png`; `designs/martynka-house-street-v2/manifest.json` `houses.house-1.cells`; `docs/designer-brief-m03.md`
- Code: `src/core/rooms.ts` (`stagesDone`), `src/core/types.ts` (`RoomTaskDef`, `RoomDef`), `src/core/backdrop.ts` (`backdropMode`), `src/ui/widgets/RoomView.ts` (`RoomView.render`, `miniaturePieces`), `src/scenes/RoomScene.ts` (`fadeStage`, `snapshot`), `src/data/roomArt.ts` (`roomArt`, `ROOM_SCENE_FILES`), `src/data/rooms.ts` (`KITCHEN`, `ROOMS`), `src/data/houses.ts` (`HOUSES`), `src/data/layout.ts` (`ROOM_DONE_LAYOUT`), `src/data/pl.ts` (`room`), `scripts/make-task-art.mjs` (`ROOM_PACKS`), `tests/e2e/support/hook.ts` (`renderedPixel`)
- PRD: `context/foundation/prd.md` FR-033, FR-035; test plan `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: One rule for the room background (`sceneKey`, `stageFade`)

#### Automated

- [x] 1.1 New cases red before the helpers exist, green after; unit `4194 + N` — 5fe9dd2 (unit 4198 = 4194 + 4)
- [x] 1.2 Deliberate break: make `sceneKey` return the FIRST done stage's `scene` → the `tasksDone` 2 case red; make `stageFade` report `neglected: true` always → case 2 red; each restored; meta-check: the expectations are literals from the synthetic room, not computed by `sceneKey` — 5fe9dd2
- [x] 1.3 `git diff --stat bfdf193 -- src/ui src/scenes src/data src/testing` empty — 5fe9dd2
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `189 + 0` — 5fe9dd2 (e2e left to the orchestrator)

### Phase 2: The four background sites and the art table use the rule

#### Automated

- [x] 2.1 `npx vitest run tests/roomArt.test.ts tests/stageSceneWiring.test.ts tests/rooms.test.ts tests/backdrop.test.ts tests/bootBudget.test.ts` green; unit `<phase-1 count> + N` — f2b304a — f2b304a
- [x] 2.2 Deliberate break: restore the ternary in `miniaturePieces` → the wiring test red; drop the stage-key entries from `roomArt` → the synthetic-room case red; each restored; meta-check: the wiring test proves the call sites, not the pixels — the rendered proof is phase 6 — f2b304a
- [x] 2.3 `git diff --stat <phase-1 sha> -- tests/fixtures src/data/rooms.ts src/data/houses.ts src/data/pl.ts public` empty (existing rooms unchanged) — f2b304a — f2b304a
- [x] 2.4 Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0` (salon stage specs `room-purchase`, `salon-style`, `salon-art`, `canvas-renderer` unchanged) — orchestrator e2e 4c594c0 + 1ee3847 (run-log 2026-11-01)

### Phase 3: The children's room as data, copy and art (unreachable)

#### Automated

- [x] 3.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the 23 new files under `public/assets/rooms/children/` — a7cee7f
- [x] 3.2 `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N` — a7cee7f
- [x] 3.3 Deliberate break: change the desk's `x` in `childrenSlots` → the manifest literal red; delete `children-stage-1.webp` → the size/orphan cases red; drop `'children-toys'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `childrenSlots`; whether the picture looks right is the visual pass (phase 5) — a7cee7f
- [x] 3.4 `npm run build` then `grep -o "assets/rooms/children/" dist/sw.js | wc -l` = 23 — a7cee7f
- [x] 3.5 `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/bridge public/assets/rooms/hangar` empty — a7cee7f
- [x] 3.6 Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0` — orchestrator e2e 4c594c0 + 1ee3847 (run-log 2026-11-01)

#### Manual

- [x] 3.7 [reviewer] Teacher read of the children copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun (biurko i krzesło → -e plural/neuter, regał/kącik → -y, skrzynia/szafa → -a), task labels imperative + accusative (skrzynię, szafę, łóżko), each label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff — impl-review (reviews/impl-review.md, no error; sample E1-E6 green)
- [ ] 3.8 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 123 of 123 room pictures precached` (line SEEN at plan time in Deploy run 41293904884, job `deploy` 124811306663: `ok   precache covers room pictures — 100 of 100 room pictures precached`; expected after this slice: 123 of 123)

### Phase 4: The children's room joins house 1

#### Automated

- [x] 4.1 The new and flipped unit cases red before the `HOUSES` row and the tile change, green after; unit `<phase-3 count> + N` — fd5dd63
- [x] 4.2 Deliberate break: give the children row `place: 1` → the `houseCells` case red; set `tiles.width` back to 440 → the layout case red; drop the row → roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts` — the e2e reload (phase 6) is the browser proof of the same path — fd5dd63
- [x] 4.3 `npx playwright test tests/e2e/kitchen-room.spec.ts tests/e2e/rooms-as-data.spec.ts tests/e2e/house-cross-section.spec.ts` (sandbox disabled) green — 9ca69f1
- [x] 4.4 `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-3 sha>.. -- tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json` empty — fd5dd63
- [x] 4.5 Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0` — orchestrator e2e 4c594c0 + 1ee3847 (run-log 2026-11-01)

### Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 5.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "CHILDREN|sceneKey|save-v6-kitchen-done|assets/rooms/children" CLAUDE.md` present — b10bd31
- [x] 5.2 `grep -c "Trigger:" context/changes/kids-room/follow-ups/review-fixes.md` ≥ 5; `grep -cE "^\| 20[234] " docs/design-gaps.md` = 3 — b10bd31
- [x] 5.3 Seam sweep: `grep -rnE "scene\.after :|until S-25|S-25 adds" src tests scripts --exclude=rooms.ts` empty (`sceneKey` itself lives in `src/core/rooms.ts`); `npm run art` then `git status --short public/assets` empty — b10bd31
- [x] 5.4 `git diff --stat <phase-4 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty — b10bd31
- [x] 5.5 Full local gate green; e2e (orchestrator, `--workers=4`) `189 + 0` — orchestrator e2e 4c594c0 + 1ee3847 (run-log 2026-11-01)

#### Manual

- [x] 5.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the kitchen room-done card with three tiles (salon done, kitchen done, children next); (2) the children's room at the start after "Dalej" (stage-0 look, task "Posprzątaj pokój"); (3) after "Posprzątaj pokój" (stage-1 look, task "Pomaluj ściany"); (4) after "Pomaluj ściany" (stage-2 look, task "Odnów podłogę"); (5) after "Odnów podłogę" (after look, task "Postaw łóżko"); (6) the variant panel open on the bed (three forms Baldachim, Domek, Z szufladami); (7) the room fully furnished in the natural family; (8) the children's room-done card (three done tiles, no teaser); (9) after "Dalej" (change mode and "Dom"); (10) the house cross-section with the children's room framed in `upper-left`, salon and kitchen done; (11) the house cross-section mid-renovation (after stage 2: the cell miniature shows stage-2); (12) the room under `?e2eArt=room` (stand-in boxes with Polish labels); (13) the salon room-done card with three tiles (two-tile cards no longer exist in house 1; base cards with two narrower tiles: Mostek card); compare (5)/(7) against `designs/martynka-evolution-v1/screenshots/children-form-0.png`, (6) against `children-form-0-chooser.png`, (10) against `designs/martynka-house-1-polish-v1` preview `house-four-rooms.png`
- [ ] 5.7 [human] Accept D1 against the roadmap promise "dodany wyłącznie jako dane i grafika": the staged renovation needed `sceneKey`/`stageFade` in `src/core/rooms.ts`, `scene` on a stage task, and edits in `RoomView`, `RoomScene.fadeStage`, `backdrop.ts`, `roomArt.ts` logic and one e2e snapshot field (FR-033 allows walls and floor as separate steps; S-32 reuses it as data)
- [ ] 5.8 [human] Accept the room-done card change: tiles 340 wide with 32 gap and a miniature at 0.12 on every card (two-tile base cards look narrower); four tiles (S-31) need a further change (gap 204)
- [ ] 5.9 [human] Accept the children's room costs 5/6/7 (stages) + 7/9/10/12/13/15 = 84 stars (D3 as revised by plan review F1; S-17 tunes)
- [ ] 5.10 [human] Accept the children's wording (gap 202): "Posprzątaj pokój", "Pomaluj ściany", "Odnów podłogę", the slot task labels, the agreed variant forms (Naturalne for "biurko i krzesło", Naturalna for skrzynia/szafa), and the bed forms from the pack
- [ ] 5.11 [human] On a real tablet, installed and then offline: a child who finished the kitchen opens the children's room and its pictures draw at each stage (precache)
- [ ] 5.12 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4191 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41293904884, job `build` 124810627941: `Tests  4191 passed | 3 skipped (4194)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

### Phase 6: The children's room in the browser — e2e (FR-033; #16, #2)

#### Automated

- [x] 6.1 Spec red before (deliberate breaks, each test run alone with `-g`): make `sceneKey` ignore the stage `scene` (always `after` once staged) → test 1's stage pixel red; give the children row `place: 1` → test 2 red; set a children cost to 16 → test 1's balance red; add an unknown room to `HOUSES['house-1']` → test 1 red (teaser appears); each restored; green after; meta-check: the pixel is read from the rendered frame, so a background covered by another layer would also fail — 9ca69f1
- [x] 6.2 `npx playwright test tests/e2e/kids-room.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `189 + 2`; total equals `npx playwright test --list | tail -1` — orchestrator e2e 4c594c0 + 1ee3847 (run-log 2026-11-01); --list 2 tests chromium-hook, suite total 191 (checked at ship)
- [x] 6.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`) — 9ca69f1
