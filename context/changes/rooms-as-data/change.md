---
change_id: rooms-as-data
title: Rooms and the house as game data, save format v5 carrying the house
status: preparing
created: 2026-10-30
updated: 2026-10-30
archived_at: null
---

## Notes

Roadmap slice F-04 (milestone M-03 `ulica-i-domy`), first slice of run 2026-10-30-rooms-kitchen (base `main` at
`9d28753`, branch `feat/rooms-as-data`). Outcome (roadmap): a room can be added with data and art only. Everything
written today for the salon (shadows, worn look, slot manifest, migration tables, the "Pokój gotowy!" card) becomes
room data; the save carries a house with its list of rooms and each room's place in a floor x place grid; the child's
salon moves into the first house without loss, proven by a frozen sample of the old save. PRD refs: FR-032 (nothing
from the salon is lost), FR-033 (a room works like the salon, from data; one room in renovation at a time), FR-038
(floors are house data, a floor x place grid), PRD Open Question 14 (salon assumptions in the code: this slice answers
it). Unlocks S-22 (kitchen), S-25 (kids' room), S-23 (the floor grid in the save).

The measure of this foundation is the kitchen in S-22, not a new architecture (roadmap risk): F-04 must not grow into a
rewrite of the room scene. S-22 adds the kitchen's data, art and the celebration; F-04 makes that addition need no
code outside `src/data/`, the art script table and assets.

## Roadmap claims re-verified against the repo (branch `feat/rooms-as-data` at `9d28753`)

| roadmap claim (F-04, plan time) | repo now | correction |
|---|---|---|
| Contact shadows are written for the salon | `RoomDef.contactShadows` (`src/core/types.ts`) is room data since change salon-style; `SALON.contactShadows` in `src/data/rooms.ts`; `contactShadowPieces` in `src/core/rooms.ts` reads any room. Numbers like the shadow alpha sit in the shared `ROOM_LAYOUT` | already data per room. The kitchen pack carries its own `shadowEllipses` in the manifest (S-22 maps them into `contactShadows`). Nothing to move in F-04 beyond checking that no salon id is assumed |
| The worn look (variant 0 graded) is written for the salon | `RoomDef.worn` is room data (`SALON.worn`); `wornPieces` (`src/core/rooms.ts`) and `applyWornGrade` (`src/ui/wornGrade.ts`) are generic; grade numbers are one global `ROOM_LAYOUT.worn` | already data. Open for research: a room with no worn list (`worn: []`, the kitchen pack has no worn furniture, only a before background) must render a sane before state; the grade numbers may stay global (one house style) |
| The slot manifest is salon-only | Slots, decor, tasks, geometry are data in `src/data/rooms.ts` (`SALON`). But `src/data/roomArt.ts` builds `ROOM_ART = SALON_ART` from `SALON` alone and hard-codes `assets/rooms/salon/`; `scripts/make-task-art.mjs` hard-codes the `designs/martynka-salon-v2` pack and the `salon/` output folder; `ROOMS = { salon }`, `FIRST_ROOM = 'salon'` | real gap: the art table and the art script must be derived from a list of rooms (pack, folder, files per room), so S-22 adds a row, not code |
| The migration tables are salon-only | `src/core/migrations/legacySalon.ts` (`LEGACY_SALON_V2`, `SALON_V3_TARGET`) are FROZEN history tables of the v2 -> v3 step | correction: they stay as they are (frozen by design, a migration step never reads live data). The salon-specific v5 work is the new v4 -> v5 step, not these tables |
| The "Pokój gotowy!" card is salon-only | `RoomDoneCard` captions every room tile with the single string `pl.room.name` ("Salon"), falls back to the one thumbnail `UI_ART_KEYS.salonAfter` for any room (`miniatureMode`), the list comes from `ROOM_ORDER` = salon + one teaser `unlockAfter: 'salon'`; `roomsListView` is generic | real gap: room name and thumbnail per room (follow-up G-3, health-lines-and-smoke), the room list from the house data instead of `ROOM_ORDER`. The celebration with an intensity parameter (FR-040) is S-22 (roadmap S-22 outcome), see decision D3 |
| The save must learn to carry a house and its rooms | `SessionSave`/`SaveState` v4 (`src/core/save.ts`) already hold `rooms: Record<string, RoomState>` and `currentRoom`; `validateSave` accepts any room ids; `repairCurrentRoom`, `roomStateProblems`, `roomGrowth` (`src/core/rooms.ts`) and `saveSummary` (`src/core/saveFile.ts`) iterate a catalogue | partial correction: the save is already multi-room; v5 adds the HOUSE and the floor x place grid (scope), not the room map. Nothing moves the child to the next room when a room is done (`currentRoom` never changes at runtime): FR-033 "one room in renovation" needs a pure rule (next room from the house order) |
| The salon passes to the first house without loss, with a frozen sample of the old save | Frozen fixtures `tests/fixtures/save-v1*.json` .. `save-v4.json`; `save-v4.json` holds a room `living` (an unknown room id), NOT the salon; no v4 fixture holds a salon with the stage, bought slots and variants | correction: a new frozen fixture `tests/fixtures/save-v4-salon.json` (stage done, several slots with non-zero variants, stars) is needed; `save-v4.json` stays frozen and must still load (its unknown room is kept as today) |
| (implicit) Backup of the old save | `src/storage/idb.ts` writes `${key}:backup-v${from}` write-once (`putBackupOnce`), generic in `from`; `readBackups` covers `backup-v1..v{SAVE_VERSION-1}` | `backup-v4` follows from `SAVE_VERSION` 5 with no new mechanism; tests must prove it (scope) |
| "Dziś blisko granicy" boot budget (S-22 risk) | measured now: boot payload 1 977 856 B = 39.6 s at 50 KB/s vs limit 48 s (`balance.loader.totalMs` 50 000 - 2 000 headroom), headroom about 8.4 s / 420 KB; room art 37 files, 1 203 384 B; the kitchen PNGs in `designs/martynka-locations-v2` total 6.6 MB | correction for S-22: headroom grew after salon-style dropped `furnishings-before`; the kitchen WebP is still likely to come close, so S-22 measures it (scope). F-04 adds no art |
| Kitchen pack: before/after, 6 slots with manifest, 3 variants | `designs/martynka-locations-v2/manifest.json` `rooms.kitchen`: `backgroundBefore`, `backgroundAfter`, `shadows`, 6 slots (`kitchen-counter`, `kitchen-fridge`, `kitchen-table`, `kitchen-coffee`, `kitchen-bench`, `kitchen-rack`) x 3 variants (families natural/sunny/mint), `shadowEllipses`, `maths`; no decor, no worn pieces | confirmed. Slot ids are prefixed `kitchen-`, so the flat `pl.room.slots`/`variants` keys do not collide with the salon's. The F-04 contract must fit this shape (no decor, no worn list) |
| Other salon assumptions (OQ 14) | `SalonBackdrop` (name only; it renders `currentRoom`, falls back to `FIRST_ROOM`); `pl.settings.roomMismatch` / `pl.saveTransfer.roomMismatch` say "Stan salonu"; `pl.settings.salonCarried` (v2 -> v3 note, still correct); `UI_ART.salonAfter`; `MINIGAME_WORDS` (salon captions, a fixed word list, harmless); `pl.room.tasks` keyed by flat label; no salon slot id outside `src/data/rooms.ts`, `src/data/pl.ts` and the frozen migration tables | research lists each and decides data vs leave; "Stan salonu" lines become room-neutral or name the room (copy change, teacher read) |
| Lessons file | `context/foundation/lessons.md` does not exist | none applied |

## Design kit views and spec sections this change binds (profile § 6)

- No new screen. F-04 is a foundation slice; the child sees the same salon flow. The house cross-section (S-23) and the
  kitchen and celebration (S-22) are later slices. `designs/martynka-house-street-v1/` belongs to the separate S-23
  designer order and is NOT read for layout here (scope.md).
- Views touched only if the plan changes them: the "Pokój gotowy!" card (`src/ui/widgets/RoomDoneCard.ts`; the kit has
  no such view: DESIGN-GAP rows 37-41 in `docs/design-gaps.md`) for a per-room name and thumbnail.
- Room composition rules: the art packs' manifests (`designs/martynka-salon-v2/manifest.json`,
  `designs/martynka-locations-v2/manifest.json`: `scene`, `slots` with `x, y, width, height, z, anchor, visibleRect`,
  families, `shadowEllipses`) and `docs/designer-brief-m03.md` "Układ domów" (house 1: ground floor salon left, kitchen
  right; first floor kids' room left, a closed cell right). The grid shape in data follows that table; no grid art.
- Spec: `Martynka-urzadza.md` section 5 (data model, save format) and section 14 (working rules: no player text or
  balance numbers in scenes); PRD FR-032, FR-033, FR-038; `context/foundation/test-plan.md` save-format risks.
- Copy keys this slice binds (source `src/data/pl.ts`): `pl.room.name` (single "Salon" today; becomes per room: the
  pack's manifest `label` is the source, e.g. "Kuchnia"), `pl.room.done` (unchanged), `pl.settings.roomMismatch` and
  `pl.saveTransfer.roomMismatch` ("Stan salonu ..."), `pl.saveTransfer.room`, `pl.settings.salonCarried`
  (unchanged, v2 -> v3 only). Any new parent line about the v4 -> v5 move: the kit has none -> DESIGN-GAP row, never
  invented beyond the existing generic migration line.
- DESIGN-GAP candidates (rows go to `docs/design-gaps.md`, next number 175): per-room thumbnail on the room list when the
  pack thumbnail is missing; room-neutral wording of the mismatch lines.

## Migration

Expected: save format v4 -> v5 (`SAVE_VERSION` 5, `MIGRATIONS[4]`), fixed by the maintainer (scope.md). v5 = v4 plus
the HOUSE: a house with its list of rooms and each room's place in a floor x place grid (FR-038). The child's salon
(every bought slot, variant, the stage task) and the stars move into the first house unchanged; rooms unknown to the
build (e.g. `living` in `save-v4.json`) are kept as today. Frozen fixtures v1-v4 stay byte-identical and must still load
through the whole chain; a new frozen `tests/fixtures/save-v4-salon.json` proves the salon's move and a v5 fixture is
added beside them. The raw v4 save is copied to `profile:default:backup-v4` under the write-once policy of
`backup-v1..v3` (`putBackupOnce`, `backup-status` record). A pre-v5 build meets a v5 save as `future` and never
overwrites it (rollback risk: a `[human]` row and a `deploy/README.md` docs note, as at v3/v4). Profile § 4: no
database; the migration is code in `src/core/save.ts` with unit tests (test-plan rollout phase 4).

## Open follow-ups triggered by this slice

| follow-up (source) | trigger | take |
|---|---|---|
| G-3 per-room thumbnail `RoomDef.thumbnailKey` (health-lines-and-smoke § 3) | a second room in `src/data/rooms.ts` | **in scope** as data: a per-room thumbnail field (optional) and per-room name, so S-22 adds rows only. The trigger itself fires in S-22 |
| `salon-before` thumbnail not converted (final-art-p2) / salon thumbnail and loading background show curtains (salon-style § 1) | a room list with not-done rooms shows the thumbnail | not fired in F-04 (the list still shows only the salon and a teaser); fires in S-22 when the kitchen tile is not done. Re-record for S-22 |
| Texture atlas (final-art-salon, final-art-p2, salon-extra-slots, salon-style § 35) | precache over budget, a second room, a slow-start report | not fired (F-04 adds no art; headroom about 8.4 s now). S-22 measures the kitchen with `tests/bootBudget.test.ts` (scope); atlas only if that fails |
| One `Box` helper, one stand-in drawer F5/F7, overlapping stand-in labels VO2 (final-art-salon, salon-extra-slots, salon-style § 29) | a second room or the next refactor of the room widgets / next change to `RoomView.render` | fires only if F-04 edits `RoomView.render`; plan keeps `RoomView` edits to room lookup. Fold the stand-in drawer only if the edit already touches it; else re-record for S-22 |
| Plan review F3 / audit M-R5: throw when the room panel is open and the placeholder is missing (save-observability-c1-c2) | the second room in `src/data/rooms.ts` or the next change to `RoomScene` redraw/celebrate | not fired by F-04 unless redraw/celebrate change; fires in S-22 (celebration). Re-record for S-22 |
| L-R8 `stepPanel` refusals, L-R11 `celebrate`/`onSleep` (save-observability, salon-extra-slots, salon-style § 31) | the next change to `RoomScene` | fires if F-04 edits `RoomScene` (room id from the house). L-R11 `onSleep` was folded in salon-style; L-R8 out of scope (no purchase change), re-record |
| Wake/sleep follow-up (notebook-polish) | the next change to the `RoomScene` wake and sleep handling | fires only if wake/sleep change; F-04 should not need it |
| GRD-09 drawing beside a mistake example (child-flow-guards) and S13-06 (minigame-daily-puzzle, drawn-grid) | the next save-format change (v5) / S-17 | fires, **out of scope**: scope.md fixes v5 to the house and grid only; adding a learner field widens the migration. Re-record with trigger "the next save-format change (v6) or a parent asking" |
| SV2-13 one bad `variants` field rejects the whole save (save-truth § 6) | the next save-format change (v5) | fires, **out of scope** (v5 does not touch `variants`); re-record with trigger v6 |
| E2E on two real builds (stale-tab-and-health, save-truth § 15) | the save format v5 | fires, **out of scope** for the run (needs a second server build). The v5 rollback path (`future`, never overwritten) is proven with the existing seams plus unit tests; re-record with trigger v6 or a cross-build report, plus a `[human]` row |
| P-8 keep the first `backup-v3` (stale-tab-and-health) | the next save-format change (v5) | closed by history: save-truth made every `backup-v<N>` write-once; `backup-v4` inherits it. Record as closed |
| Earlier stale signal (stale-tab-and-health) | the next save-format change | closed by history: save-truth added `BroadcastChannel` + `channelVerdict`. Record as closed |
| Copy-after-write window of the first copy (save-truth § 23) | the next change to `attempt` | not fired unless the plan edits `attempt` (expected not: `backup-v4` reuses it) |
| `ghostTweens` kept until sleep (salon-style F4) | a second stage task in a room or the next change to `fadeStage` | not fired in F-04 (one stage per room stays); S-22 kitchen has its own single stage, still one per room |
| M-6 second half, service-worker install warn (salon-load-health, salon-style § 32) | the next change to the room art set | not fired if F-04 only re-derives `ROOM_ART` with the same 37 entries; fires in S-22 |
| v4-era save triggers (salon-load-health: two builds, two tabs, migration line; load-and-tab-guard P-8) | the v4 save format | already passed at v4 and re-recorded or closed by stale-tab-and-health and save-truth; nothing left for v5 beyond the rows above |

## Autonomous decisions

- **D0 Scope (fixed by the maintainer, scope.md).** Save format v5 carries the house and the floor grid; the salon moves
  into the first house without loss; frozen v4 fixture; `backup-v4` write-once; kitchen from
  `designs/martynka-locations-v2` (S-22); one parameterised celebration (FR-040); one room in renovation at a time; no
  balance change except the kitchen's own costs (S-22); boot budget measured in S-22, never raised silently. Recorded
  as fixed. Would change: a new maintainer instruction.
- **D1 Street and district are not in v5 (default of scope.md).** Chosen: house only. Rejected: a `street`/`district`
  field now. Why: no code of this run reads it (S-26/S-27 are blocked/proposed), a field nobody reads is untested
  weight. Would change: `/10x-research` finding a field this run's code must read; research confirms or overturns.
- **D2 What F-04 builds versus S-22.** Chosen: F-04 builds the data contract (house with a floor x place grid, room list,
  per-room name and thumbnail, art table and art script driven by a room list), the pure rule "the room in renovation
  is the first not-done room in the house order" with tests on a synthetic second room, the v4 -> v5 migration, and
  keeps the child's visible flow unchanged (one real room). S-22 adds the kitchen rows, its art, the move to it after
  "Pokój gotowy!" in the scene, and the celebration. Rejected: adding the kitchen in F-04 (that is S-22's outcome and
  its boot-budget risk). Why: roadmap F-04 is a foundation ("its measure is the kitchen in S-22"). Would change:
  research showing the runtime move between rooms cannot be tested without a real second room in `src/data/`.
- **D3 Celebration intensity lives in S-22.** Chosen: F-04 does not rebuild the "Pokój gotowy!" card into the
  parameterised celebration; it only makes its per-room inputs data. Rejected: doing FR-040 here. Why: the roadmap
  places the celebration in S-22's outcome and unknowns; scope.md fixes the mechanism, not the slice. Would change:
  research showing the card's room list cannot read house data without the rewrite.
- **D4 Next step is `/10x-research`, not `/10x-plan`.** The skill defaults to `/10x-plan`; the step prompt fixes
  `/10x-research rooms-as-data` (roadmap: the v5 street question and OQ 14 are settled in research). Would change:
  nothing in this run.
- **D5 Change title.** No intent text was given; the title is written from the roadmap outcome rather than the bare
  slug. Would change: nothing.
