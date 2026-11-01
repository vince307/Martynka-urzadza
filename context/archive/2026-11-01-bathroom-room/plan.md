# Bathroom, the fourth room of house 1, and a four-tile room-done card — Implementation Plan

## Overview

Roadmap slice S-31 `bathroom-room` (milestone M-03, path of house 1, Stream B; PRD FR-033, FR-035, FR-038), autonomous
run `2026-11-01-bathroom-polish-lab`, branch `feat/bathroom-room` cut from `main` at `e451fa8`. Outcome: a child who
finished the children's room renovates the bathroom (walls and floor, then tub with curtain, sink and mirror, towel
shelf, bath rug, plant and toy shelf, 3 variants each). The bathroom fills the `upper-right` cell of the house-1
cross-section, today the closed "Wkrótce" cell, so house 1 has all four rooms and, for the first time, no next room.

Binding inputs: `context/runs/2026-11-01-bathroom-polish-lab/scope.md`, `change.md` D1-D8, `research.md` (its Code
References are the grounding). No lessons file exists in `context/foundation/` (checked at this step), so no lesson is
named in a phase.

**The roadmap Risk is the point: "a room is data".** The bathroom itself is data and art only. One thing is NOT data,
put in scope by the maintainer (scope.md, kids-room follow-up 1, design gap 204) and named for the product owner
(change.md, the PR body „dla właściciela produktu”, a `[human]` row):

- **The "Pokój gotowy!" card fits four tiles.** With the bathroom every house-1 card lists four rooms
  (4·340 + 3·32 = 1456 > the 1144 card). The card width becomes a function of the tile count: a pure helper
  `roomDoneCardRect` in a new `src/core/roomDoneLayout.ts`, read by `RoomDoneCard.show`; `ROOM_DONE_LAYOUT.card` keeps
  the numbers. Two- and three-tile cards stay pixel-identical (both resolve to the 1144 card at x 388).

Save format stays v6 (`SAVE_VERSION` 6), no migration; one frozen fixture is ADDED
(`tests/fixtures/save-v6-children-done.json`). A phase that finds it must change the save format, star income, mastery,
curriculum, variants, task generators, `balance.loader`, the salon/kitchen/children/Mostek/Hangar data or pictures,
`HouseView`, `celebrationView` or the purchase flow stops with `STATUS: BLOCKED` and records why.

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `6b96a9f`:

- **Card.** `RoomDoneCard.show` (`src/ui/widgets/RoomDoneCard.ts`) draws the card at the fixed `ROOM_DONE_LAYOUT.card`
  (`left` 388, `width` 1144, `top` 220, `height` 560), centres `items.length` tiles of `tiles.width` 340 / `tiles.gap` 32
  on `card.left + card.width / 2` and centres the burst on the card. `tiles.left` (490) is read nowhere (kids-room
  follow-up 3). The title (x 960) and "Dalej" (`button`, 735-1185) are fixed. `src/core/guideLayout.ts` is the precedent
  for pure layout maths in core.
- **Items.** `RoomScene` builds them with `roomsListView(houseRoomList(...))`; `houseRoomList` (`src/core/house.ts`)
  lists every known room of the house, a teaser only before an unknown room. With the bathroom, house 1 gives four items
  on every card; after the bathroom, four done tiles and no teaser.
- **Card overlap.** HUD ends at y 148; the card spans y 220-780. `ROOM_LAYOUT.houseButton` (1622-1878 × 172-276) would
  overlap a 1516 card (right edge 1718) but `RoomScene` hides it while the card is up (`blocked`) — house-cross-section
  follow-up 21 asks for a browser test of exactly that.
- **A room is data** for the rest: `ROOMS` (`src/data/rooms.ts`; `KITCHEN` is the one-stage shape to mirror),
  `ROOM_SCENE_FILES` (`src/data/roomArt.ts`), `ROOM_PACKS` in `scripts/make-task-art.mjs` (pack folders `assets/room/`
  and `assets/furniture/`, the bathroom pack has the same layout), `pl.room.{names,tasks,slots,variants}`
  (`src/data/pl.ts`), `HOUSES['house-1']` (`src/data/houses.ts`: salon (0,0), kitchen (0,1), children (1,0));
  `HOUSE_GEOMETRY['house-1']` already has `upper-right` (1060,236, 608×342).
- **Pack** `designs/martynka-bathroom-v1`: one before/after pair, `bathroom-shadows`, `shadowEllipses: []`, six slots
  (table in research § 5), families natural/sunny/mint, QA passed; surround `#FFF5DF` → `recolourBoard: false`.
- **Budget** (research § 3): bathroom boot 29.05 s against the 48 s limit (salon 41.85 s stays the worst case).
- **Last-room path** (research § 7): `roomInRenovation` returns null when every known room is done, `nextRoom` keeps
  `currentRoom`; the Hangar ships this path. No house-1-only branch in `HouseScene`/`HouseView`/`RoomScene`.
- **Rollback** (research § 6): an older build sends `currentRoom: 'bathroom'` to the salon, keeps `rooms.bathroom` and the
  saved cell; no `deploy/README.md` line.
- **Tests that pin a three-room house 1** (phase 4 edits): `tests/roomsData.test.ts` (house-1 list; "keeps the child in
  the children's room after its last task"), `tests/fixtureLoadPath.test.ts` (kitchen-done house → three rooms);
  e2e `kids-room.spec.ts` #16, `kitchen-room.spec.ts` #2 and #16, `rooms-as-data.spec.ts` (`HOUSE` constant, #10),
  `room-change.spec.ts` (`toHaveLength(3)`). `tests/layout.test.ts` "lays the room list tiles…" (pins `n` = 3) changes
  in phase 2.
- **Counts.** The contract's baseline line is still the placeholder at plan time; phases measure on the branch and write
  `baseline + delta`. Last shipped numbers (kids-room, Deploy run 41313671518 of merge #133, SEEN at this step with
  `gh run view 41313671518 --log`, sandbox disabled): job `build` step `Run npm test` `Tests  4212 passed | 3 skipped
  (4215)`; step `Run npm run build` `e2e hook: absent (2 chunks checked)`; job `deploy` step `Smoke check (deploy)`
  `ok   precache covers room pictures — 123 of 123 room pictures precached`. E2E total after kids-room: 191.

## Desired End State

- `roomDoneCardRect(count, spec)` is the one rule for the card rectangle and the tile positions: width
  `max(minWidth, count·tileWidth + (count−1)·gap + 2·padding)`, centred on `centerX`; for 2 and 3 tiles it returns the
  card used today (388/1144) and the same tile lefts; for 4 tiles a card 1516 wide at 202.
- `RoomDoneCard.show` draws card, tiles and burst from that rect; `ROOM_DONE_LAYOUT.card` holds `centerX`, `minWidth`,
  `padding` (no `left`/`width`), `tiles.left` is gone.
- `BATHROOM: RoomDef` (`id: 'bathroom'`): one stage task "Odnów ściany i podłogę" (5) then six slots from the pack
  manifest (7/9/10/12/13/15, total 71); 21 WebP in `public/assets/rooms/bathroom/`; Polish copy.
- `HOUSES['house-1']` gains `{ room: 'bathroom', floor: 1, place: 1 }`. After the children's room the card shows four
  tiles and "Dalej" opens the bathroom; after its last purchase the card shows four done tiles, no teaser, "Dalej" keeps
  the child in the bathroom in change mode with "Dom". The cross-section has no closed cell once the bathroom is reached.
- A v6 save with the children's room finished (frozen fixture) loads into the bathroom with nothing lost.
- Deploy smoke: `144 of 144 room pictures precached` with no script change.
- Gap 204 edited, gap 205 added (bathroom wording); CLAUDE.md "Current state" has one S-31 sentence; follow-ups
  recorded.
- `tests/e2e/bathroom-room.spec.ts` proves the purchase flow to the end, the four-tile card in the rendered frame, the
  hidden "Dom" button while the card is up and the `upper-right` cell.

### Key Discoveries:

- `src/core/` may not import `src/data/` values: `roomDoneCardRect` takes the numbers as an argument (`spec`), like
  `guideRect`; `RoomDoneCard` passes `ROOM_DONE_LAYOUT`.
- `tests/roomArt.test.ts` "leaves no file … without a table entry" means the 21 files, `BATHROOM`, the scene-file row and
  the copy land in ONE phase (phase 3); `tests/roomsData.test.ts` "placed in exactly one house" needs a temporary
  exemption in phase 3 removed in phase 4 (S-25 F2, S-30 `041e279` precedent).
- Adding `BATHROOM` to `ROOMS` alone keeps it unreachable; only the `HOUSES` row (phase 4) changes what a child sees.
- The card layout must be in place BEFORE the `HOUSES` row (phase 2 before phase 4), so no commit shows an overflowing
  card.
- Hit boxes: ducks (1316-1477 × 332-429) and cabinet (1326-1504 × 424-790) overlap by 5 rows; the cabinet (z 30) wins
  there, the ducks keep other points (`unreachableSlots` = [] expected, tested in phase 3).

## What We're NOT Doing

- No change to `HouseView`, `HouseScene`, `celebrationView`, `SalonBackdrop`, `roomCapture`, `roomArtLoader`, `artHealth`,
  the purchase flow, the save format or migrations.
- No 'house' celebration intensity when house 1 completes (PRD FR-040); S-24 owns the finished-house moment (research
  § 7, `[human]` row).
- No stages beyond the one before/after pair (the pack has no intermediate backgrounds; D1).
- No smaller tiles, no two-row card (research options C, D rejected); no change to tile size, miniature, captions,
  title or "Dalej".
- No card rectangle in the e2e hook snapshot (the rendered-pixel check in phase 6 is the browser proof).
- No `?e2eSave=v6-children-done` seam (fixture unit test + in-session e2e prove the landing, S-25/S-30 precedent).
- No atlas, no WebP quality change (budget measured); no pack thumbnail for the room.
- No `deploy/README.md` rollback line (research § 6).
- No S-32 kitchen stages or cream salon, no S-33 laboratory.

## Implementation Approach

Pure card rule first (tdd), then the card reads it with every existing card unchanged (impl), then the bathroom as
data/art/copy still unreachable (impl), then the one `HOUSES` row with the frozen fixture and the flipped tests (tdd),
then docs, gaps, follow-ups, seam sweep and the visual pass (impl), finally one browser spec (e2e). No phase adds a UI
component; phase 2 edits one (`RoomDoneCard`).

**E2E rule for every phase (scope.md):** a phase runs only the specs it adds or edits, each with the single-spec command
from `context/foundation/test-stack.md` (`npx playwright test tests/e2e/<name>.spec.ts`, sandbox disabled), never the
full suite. The orchestrator runs the full suite (`npx playwright test --workers=4`) ONCE after phase 6 from a pinned
worktree; expected `191 + 2` (phase 6 adds two tests; phase 4 edits, never adds).

## Phase 1: One rule for the room-done card rectangle

Driver: tdd
Driver why: the helper is absent and pure (core, no Phaser): failing literal cases for 1-5 tiles lead it.

### Overview

`src/core/roomDoneLayout.ts` gains the card rule. Nothing visible changes.

### Changes Required:

#### 1. Pure rule

**File**: `src/core/roomDoneLayout.ts` (new)

**Intent**: one place for "how wide is the room-done card and where does each tile start" for any tile count.

**Contract**: `roomDoneCardRect(count: number, spec: { centerX: number; minWidth: number; padding: number; tileWidth:
number; gap: number }): { left: number; width: number; tileLefts: number[] }` — `width = max(minWidth, count·tileWidth +
(count−1)·gap + 2·padding)` (count 0 → `minWidth`), `left = centerX − width/2`, `tileLefts[i] = centerX − total/2 +
i·(tileWidth + gap)` with `total = count·tileWidth + (count−1)·gap`. Doc comment names gap 204 and the limit (n = 5 is
1888 wide; n = 6 does not fit 1920).

#### 2. Tests

**File**: `tests/roomDoneLayout.test.ts` (new)

**Contract**: with `{ centerX 960, minWidth 1144, padding 30, tileWidth 340, gap 32 }` as a literal in the test (not
imported from `src/data`): n=1 → `{ left 388, width 1144, tileLefts [790] }`; n=2 → 388/1144, `[604, 976]`; n=3 →
388/1144, `[418, 790, 1162]`; n=4 → 202/1516, `[232, 604, 976, 1348]`; n=5 → 16/1888, `[46, 418, 790, 1162, 1534]`;
n=0 → 388/1144, `[]`; every tile inside the card for n 1..5.

### Success Criteria:

#### Automated Verification:

- New cases red before the helper exists, green after; unit `baseline + N`
- Deliberate break: drop `2·padding` from the width → the n=4 case red; centre tiles on `left + minWidth/2` instead of `centerX` → the n=4 tile case red; each restored; meta-check: the expectations are literals computed by hand from today's 388/1144 card, not by the helper
- `git diff --stat 6b96a9f -- src/ui src/scenes src/data src/testing tests/e2e` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); no e2e in this phase (no spec touched; the orchestrator runs the full suite after phase 6)

---

## Phase 2: The card reads the rule; two- and three-tile cards unchanged

Driver: impl
Driver why: glue — `RoomDoneCard.show` and the layout data switch to the phase-1 helper with no visible change for today's cards.

### Overview

The card, its tiles and its burst come from `roomDoneCardRect(items.length, …)`. Every card a child sees today (2 and 3
tiles) draws exactly as before.

### Changes Required:

#### 1. Layout data

**File**: `src/data/layout.ts`

**Intent**: the card holds the numbers of the rule, not a fixed rectangle; the unread `tiles.left` goes (kids-room
follow-up 3).

**Contract**: `ROOM_DONE_LAYOUT.card` = `{ centerX: 960, minWidth: 1144, padding: 30, top: 220, height: 560, border: 7,
radius: 46 }`; `tiles.left` removed; the DESIGN-GAP 204 comment rewritten (card width by tile count, up to five tiles).
`ROOM_TOUCH_TARGETS.cardNext` unchanged.

#### 2. Card widget

**File**: `src/ui/widgets/RoomDoneCard.ts`

**Intent**: `show` computes `const rect = roomDoneCardRect(items.length, { ...card, tileWidth: tiles.width, gap:
tiles.gap })` (or equivalent) and draws the card at `rect.left`/`rect.width`, each tile at `rect.tileLefts[index]`, the
burst at `rect.left + rect.width/2`.

**Contract**: no other behaviour change (`drawRoomTile`, `drawTeaserTile`, captions, miniature, "Dalej", `hide`
untouched); the source guards of `tests/roomDoneCardWiring.test.ts` stay true.

#### 3. Tests

**Files**: `tests/layout.test.ts`, `tests/roomDoneCardWiring.test.ts`

**Contract**: `layout` "lays the room list tiles…" becomes: for every n from 2 to `max(houseRoomList(h, ROOMS).length)`
over `HOUSES` and also n = 4 and 5, `roomDoneCardRect(n, …)` lies inside `0..GAME_WIDTH`, every tile lies inside the
card, the card does not overlap the HUD rects (`HUD_LAYOUT` speaker, room switch, settings; `TASK_LAYOUT.starCounter`);
`max(houseRoomList…)` ≤ 5; for n = 2 and 3 the rect is exactly `{ left: 388, width: 1144 }` (the accepted look stays); the existing tile/title/button/miniature lines stay. The test "keeps the mode button and the \"Pokój gotowy!\" button touch
targets…" builds `rect(card)` from `card.left`/`card.width`, which phase 2 removes (typecheck fails): it is rewritten to
build the card rect from `roomDoneCardRect(n, …)` for every n from 2 to 5 (plus `card.top`/`card.height`) and keeps
every assertion it has today — card above `tray.top`, inside `0..GAME_WIDTH`, clear of the HUD rects, "Dalej" inside the
card (plan review F1). The wiring test gains: the source calls `roomDoneCardRect(` and no longer reads `card.left` or
`card.width`.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/layout.test.ts tests/roomDoneCardWiring.test.ts tests/roomDoneLayout.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: set `ROOM_DONE_LAYOUT.card.minWidth` to 1100 → the accepted-look case (n = 2, 3 give 388/1144) red; set `padding` to 60 → the n = 5 inside-`GAME_WIDTH` case red; put `card.left + card.width / 2` back in `show` → the wiring case red; each restored; meta-check: the wiring test proves the call site, the layout test proves the numbers, the visual pass (phase 5) proves the pixels
- `git diff --stat <phase-1 sha> -- src/data/rooms.ts src/data/houses.ts src/data/pl.ts src/data/roomArt.ts src/scenes src/core public tests/fixtures tests/e2e` empty (only `roomDoneLayout.ts` exists in core from phase 1; the diff names no core file)
- Full local gate green; no e2e in this phase (no spec touched; card items unchanged, the orchestrator runs the full suite after phase 6)

#### Manual Verification:

- [reviewer] `RoomDoneCard.show` reads every horizontal card coordinate from the rect (card fill and border, tile lefts, burst centre); the title and "Dalej" stay at x 960 by data

---

## Phase 3: The bathroom as data, copy and art (unreachable)

Driver: impl
Driver why: art conversion through the script plus data rows copied from the pack manifest, proven by the existing room-art and room-data invariants — art pipeline and data glue.

### Overview

The bathroom exists with its pictures and Polish text, precached and budget-checked, but no house lists it yet.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/bathroom/*.webp` (21, generated)

**Contract**: a pack-root constant `BATHROOM_V1 = join(ROOT, 'designs/martynka-bathroom-v1')`; a `ROOM_PACKS` row `{ room:
'bathroom', pack: BATHROOM_V1, scene: ['bathroom-before', 'bathroom-after', 'bathroom-shadows'], decor: [], furniture:
bathroom-<tub|sink|cabinet|rug|plant|ducks>-<natural|sunny|mint>, recolourBoard: false }`. `convert()` settings
unchanged; every other output byte-identical. Needs `cwebp` and Python with Pillow 12.1.0 + numpy 2.4.3 (as S-25). If
either is missing or `npm run art` fails for a tool or sandbox reason, re-run the one command with the sandbox disabled
(profile § 8); if it still fails the phase stops `STATUS: BLOCKED` with the error line: never hand-convert a WebP, never
pin other versions, never write into `designs/`. Re-measure the 21 files' bytes and compare with research (563 514 B).

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`

**Contract**: `bathroomSlots: SlotDef[]` copied slot by slot from `designs/martynka-bathroom-v1/manifest.json`
`rooms.bathroom.slots` (id, x, y, width, height, z, anchor, visibleRect; variants `bathroom/<file id>` natural, sunny,
mint): tub 468,284 441×492 z20; sink 943,291 313×478 z25; cabinet 1310,408 210×398 z30; rug 800,712 346×188 z10; plant
363,583 205×225 z40; ducks 1300,316 193×129 z15. `BATHROOM` = `id: 'bathroom'`, `scene: { before: 'bathroom/before',
after: 'bathroom/after', shadows: 'bathroom/shadows' }`, `decor: []`, `worn: []`, `contactShadows: []`, tasks: stage
`renovate` (label `renovate`, 5, no `scene`), slots `place-tub` (`placeTub`, 7), `set-up-sink` (`setUpSink`, 9),
`place-towel-shelf` (`placeTowelShelf`, 10), `lay-bath-rug` (`layBathRug`, 12), `place-bath-plant` (`placeBathPlant`,
13), `hang-toy-shelf` (`hangToyShelf`, 15); header comment naming the pack, FR-033, D1 and the costs (S-17 tunes).
`ROOMS` gains `[BATHROOM.id]: BATHROOM` after `CHILDREN`. `ROOM_SCENE_FILES.bathroom` = `{ before: 'bathroom-before',
after: 'bathroom-after', shadows: 'bathroom-shadows' }`.

#### 3. Polish copy (Polish-language read)

**File**: `src/data/pl.ts`

| key | text |
|---|---|
| `room.names.bathroom` | Łazienka |
| `room.slots['bathroom-tub' / '-sink' / '-cabinet' / '-rug' / '-plant' / '-ducks']` | wanna z zasłonką / umywalka i lustro / regał z ręcznikami / dywanik / roślina / półka z zabawkami |
| `room.variants` | tub, plant, ducks: `['Naturalna', 'Słoneczna', 'Miętowa']`; sink: `['Naturalne', 'Słoneczne', 'Miętowe']` (two nouns, plural agreement like "biurko i krzesło"); cabinet, rug: `['Naturalny', 'Słoneczny', 'Miętowy']` |
| `room.tasks` | `renovate` reused · `placeTub` Postaw wannę z zasłonką · `setUpSink` Ustaw umywalkę i lustro · `placeTowelShelf` Postaw regał z ręcznikami · `layBathRug` Połóż dywanik · `placeBathPlant` Postaw roślinę · `hangToyShelf` Powieś półkę z zabawkami |

A comment cites design gap 205 (the pack gives slot labels and masculine family labels only; the imperatives and the
agreed forms are ours).

#### 4. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-bathroom.json` (new snapshot), `tests/roomsData.test.ts`,
`tests/roomHit.test.ts`

**Contract**: snapshot equality adds `roomArt(ROOMS.bathroom)` = the new fixture (written from the pack: keys and urls
from the manifest file names, sizes from the PNGs, labels from the copy table — not dumped from `roomArt()`), 21
entries; `ROOM_ART` order follows `ROOMS`; a `describe('bathroom data (FR-033)')` with a manifest literal (`[id, x, y,
width, height, z]` per slot, from the manifest), one stage task first then six slot tasks in the order above, costs
`[5, 7, 9, 10, 12, 13, 15]` summing to 71, no `scene` on the stage; `unreachableSlots` over the room with all six bought
= `[]`. **Placement exemption:** the invariant "is keyed by its own id and placed in exactly one house of HOUSES"
changes ONLY its expected count to `id === 'bathroom' ? 0 : 1` with a comment "S-31 phase 3: no house lists the
bathroom yet; phase 4 adds its HOUSES row and removes this exemption".

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/bathroom/`
- `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: change the sink's `x` in `bathroomSlots` → the manifest literal red; delete `bathroom-rug-mint.webp` → the size/orphan cases red; drop `'bathroom-ducks'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `bathroomSlots`; whether the picture looks right is the visual pass (phase 5)
- `npm run build` then `grep -o "assets/rooms/bathroom/" dist/sw.js | wc -l` = 21
- `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bridge public/assets/rooms/hangar` empty
- Full local gate green; no e2e in this phase (no spec touched; the bathroom is unreachable)

#### Manual Verification:

- [reviewer] Polish-language read of the bathroom copy in `src/data/pl.ts` against the table above (profile § 2: room captions, not task content): caption nominatives, variant forms agreeing with the noun (wanna/roślina/półka → -a, umywalka i lustro → -e, regał/dywanik → -y), task labels imperative + accusative (wannę, umywalkę, roślinę, półkę), each label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff — impl review (all forms pass; sample E1-E6 OK)
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 144 of 144 room pictures precached` (SEEN at plan time in Deploy run 41313671518, job `deploy`: `ok   precache covers room pictures — 123 of 123 room pictures precached`; expected after this slice: 123 + 21 = 144)

---

## Phase 4: The bathroom joins house 1

Driver: tdd
Driver why: the `HOUSES` row is absent; the flipped flow tests, the house-cell case and the finished-children fixture lead it red-first — data contracts.

### Overview

One data row puts the room in `upper-right`; "Dalej" after the children's room leads into it; a saved finished
children's room opens there; every house-1 card shows four tiles (phase 2 made room for them).

### Changes Required:

#### 1. House row

**File**: `src/data/houses.ts`

**Contract**: `HOUSES['house-1'].rooms` = salon (0,0), kitchen (0,1), children (1,0), `{ room: 'bathroom', floor: 1,
place: 1 }`; the header comment "the children's room and the closed cell come with later slices" updated (house 1 is
complete; a closed cell is drawn only for a room not reached).

#### 2. Frozen fixture

**File**: `tests/fixtures/save-v6-children-done.json` (new, frozen; never edited after this phase)

**Contract**: a v6 save as the S-25 build writes it (shape of `tests/fixtures/save-v6-kitchen-done.json`): `house`
`{ id: 'house-1', rooms: [salon (0,0), kitchen (0,1), children (1,0)] }`, `currentRoom: 'children'`, `rooms.salon`,
`rooms.kitchen`, `rooms.children` at full `tasksDone` with a chosen variant for each of their own slots (so
`roomStateProblems` = []), a stars value, a learner.

#### 3. Tests

**Files**: `tests/roomsData.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`,
`tests/e2e/kids-room.spec.ts`, `tests/e2e/kitchen-room.spec.ts`, `tests/e2e/rooms-as-data.spec.ts`,
`tests/e2e/room-change.spec.ts`, and every other test the grep below finds

**Contract**:
- `roomsData`: the phase-3 placement exemption is removed (red first while the row is missing); the house-1 list gains
  `{ room: 'bathroom', unlockAfter: 'children' }`; "keeps the child in the children's room after its last task" becomes
  "moves a finished children's room into the bathroom" (`nextRoom`, `movedFrom 'children'`, empty state, the other three
  untouched); new "keeps the child in the bathroom after its last task: Dalej stays" (house 1 has no next room).
- `houseCells`: house-1 with `bathroom` current and the other three done → `['done', 'done', 'done', 'current']`,
  `upper-right` room `bathroom`; all four done → no `closed` cell.
- `fixtureLoadPath`: `save-v6-children-done` joins `FIXTURES` (round-trip); a case mirroring `main.ts`
  (`repairCurrentRoom` → `mergeHouse` → `nextRoom`) expects rooms `['salon', 'kitchen', 'children', 'bathroom']`,
  `currentRoom 'bathroom'`, `movedFrom 'children'`, the three rooms equal to the fixture's, stars kept; the existing
  kitchen-done case expects four rooms in the merged house (current room stays `children`).
- **The e2e assertions that change, each with why** (the ONLY reason any changes is that house 1 now lists a fourth,
  known room after the children's room, so every card gains one tile and "Dalej" after the children's room has a next
  room; every other line stays):

  | spec / test | assertion today | after this phase | why |
  |---|---|---|---|
  | `kitchen-room.spec.ts` "#2 S-22 after the salon …" | items `['room:true:true', 'room:false:true', 'room:false:false']` | `[…, 'room:false:false']` (four) | bathroom listed, locked |
  | `kitchen-room.spec.ts` "#16 S-22 S-25 the kitchen furnishes …" | `items[2]` children unlocked | unchanged, plus `items[3]` `{ kind: 'room', id: 'bathroom', done: false, unlocked: false }` | fourth tile |
  | `rooms-as-data.spec.ts` `HOUSE` constant | three cells | four cells (`bathroom` floor 1 place 1) | loaded/written house is the data house |
  | `rooms-as-data.spec.ts` "#10 … a finished salon reloads into the kitchen" | three items | `[…, 'room:false:false']` | as kitchen-room #2 |
  | `room-change.spec.ts` "FR-019 the last purchase …" | `toHaveLength(3)` | `toHaveLength(4)` and `items[3]` bathroom locked | fourth tile |
  | `kids-room.spec.ts` "#16 S-25 …" (title: "the card shows four rooms and Dalej moves to the bathroom") | three done items; "Dalej" keeps `children`, then mode button | items `[salon, kitchen, children]` done + `bathroom` `done: false, unlocked: true`; after "Dalej" `currentRoom` `'bathroom'` and `rooms.children` equal to the state before "Dalej"; the change-mode proof of the children's room is KEPT through a visit (`openHouse`, tap `upper-left`, `visiting 'children'`, `modeButton` present, `houseLabel 'Dom'`) | "Dalej" now has a next room; kitchen-room #16 precedent |

  Unchanged on purpose: `kids-room.spec.ts` #2 (the bathroom is not reached, so `upper-right` stays `closed` with the
  pack's closed picture), `house-cross-section.spec.ts` (closed cells for unreached rooms), `salon-extra-slots.spec.ts`
  (index-based), `final-art-room-done.spec.ts`, the base specs. The phase runs `grep -rnE "house-1|FIRST_HOUSE|'children'|items\)\.toHaveLength|upper-right" tests`
  and lists every hit in the handoff as "edited (row above)" or "stays true (why)"; a test flipped for a reason not in
  this table is a finding, not an edit.

### Success Criteria:

#### Automated Verification:

- The new and flipped unit cases red before the `HOUSES` row, green after; unit `<phase-3 count> + N`
- Deliberate break: give the bathroom row `place: 0` → the `houseCells` case red; drop the row → roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts` — the e2e reload (phase 6) is the browser proof of the same path
- Single specs, each with `npx playwright test tests/e2e/<name>.spec.ts` (sandbox disabled), never the full suite: `kids-room`, `kitchen-room`, `rooms-as-data`, `room-change` green; `house-cross-section` green (unchanged, run because its cells changed meaning)
- `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/layout.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-3 sha>.. -- tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json tests/fixtures/save-v6-kitchen-done.json` empty
- Full local gate green; full e2e left to the orchestrator after phase 6

---

## Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-4 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/bathroom-room/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-31 sentence (the room `bathroom` "Łazienka" as the fourth and last
room of house 1 in `upper-right`: `BATHROOM` in `src/data/rooms.ts`, one stage then six slots, 5-15 = 71, art from
`martynka-bathroom-v1` in `public/assets/rooms/bathroom/`, `roomDoneCardRect` in `src/core/roomDoneLayout.ts` sizing the
room-done card by tile count (2-3 tiles unchanged, 4 tiles 1516 wide), "Dalej" stays after the bathroom, save v6
unchanged, frozen `save-v6-children-done.json`, follow-ups path); the S-25 wording "the room-done card has three tiles
… on every card" and "the kitchen was house 1's last room until S-25" updated where they now mislead. Gap rows: 204
edited (card width by tile count, two/three-tile cards unchanged, five tiles is the limit), 205 new (bathroom wording
ours: task imperatives, agreed variant forms, "Półka z zabawkami" from the pack instead of the roadmap's "półka z
kaczuszkami", "Regał z ręcznikami" instead of "szafka"). Follow-ups with `Trigger:` lines: kids-room 1 (four tiles) and 3
(`tiles.left`) closed with evidence; house-cross-section 21 / kids-room 11 closed by the phase-6 assertion; kids-room 7
(atlas) re-recorded with the measured bathroom bytes; final-art-salon F2 (`drawRoomMiniature` stand-ins on one
`Graphics`) re-recorded: the card changed but not the miniature drawing; hangar 4 (a room finished on an older build
meets the next without the card) carried for the children's room → bathroom; kids-room 10 / kitchen-room 6 (service-worker install
warning; `Trigger:` the precache set) fire because the precache set grows by 21 room pictures: re-recorded with the new
count, warning unchanged (plan review F2); the finished-house celebration (FR-040
'house' intensity) recorded with `Trigger: S-24`; a sixth room in one house (card limit n = 5) with `Trigger: a house
with six rooms`; every other open follow-up whose `Trigger:` names a file this slice changed — included, closed with
evidence, or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers — `card.left`/`card.width` outside `roomDoneLayout.ts` users; `tiles.left`; stale
comments "four tiles (S-31) do not fit", "closed cell come with later slices", "last room of house 1" naming the
children's room, "three tiles" in `src/`, `tests/`, `scripts/`; gap numbers cited in comments match the rows; `pl.ts`
comment cites row 205; no placement exemption left (`grep -n "id === 'bathroom' ? 0" tests` empty); no second copy of
the card-rect maths in tests (the layout test calls the helper).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "BATHROOM|roomDoneCardRect|save-v6-children-done|assets/rooms/bathroom" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/bathroom-room/follow-ups/review-fixes.md` ≥ 6; `grep -cE "^\| 20[45] " docs/design-gaps.md` = 2
- Seam sweep: `grep -rnE "tiles\.left|do not fit at this width|come with later slices" src tests scripts` empty; `npm run art` then `git status --short public/assets` empty
- `git diff --stat <phase-4 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; full e2e left to the orchestrator after phase 6

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the salon room-done card with four tiles (salon done, kitchen next, children and bathroom locked); (2) the kitchen card with four tiles; (3) the children's room card with four tiles (three done, bathroom next); (4) the bathroom at the start after "Dalej" (before look, task "Odnów ściany i podłogę"); (5) after the stage (after look, task "Postaw wannę z zasłonką"); (6) the variant panel open on the tub (three families); (7) the room fully furnished in the natural family; (8) the same in sunny or mint via the change panel; (9) the bathroom card with four done tiles, no teaser, nothing clipped at the card edges; (10) after "Dalej" (change mode and "Dom"); (11) the house cross-section with the bathroom framed in `upper-right` mid-renovation; (12) the house cross-section with all four rooms done, no "Wkrótce"; (13) the bathroom under `?e2eArt=room` (stand-in boxes with Polish labels); (14) the base: Mostek card (two tiles) and Hangar card, unchanged against the kids-room frames; compare (5)/(7) against `designs/martynka-bathroom-v1/screenshots/bathroom-after-*.png`, (4) against `bathroom-before.png`, (12) against `house-four-rooms.png`
- [human] Accept the room-done card change outside room data: `roomDoneCardRect` in `src/core/roomDoneLayout.ts`, `RoomDoneCard.show` reading it and `ROOM_DONE_LAYOUT.card` holding `centerX`/`minWidth`/`padding` — the card grows to 1516 px for four tiles, two- and three-tile cards are unchanged (scope.md put the four-tile card in scope; gap 204)
- [human] Accept the bathroom costs 5 (stage) + 7/9/10/12/13/15 = 71 stars (the kitchen curve; S-17 tunes)
- [human] Accept the bathroom wording (gap 205): "Postaw wannę z zasłonką", "Ustaw umywalkę i lustro", "Postaw regał z ręcznikami", "Połóż dywanik", "Postaw roślinę", "Powieś półkę z zabawkami", the agreed variant forms (Naturalne for "umywalka i lustro"), and the pack's "regał z ręcznikami" / "półka z zabawkami" instead of the roadmap's "szafka" / "półka z kaczuszkami"
- [human] Accept that finishing the bathroom (house 1 complete) still shows the ROOM celebration, not the PRD FR-040 'house' intensity — decided against the PRD's literal text because roadmap S-24 owns the finished-house moment (residents, sticker)
- [human] On a real tablet, installed and then offline: a child who finished the children's room opens the bathroom, its pictures draw, and the four-tile card is readable
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4212 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41313671518, job `build`, steps `Run npm test`: `Tests  4212 passed | 3 skipped (4215)` and `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

---

## Phase 6: The bathroom in the browser — e2e (FR-033, FR-038; #16, #2)

Driver: e2e
Driver why: the four-tile card fit and the hidden "Dom" button exist only in the rendered frame and the purchase flow crosses four rooms; built by phases 1-4, after the phase-5 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow, balance exact) and #2 (the room survives a reload).

### Overview

One spec against the hook build modelled on `tests/e2e/kids-room.spec.ts` and `tests/e2e/hangar-module.spec.ts`,
reading the RENDERED frame (`renderedPixel`, profile § 8) for every "is it visible" risk, never a texture.

### Changes Required:

#### 1. Spec

**Files**: `tests/e2e/bathroom-room.spec.ts` (new); `playwright.config.ts` (add `bathroom-room` to the `ROUND_SPEC`
alternation, project `chromium-hook`; no other field); reuse the helpers of `tests/e2e/support/salon.ts` and
`kids-room.spec.ts` (move a helper to `tests/e2e/support/` if both specs need it, test code only)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#16 S-31 FR-033 the bathroom is renovated and furnished to the end; the balance is exact; the card shows four done
  rooms inside its rendered frame, "Dom" is hidden under it, and "Dalej" stays` — `e2eStars` = salon + kitchen +
  children + bathroom totals; finish the first three rooms, "Dalej" → room `bathroom`, `tasksDone 0`; the rendered pixel
  at a wall point differs (≥ 30 in a channel) after the stage purchase (point measured on the WebP and recorded in a
  comment); buy the six slots; stars after each purchase = the previous minus the cost (the save's stars); card `items`
  = four `room` items `salon`, `kitchen`, `children`, `bathroom`, all `done`, no `teaser`; while the card is up
  `targets.houseButton` is null (house-cross-section follow-up 21); `renderedPixel` at a point inside the four-tile card
  but outside the old 388-1532 card (candidate (1620, 300): card face, below the hidden house button) shows the card
  colour (`PLACEHOLDER_COLORS.unlockCard`, tolerance per channel) and a point inside the fourth tile (candidate
  (1370, 560), the tile face left of the caption text — the tile centre x 1518 sits on the caption line at y 544, plan
  review F3) shows the tile ivory — candidates re-measured and recorded in a comment;
  "Dalej" → room `bathroom`, mode button present, `houseLabel 'Dom'`.
- `#2 S-31 FR-038 the house shows the bathroom in its upper-right cell; a reload keeps the child there` — reach the
  bathroom, buy the stage; "Dom" → `houseView` cells `['done', 'done', 'done', 'current']` with `upper-right` room
  `bathroom`; `renderedPixel` inside `upper-right` is NOT the closed-cell cream `(255, 245, 223)` (> 40 in a channel,
  point recorded); tap `upper-right` → room `bathroom`, `visiting` null; reload → `currentRoom 'bathroom'`, `tasksDone 1`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each test run alone with `-g`): give the bathroom row `place: 0` → test 2 red; set a bathroom cost to 16 → test 1's balance red; make `RoomDoneCard.show` use `minWidth` for every count (a fixed 1144 card) → test 1's card-colour pixel red; show the house button while the card is up (drop it from `blocked` in `RoomScene`) → test 1 red; each restored; green after; meta-check: the pixels are read from the rendered frame, so a card covered by another layer or clipped would also fail
- `npx playwright test tests/e2e/bathroom-room.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `191 + 2`, total equal to `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/roomDoneLayout.test.ts`: card rect for 0-5 tiles, literals (phase 1).
- `tests/layout.test.ts`, `tests/roomDoneCardWiring.test.ts`: the card fits every house list and the HUD; the widget calls the rule (phase 2).
- `tests/roomArt.test.ts`: bathroom snapshot, 21 entries, sizes, orphans, labels, weight (phase 3).
- `tests/roomsData.test.ts`: bathroom manifest literal, costs 71, house-1 list, "Dalej" into and inside the bathroom (phases 3, 4).
- `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`: `upper-right` cell; `save-v6-children-done` round-trip and landing (phase 4).
- `tests/bootBudget.test.ts`, `tests/roomHit.test.ts`: bathroom covered by `ROOMS` iteration / one explicit case.

### Integration Tests:

- Deploy smoke: `room pictures` 144 of 144 (proven at ship, no script change).
- e2e: phase-6 spec; four specs edited in phase 4; full suite once by the orchestrator after phase 6.

### Manual Testing Steps:

1. House child with enough `?e2eStars`: finish salon, kitchen and children's room → four-tile card → "Dalej" → bathroom before look.
2. Buy the stage, watch the after picture; buy the six slots, change a variant.
3. "Dom" mid-renovation → `upper-right` framed; after the last purchase no "Wkrótce" anywhere.
4. Finish → card with four done tiles, "Dalej" stays with change mode.
5. Base child: Mostek and Hangar cards unchanged.
6. Tablet, installed, offline: the bathroom pictures draw.

## Performance Considerations

Boot loads only the room in renovation: the bathroom boot set ≈ 564 KB of room art (29 s at 50 KB/s against 48 s; the
salon's 41.85 s stays the worst case). Precache grows by about 0.56 MB. Runtime: the bathroom art loads behind the
children's card reveal through `roomArtLoader` (from the precache).

## Migration Notes

None. Save v6 already carries `house`, `rooms`, `currentRoom`. Rollback to the S-25 build: `repairCurrentRoom` sends
`bathroom` to `salon`, `mergeHouse` keeps the saved cell, `rooms.bathroom` stays (research § 6); no `deploy/README.md`
line.

## Known risks

- The phase-6 purchase run (salon 12 + kitchen 7 + children 9 + bathroom 7 purchases) is load-sensitive; a timeout is
  judged with `--last-failed --workers=1` (profile § 8), and the spec's timeout may follow kids-room's.
- A 1516 card on a 1024 tablet scales to ~808 px wide; captions at 36 px scale with it like every other card text —
  visual frames (1)-(3), (9) at 1024 judge legibility.
- A child who finished the children's room before S-31 meets the bathroom at the next start without the card that
  announces it (hangar follow-up 4, carried).
- `npm run art` depends on local tools and the local-only `designs/` pack; a missing tool ends phase 3 as BLOCKED, never a
  hand-made WebP.

## Autonomous decisions

Maintainer decisions (scope.md), D1-D8 (change.md) and the research decisions R1-R4 (research handoff §6) are kept; none
is overturned. Decided at this step (no `AskUserQuestion`; complexity MEDIUM, 0 open product questions after research,
structure decided from the artifacts: 6 phases, ≤ 1 UI component edited per phase, none added):

- **P1 — card option A (width by tile count) through a pure core helper** `roomDoneCardRect` rather than inline maths
  in `RoomDoneCard`. Rejected: option B (fixed 1516 card, data only: the base's two-tile card would look sparse and
  every accepted card changes), C (smaller tiles: "Pokój dziecięcy" no longer fits at 36 px), D (two rows: crowds
  "Dalej"); inline maths (untestable without Phaser). `[human]` row 5.7. Would change: a designer card for four rooms,
  or the visual gate finding the 1516 card cramped on the 1024 tablet (then option C with the `caption` role).
- **P2 — `ROOM_DONE_LAYOUT.card` loses `left`/`width` for `centerX`/`minWidth`/`padding`** so no stale fixed rectangle is
  left to be read by mistake. Would change: another reader of `card.left` appearing (none today: grep).
- **P3 — costs 5 + 7/9/10/12/13/15 = 71** (D3, kitchen curve, every task 5-21). `[human]` row 5.8. Would change: S-17 or
  the maintainer naming prices.
- **P4 — wording**: stage reuses `renovate`; slot tasks "Postaw …" except "Ustaw umywalkę i lustro" (a sink is set up,
  not stood), "Połóż dywanik" (salon "Połóż dywan" precedent), "Powieś półkę z zabawkami" (a wall shelf; salon "Powieś
  półkę"); "Naturalne" for the two-noun caption "umywalka i lustro" (plural agreement, as "biurko i krzesło"); the pack's
  captions over the roadmap's words (D2) — a deviation from the roadmap text, not the PRD. `[human]` row 5.9, reviewer
  row 3.7. Would change: the Polish-language read or a designer list.
- **P5 — the 'room' celebration for the house-completing bathroom** (research R4), against PRD FR-040's literal "house"
  intensity, because roadmap S-24 owns the finished-house moment. `[human]` row 5.10. Would change: the maintainer
  wanting the 'house' intensity now.
- **P6 — the frozen fixture `save-v6-children-done.json` plus a load-order mirror test** instead of an e2e save seam
  (S-25 P7). Would change: a bug in the `main.ts` load order the mirror cannot see.
- **P7 — the four-tile fit proven by a rendered pixel outside the old card** instead of a card rect in the e2e hook (a
  rect from the same helper would prove only the wiring). Would change: the pixel point being covered by another layer
  on some renderer (then add the rect to the snapshot as well).
- **P8 — kids-room #16 is flipped, not deleted:** its change-mode proof of the children's room moves to a visit, as
  kitchen-room #16 did in S-25. Would change: nothing.
- **P9 — house-cross-section follow-up 21 is closed in the phase-6 spec** (`houseButton` null while the card is up),
  where the card is shown anyway. Would change: nothing.

## References

- Research: `context/changes/bathroom-room/research.md`; identity and decisions: `context/changes/bathroom-room/change.md`; run scope: `context/runs/2026-11-01-bathroom-polish-lab/scope.md`
- Format example: `context/archive/2026-11-01-kids-room/plan.md`; one-stage room: `context/archive/2026-10-31-kitchen-room/plan.md`; last room of a building: `context/archive/2026-11-01-hangar-module/plan.md`
- Follow-ups: `context/archive/2026-11-01-kids-room/follow-ups/review-fixes.md` (1, 3, 7, 11), `context/archive/2026-10-31-house-cross-section/follow-ups/review-fixes.md` (21), `context/archive/2026-11-01-hangar-module/follow-ups/review-fixes.md` (4)
- Pack: `designs/martynka-bathroom-v1/manifest.json` (`rooms.bathroom`), `README.md`, `screenshots/{bathroom-before,bathroom-after-*,house-four-rooms}.png`
- Code: `src/ui/widgets/RoomDoneCard.ts` (`RoomDoneCard.show`), `src/data/layout.ts` (`ROOM_DONE_LAYOUT`, `HUD_LAYOUT`, `ROOM_LAYOUT.houseButton`), `src/core/guideLayout.ts` (pure layout precedent), `src/core/house.ts` (`houseRoomList`, `nextRoom`, `roomInRenovation`), `src/core/houseCells.ts`, `src/data/rooms.ts` (`KITCHEN`, `CHILDREN`, `ROOMS`), `src/data/houses.ts` (`HOUSES`), `src/data/roomArt.ts` (`ROOM_SCENE_FILES`), `src/data/pl.ts` (`room`), `scripts/make-task-art.mjs` (`ROOM_PACKS`), `src/scenes/RoomScene.ts` (`blocked`, `snapshot`), `tests/e2e/support/hook.ts` (`renderedPixel`)
- PRD: `context/foundation/prd.md` FR-033, FR-035, FR-038, FR-040; test plan `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: One rule for the room-done card rectangle

#### Automated

- [x] 1.1 New cases red before the helper exists, green after; unit `baseline + N` — 7c742b8
- [x] 1.2 Deliberate break: drop `2·padding` from the width → the n=4 case red; centre tiles on `left + minWidth/2` instead of `centerX` → the n=4 tile case red; each restored; meta-check: the expectations are literals computed by hand from today's 388/1144 card, not by the helper — 7c742b8
- [x] 1.3 `git diff --stat 6b96a9f -- src/ui src/scenes src/data src/testing tests/e2e` empty — 7c742b8
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); no e2e in this phase (no spec touched; the orchestrator runs the full suite after phase 6) — 7c742b8

### Phase 2: The card reads the rule; two- and three-tile cards unchanged

#### Automated

- [x] 2.1 `npx vitest run tests/layout.test.ts tests/roomDoneCardWiring.test.ts tests/roomDoneLayout.test.ts` green; unit `<phase-1 count> + N` — 32c2a5b
- [x] 2.2 Deliberate break: set `ROOM_DONE_LAYOUT.card.minWidth` to 1100 → the accepted-look case (n = 2, 3 give 388/1144) red; set `padding` to 60 → the n = 5 inside-`GAME_WIDTH` case red; put `card.left + card.width / 2` back in `show` → the wiring case red; each restored; meta-check: the wiring test proves the call site, the layout test proves the numbers, the visual pass (phase 5) proves the pixels — 32c2a5b
- [x] 2.3 `git diff --stat <phase-1 sha> -- src/data/rooms.ts src/data/houses.ts src/data/pl.ts src/data/roomArt.ts src/scenes src/core public tests/fixtures tests/e2e` empty (only `roomDoneLayout.ts` exists in core from phase 1; the diff names no core file) — 32c2a5b
- [x] 2.4 Full local gate green; no e2e in this phase (no spec touched; card items unchanged, the orchestrator runs the full suite after phase 6) — 32c2a5b

#### Manual

- [x] 2.5 [reviewer] `RoomDoneCard.show` reads every horizontal card coordinate from the rect (card fill and border, tile lefts, burst centre); the title and "Dalej" stay at x 960 by data — impl review (fill, stroke, `rect.tileLefts[index]`, burst at `rect.left + rect.width / 2`; title/button from `ROOM_DONE_LAYOUT`)

### Phase 3: The bathroom as data, copy and art (unreachable)

#### Automated

- [x] 3.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/bathroom/` — 69694ce
- [x] 3.2 `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N` — 69694ce
- [x] 3.3 Deliberate break: change the sink's `x` in `bathroomSlots` → the manifest literal red; delete `bathroom-rug-mint.webp` → the size/orphan cases red; drop `'bathroom-ducks'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `bathroomSlots`; whether the picture looks right is the visual pass (phase 5) — 69694ce
- [x] 3.4 `npm run build` then `grep -o "assets/rooms/bathroom/" dist/sw.js | wc -l` = 21 — 69694ce
- [x] 3.5 `git diff --stat <phase-2 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/layout.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bridge public/assets/rooms/hangar` empty — 69694ce
- [x] 3.6 Full local gate green; no e2e in this phase (no spec touched; the bathroom is unreachable) — 69694ce

#### Manual

- [x] 3.7 [reviewer] Polish-language read of the bathroom copy in `src/data/pl.ts` against the table above (profile § 2: room captions, not task content): caption nominatives, variant forms agreeing with the noun (wanna/roślina/półka → -a, umywalka i lustro → -e, regał/dywanik → -y), task labels imperative + accusative (wannę, umywalkę, roślinę, półkę), each label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [x] 3.8 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 144 of 144 room pictures precached` (SEEN at plan time in Deploy run 41313671518, job `deploy`: `ok   precache covers room pictures — 123 of 123 room pictures precached`; expected after this slice: 123 + 21 = 144) — CI run 41330660160 (Deploy after merge, ticked by the run docs PR)

### Phase 4: The bathroom joins house 1

#### Automated

- [x] 4.1 The new and flipped unit cases red before the `HOUSES` row, green after; unit `<phase-3 count> + N` — 8eab432
- [x] 4.2 Deliberate break: give the bathroom row `place: 0` → the `houseCells` case red; drop the row → roomsData and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts` — the e2e reload (phase 6) is the browser proof of the same path — 8eab432
- [x] 4.3 Single specs, each with `npx playwright test tests/e2e/<name>.spec.ts` (sandbox disabled), never the full suite: `kids-room`, `kitchen-room`, `rooms-as-data`, `room-change` green; `house-cross-section` green (unchanged, run because its cells changed meaning) — 8eab432
- [x] 4.4 `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/layout.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-3 sha>.. -- tests/fixtures/save-v6.json tests/fixtures/save-v6-bridge-done.json tests/fixtures/save-v6-kitchen-done.json` empty — 8eab432
- [x] 4.5 Full local gate green; full e2e left to the orchestrator after phase 6 — 8eab432

### Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 5.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "BATHROOM|roomDoneCardRect|save-v6-children-done|assets/rooms/bathroom" CLAUDE.md` present — a9a4ee5
- [x] 5.2 `grep -c "Trigger:" context/changes/bathroom-room/follow-ups/review-fixes.md` ≥ 6; `grep -cE "^\| 20[45] " docs/design-gaps.md` = 2 — a9a4ee5
- [x] 5.3 Seam sweep: `grep -rnE "tiles\.left|do not fit at this width|come with later slices" src tests scripts` empty; `npm run art` then `git status --short public/assets` empty — a9a4ee5
- [x] 5.4 `git diff --stat <phase-4 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty — a9a4ee5
- [x] 5.5 Full local gate green; full e2e left to the orchestrator after phase 6 — a9a4ee5

#### Manual

- [x] 5.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the salon room-done card with four tiles (salon done, kitchen next, children and bathroom locked); (2) the kitchen card with four tiles; (3) the children's room card with four tiles (three done, bathroom next); (4) the bathroom at the start after "Dalej" (before look, task "Odnów ściany i podłogę"); (5) after the stage (after look, task "Postaw wannę z zasłonką"); (6) the variant panel open on the tub (three families); (7) the room fully furnished in the natural family; (8) the same in sunny or mint via the change panel; (9) the bathroom card with four done tiles, no teaser, nothing clipped at the card edges; (10) after "Dalej" (change mode and "Dom"); (11) the house cross-section with the bathroom framed in `upper-right` mid-renovation; (12) the house cross-section with all four rooms done, no "Wkrótce"; (13) the bathroom under `?e2eArt=room` (stand-in boxes with Polish labels); (14) the base: Mostek card (two tiles) and Hangar card, unchanged against the kids-room frames; compare (5)/(7) against `designs/martynka-bathroom-v1/screenshots/bathroom-after-*.png`, (4) against `bathroom-before.png`, (12) against `house-four-rooms.png` — `reviews/visual-review.md` VISUAL: PASS (32 frames + 4 kit, `screenshots/README.md`)
- [ ] 5.7 [human] Accept the room-done card change outside room data: `roomDoneCardRect` in `src/core/roomDoneLayout.ts`, `RoomDoneCard.show` reading it and `ROOM_DONE_LAYOUT.card` holding `centerX`/`minWidth`/`padding` — the card grows to 1516 px for four tiles, two- and three-tile cards are unchanged (scope.md put the four-tile card in scope; gap 204)
- [ ] 5.8 [human] Accept the bathroom costs 5 (stage) + 7/9/10/12/13/15 = 71 stars (the kitchen curve; S-17 tunes)
- [ ] 5.9 [human] Accept the bathroom wording (gap 205): "Postaw wannę z zasłonką", "Ustaw umywalkę i lustro", "Postaw regał z ręcznikami", "Połóż dywanik", "Postaw roślinę", "Powieś półkę z zabawkami", the agreed variant forms (Naturalne for "umywalka i lustro"), and the pack's "regał z ręcznikami" / "półka z zabawkami" instead of the roadmap's "szafka" / "półka z kaczuszkami"
- [ ] 5.10 [human] Accept that finishing the bathroom (house 1 complete) still shows the ROOM celebration, not the PRD FR-040 'house' intensity — decided against the PRD's literal text because roadmap S-24 owns the finished-house moment (residents, sticker)
- [ ] 5.11 [human] On a real tablet, installed and then offline: a child who finished the children's room opens the bathroom, its pictures draw, and the four-tile card is readable
- [x] 5.12 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4212 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41313671518, job `build`, steps `Run npm test`: `Tests  4212 passed | 3 skipped (4215)` and `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds) — CI run 41330660160 (Deploy after merge, ticked by the run docs PR)

### Phase 6: The bathroom in the browser — e2e (FR-033, FR-038; #16, #2)

#### Automated

- [x] 6.1 Spec red before (deliberate breaks, each test run alone with `-g`): give the bathroom row `place: 0` → test 2 red; set a bathroom cost to 16 → test 1's balance red; make `RoomDoneCard.show` use `minWidth` for every count (a fixed 1144 card) → test 1's card-colour pixel red; show the house button while the card is up (drop it from `blocked` in `RoomScene`) → test 1 red; each restored; green after; meta-check: the pixels are read from the rendered frame, so a card covered by another layer or clipped would also fail — 883a68b
- [x] 6.2 `npx playwright test tests/e2e/bathroom-room.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `191 + 2`, total equal to `npx playwright test --list | tail -1` — 883a68b
- [x] 6.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`) — 883a68b
