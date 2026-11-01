---
date: 2026-11-01T18:28:45+01:00
researcher: Claude (autonomous run 2026-11-01-bathroom-polish-lab, /10x-research step)
git_commit: 8a667f58723a94690cd4057ad4abb5b65d39c663
branch: feat/house-1-polish
repository: Martynka-urzadza
topic: "S-32 house-1-polish: kitchen in stages and the salon on cream — save format, art pipeline, views"
tags: [research, save-format, migrations, rooms, room-art, backdrop, worn-grade, house-cross-section]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run)
---

# Research: S-32 house-1-polish

**Date**: 2026-11-01T18:28:45+01:00
**Researcher**: Claude (autonomous run, three read-only workers + local spot checks)
**Git Commit**: 8a667f58723a94690cd4057ad4abb5b65d39c663
**Branch**: feat/house-1-polish
**Repository**: Martynka-urzadza

Anchors are file + symbol (run contract: never line numbers). No lessons file exists in `context/foundation/`.

## Research Question

From `change.md` (D1–D6, § Migration, § Open follow-ups): (1) does replacing the kitchen's one `renovate` stage with
three stages at the front of `KITCHEN.tasks` need a save format step v6 → v7, which seams does that touch, which
tests pin v6, and does any alternative avoid the bump; (2) what the pack `designs/martynka-house-1-polish-v1` changes
against the shipped views — `sceneKey`/`stageFade` for three kitchen stages, the salon before/after on cream, room-done
card miniatures and house cells, the task-screen backdrop (`backdropMode`), the worn grade over the new salon
background, the boot budget and the deploy-smoke room-picture count.

## Summary

1. **A version step v6 → v7 is required and is the cheapest safe option.** `RoomState` (`src/core/types.ts`) is
   `{ tasksDone, chosen }` with no list marker in `RoomState`, `HouseState` or `SaveState`; `tasksDone` is a position
   in `RoomDef.tasks` read by `currentTask`, `stagesDone`, `sceneKey`, `roomDone`, `roomStateProblems` and others
   (`src/core/rooms.ts`). Unmigrated, a finished kitchen (`tasksDone 7`, fixture `save-v6-kitchen-done.json`) is
   no longer done against a 9-task list and reports `chosen-not-bought`; `nextRoom`/`roomInRenovation`
   (`src/core/house.ts`) would send a child already in the children's room or bathroom back to the kitchen.
   `MIGRATIONS` (`src/core/save.ts`) runs each step once per load and import, `backup-v<N>` is computed from the
   migrated-from version (no table), and a pre-v7 build reads v7 as `future` and refuses writes with `NewerSave`.
   Alternatives (per-room `listVersion`, appending stages, inferring from state) are each worse — details below.
   Recommendation: `SAVE_VERSION` 7, `MIGRATIONS[6]` = frozen module `src/core/migrations/kitchenStages.ts`
   (no `src/data` import), kitchen `tasksDone` `0 → 0`, `k ≥ 1 → k + 2`, `chosen` untouched, a missing kitchen skipped.
2. **Kitchen stages are pure data on S-25's mechanism.** `sceneKey`, `stageFade`, `stagesDone` are room-generic;
   `roomArt` (`src/data/roomArt.ts`) turns a stage task's `scene` key into `assets/rooms/<key>.webp` with no table edit.
   The only code change on the art side is the art script: `ROOM_PACKS` rows read every file from one `pack`, so the
   kitchen (stage files from the polish pack, the rest from locations-v2) needs a **per-file** source override; a
   row-level scene pack would only cover the salon.
3. **The salon swap is three files.** `salon-after-cream` = shipped after except the board; `salon-shadows-cream` ≈
   shipped shadows (1 px); `salon-before-cream` is the **salon-worn-v2** interior on cream (a different, more worn
   before). The worn grade is applied only to furniture images (never the background), so nothing is graded twice
   under WebGL; under Canvas the room's full-scene `canvasWash` also covers the new background.
4. **Budgets hold.** Trial WebP (script flags): kitchen 21 → 23 files, ≈ 0.97 MB (cap 1.55 MB per room); salon ≈ 1.18 MB.
   Boot budget: kitchen ≈ 37.2 s, salon ≈ 41.4 s against the 48 s limit. Deploy smoke room-picture count derives from
   `ROOM_ART` and moves 144 → 146 by itself.
5. **The backdrop does not go blank with a cream salon.** About 0.67 of the area around the notebook stays non-cream
   (today 1.00; kitchen 0.00), so gap 182 does not spread to the salon; no test asserts a green/board colour.

## Detailed Findings

### A. Save format: why v7, and the seams

**The chain** (`src/core/save.ts`): `SAVE_VERSION = 6`; `MIGRATIONS` is keyed by source version (1 inline `variants`,
2 `LIFT_V2_SALON`, 3 inline `generation`/`writer`, 4 `LIFT_V4_HOUSE`, 5 `LIFT_V5_BUILDING`). `decodeSave`: version
greater than `SAVE_VERSION` → `future` before any step; loop `v = from .. SAVE_VERSION-1`; a missing step →
`unknown-version`; a throwing step → `migration-failed` (`step: v`); then `saveProblem` (→ `corrupt` with `from` and
`problem`); success → `ok` with `migratedFrom` (null when current). The file header requires a version, a step and a
frozen fixture `tests/fixtures/save-v<N>.json` for every shape change. `importProblem` runs the same loop; doc
comments on `saveProblem`/`validateSave` name "v6" and need updating.

**Pattern** (`src/core/migrations/building.ts` `LIFT_V5_BUILDING`): a one-liner `{ ...raw, version: 6 }`, module
FROZEN and never importing `src/data` (`src/core/migrations/house.ts` `HOUSE_V5` follows the same rule). The only
precedent that rewrites `tasksDone` is `carryV2Salon` (`src/core/migrations/legacySalon.ts`, `MIGRATIONS[2]`, rule B by
cost, frozen tables `LEGACY_SALON_V2`/`SALON_V3_TARGET`, a runtime note `REGISTRY_KEYS.salonCarried`); `decodeSave`
special-cases `v === 2` for that note. A kitchen note would follow that precedent only if the plan wants a
"Zapis gry" line; not required.

**Step semantics to decide in the plan** (observed constraints): kitchen exists in a save only from v5 (`house`,
`MIGRATIONS[4]`), but `rooms` is a map, so the step must skip a save without `rooms.kitchen`; a v6 kitchen with
`tasksDone > 7` is already `tasks-overflow` in `roomStateProblems` — a uniform `+2` keeps it flagged the same way
(recommended over clamping, which would hide an existing report). Rule B (cost prefix) is rejected: 5 stars spent maps
to the first new stage only and regresses the walls the child already saw renewed.

**Backups** (`src/storage/idb.ts` `createIdbSaveStore.backup`, `putBackupOnce`; `readBackups` loops
`1 .. SAVE_VERSION-1`; `src/core/autosave.ts` `createAutosaver` with `balance.save.backupAttempts` 3): the key is
`${key}:backup-v${from}`, so `backup-v6` needs no code change. A v1 save lifted to v7 still makes only `backup-v1`.

**Rollback guard**: `writeVerdict` (`src/core/save.ts`, `storedVersionNewer`) + `guardedPut` (`src/storage/idb.ts`,
`page.version` = the build's `SAVE_VERSION` through `encodeSave`). A build with 6 meeting a stored 7: read `future`
→ autosaver `blockedBy 'unreadable'`, `replaceGate` blocks `future`; any write → `NewerSave` → `blockedBy 'newer'`.
Already pinned generically by `tests/saveV6.test.ts` "meets a v7 save as future" and `tests/idbStore.test.ts`
(`SAVE_VERSION + 1`). `deploy/README.md` § 6 has one "Uwaga" line per format (v3, v4, v5, v6); a v7 line in the same
wording is needed.

**Import** (`src/core/saveFile.ts`): `parseImport` sends both an envelope and a bare save through `decodeSave`, so an
exported v6 file is migrated on import; `saveSummary` uses `Math.min(state.tasksDone, def.tasks.length)` and
`roomStateProblems`, `deviceSaveView` uses `replaceGate` on the decoded state — both correct once the step exists,
no further change.

**Readers that misread an unmigrated v6 kitchen under a 9-task list** (checked set): `src/core/rooms.ts`
`currentTask`, `nextTaskCost`, `taskButtonView`, `purchase`, `stagesDone`, `sceneKey`, `stageFade`, `roomDone`,
`roomStateProblems`, `shownVariant`/`shownVariants`; `src/core/house.ts` `roomInRenovation`, `nextRoom`,
`roomsListView`; `src/core/backdrop.ts` `backdropMode`; `src/core/saveFile.ts` `saveSummary`; `src/core/variantPanel.ts`;
`RoomScene` snapshot; `HouseScene` cells via `roomDone`. Unaffected: `placement.ts` `hasPurchase` (only `> 0`);
`wornPieces`/`contactShadowPieces` (kitchen `worn: []`, `contactShadows: []`); `roomGrowth`/`formerTaskCounts`
(log only; kitchen has no `formerTaskCounts`).

**Alternatives compared**

| option | format change | rollback safety | correctness | verdict |
|---|---|---|---|---|
| (a) v7 bump, `MIGRATIONS[6]` | version only | `future`/`NewerSave` reused, `backup-v6` free | remap runs exactly once per save | **recommended** |
| (b) per-room `listVersion` field | new field in `RoomState`, `validRoom`, `copyRoom`, types | still needs a bump: `copyRoom` (used by `encodeSave`, `toSession`) drops unknown keys, so a rolled-back v6 build would write the save back without the field and the new build would shift `+2` a second time | general for future list edits | more work than (a) for one room; worth it only if several rooms will be reordered |
| (c) append stages at the end (S-16d rule) | none | n/a | clean/walls/floor would come after the furniture; `sceneKey` "last done stage" would put stage pictures over a renovated kitchen | contradicts PRD FR-033 "najpierw ściany i podłoga" and the brief |
| (d) infer old vs new from state | none | n/a | ambiguous at `tasksDone 1`, `chosen {}` (old "renovated" vs new "cleaned"); must run on every load forever | rejected |

**Tests and specs that pin `SAVE_VERSION` 6 or v6 shapes** (grep of `tests/` for `SAVE_VERSION).toBe(6)` = 7 hits, plus
helpers/expectations):
- `tests/save.test.ts`: `expect(SAVE_VERSION).toBe(6)` ×3, encode `toEqual({ … version: 6 … })` in legacy-salon tests, `v6of` helper.
- `tests/saveV6.test.ts`: "is the current version"; "lifts the v5 salon fixture…" (`version: 6`); "decodes the v6 base fixture without a migration" (`migratedFrom` null — becomes 6 at v7); "meets a v7 save as future" (must become v8).
- `tests/saveV5.test.ts`: `toBe(6)`, `v6base`, `version: 6` in encode expectations.
- `tests/saveV4.test.ts`, `tests/saveFile.test.ts`, `tests/autosave.test.ts`: `v6of` helper / `version: 6`.
- `tests/legacySalonMigration.test.ts`: `toMatchObject({ version: 6 … })`.
- `tests/fixtureLoadPath.test.ts`: `it.each` title "writes v6"; "save-v6-kitchen-done meets the children's room" and "save-v6-children-done meets the bathroom" compare the kitchen `toEqual(raw.rooms.kitchen)` (tasksDone 7) — both fail after the `+2` and must expect 9; the generic `tasksDone >= raw` check still passes.
- e2e: `tests/e2e/rooms-as-data.spec.ts` and `tests/e2e/first-building-choice.spec.ts` (`expect(SAVE_VERSION).toBe(6)`).
- Generic (survive the bump): `e2eSave.test.ts`, `idbStore.test.ts`, `saveHealth.test.ts`, specs `salon-load-health`, `save-backup-health`, `salon-art`, `save-migration`, `save-transfer-blocked`, `load-and-tab-guard`.

**Frozen fixtures** (stay inputs, never edited): `save-v1`, `save-v1-fresh`, `save-v1-legacy-salon`, `save-v2`,
`save-v2-fresh`, `save-v2-legacy-salon`, `save-v3`, `save-v4`, `save-v4-salon`, `save-v5`, `save-v5-salon`, `save-v6`,
`save-v6-bridge-done`, `save-v6-kitchen-done` (salon 12, kitchen 7), `save-v6-children-done` (kitchen 7, children 9).
The three `-done` v6 fixtures are loaded only by `tests/fixtureLoadPath.test.ts`. A new `save-v7.json` (and a v6
mid-kitchen input, e.g. kitchen `tasksDone 1`, to prove "renovated stays renovated") is the plan's to add.

**e2e seams**: `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS` builds saves from frozen fixtures `v1`, `legacy-salon`,
`v4-salon`, `v5-salon` (markers in `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`); none builds a v6 save. A browser proof of
the kitchen move needs a `v6-kitchen` seam plus marker on the `v5-salon` precedent.

**Kitchen-list tests**: `tests/rooms.test.ts` "salon, kitchen, Mostek and Hangar keep the old before/after ternary at
every tasksDone" fails once the kitchen stages carry `scene` (drop the kitchen from it, add it to the staged-room
cases). `tests/roomsData.test.ts` append-only tests ("keeps the order of the first tasks stable", "M-R4") cover only
`SALON` — nothing pins the kitchen's order, so the front insertion is not caught by an existing test; the plan should
add a kitchen order pin with the version note. e2e `kitchen-room.spec.ts`, `kids-room.spec.ts`,
`house-cross-section.spec.ts`, `bathroom-room.spec.ts` derive counts from `KITCHEN.tasks`; `house-cross-section.spec.ts`
asserts `stageDone` after the first kitchen purchase (re-check: still true, `stagesDone > 0` after the clean stage).

### B. Kitchen stages as data

- `src/core/rooms.ts` `sceneKey`: `scene.before` until the first stage is done, then the `scene` of the last done
  stage, or `scene.after` when that stage names none; `stageFade` and `stagesDone` follow the same tasks. `CHILDREN`
  (`src/data/rooms.ts`) is the template: `clean-room`/`paint-walls` carry `scene`, `renew-floor` has none.
- `src/data/roomArt.ts` `roomArt` collects distinct stage `scene` keys and builds `assets/rooms/${key}.webp`; so the
  kitchen keys must be `kitchen/kitchen-stage-1`, `kitchen/kitchen-stage-2`; `bootRoomArt` follows automatically.
- `RoomView` (`src/ui/widgets/RoomView.ts`): `renovated = stagesDone > 0`; the shadows layer shows only when not
  renovated or done, so it is hidden in the middle stages (as in the children's room today).
- Copy (`src/data/pl.ts` `pl.room.tasks`): present `renovate` „Odnów ściany i podłogę” (salon, bathroom, bridge,
  hangar), `cleanRoom` „Posprzątaj pokój”, `paintWalls` „Pomaluj ściany”, `renewFloor` „Odnów podłogę”. The pack's
  labels are „Posprzątaj kuchnię” and „Odnów ściany” — two NEW keys (e.g. `cleanKitchen`, `renewWalls`); `renewFloor`
  is reused. `renovate` stays (other rooms use it).
- Tests that change: `tests/roomArt.test.ts` "has 37 salon, 21 kitchen, …" (kitchen 23), `tests/fixtures/room-art-kitchen.json`
  (+2 entries), "weighs at most 1 550 000 bytes per room" (holds: ≈ 971 954 B).

### C. Art script (`scripts/make-task-art.mjs`)

- `ROOM_PACKS` row: `{ room, pack, scene: string[], decor: string[], furniture: string[], recolourBoard: boolean }`;
  `ROOM_JOBS` reads `<pack>/assets/room/<id>.png` (scene) and `<pack>/assets/furniture/<id>.png`, output
  `<room>/<id>.webp` — output name = source name, no rename field.
- Kitchen row: pack `LOCATIONS_V2`, scene `kitchen-before`, `kitchen-after`, `kitchen-shadows`. Children row: pack
  `EVOLUTION_V1`, stage files are plain extra `scene` entries.
- Mixing packs is not possible today. The kitchen needs a source per file; the salon needs all three scene files from
  the polish pack and furniture from `SALON_V2`. A per-file entry (e.g. `{ pack, id, as? }` alongside plain strings)
  covers both; a row-level `scenePack` covers only the salon. The pack-existence loop over `ROOM_PACKS.map(row => row.pack)`
  must also check the polish pack.
- `recolourBoard`: only the salon row is `true`, on `BOARD_FILES = ['architecture-before','architecture-after']` with
  `BOARD_COLOUR '#BCD799'`. With the cream files it becomes `false`, leaving `BOARD_COLOUR`, `BOARD_FILES` and
  `scripts/recolour-board.py` unused by any row. `tests/recolourBoard.test.ts` tests the Python script on synthetic
  images only, so it stays green whether the script is kept or retired. Left in place with `recolourBoard: true` the
  mask guard (5–30 %) would likely refuse a cream board.
- No test imports `ROOM_PACKS`; the table is covered indirectly by `tests/roomArt.test.ts` against `public/`.

### D. Salon on cream

- Pixel comparison (worker, Pillow): `salon-after-cream` = salon-v2 `architecture-after` inside the box mask
  (86.45 %), only the board (13.55 %) differs; `salon-shadows-cream` differs from `shadows.png` by 1 pixel;
  `salon-before-cream` equals `martynka-salon-worn-v2/assets/room/architecture-before.png` inside the mask (the more
  worn interior). Corners of all five new files are `#FFF5DF`; all are 1920×1080 RGBA.
- File names: texture keys `salon/before|after|shadows` (`SALON.scene`) are not tied to files; only
  `ROOM_SCENE_FILES.salon` names `architecture-before`/`architecture-after`/`shadows`. A rename would also touch
  `tests/fixtures/room-art-salon.json` (3 URLs), require deleting the old webps ("leaves no file in
  public/assets/rooms without a table entry"), and silently disarm `tests/e2e/salon-load-health.spec.ts`, which routes
  `**/assets/rooms/salon/shadows.webp` (a route that matches nothing stalls nothing and the spec could pass for the
  wrong reason). Keeping the output names (per-file `as`) avoids all three.
- Worn grade (`src/ui/wornGrade.ts` `applyWornGrade`, `src/core/colorGrade.ts` `gradeMatrix`, `ROOM_LAYOUT.worn`):
  applied only to the worn piece images in `RoomView.buildWorn` and in `drawRoomMiniature` (`piece.worn`); the
  `sceneKey` background is never graded. So a more worn before is not double-graded under WebGL; it sits under graded
  furniture (an art judgement for the visual gate). Under Canvas, `RoomView.drawWorn` adds `ROOM_LAYOUT.worn.canvasWash`
  (ivory, alpha 0.30) as a full-scene rectangle above the background, washing the worn background too (room only).
- The pack README says the before state should use salon-worn-v2's 10 `furniture-worn` layers; the game grades
  variant 0 in code (`SALON.worn`, 10 pieces). D5 (keep the code grade) stands; `[human]` row.
- Fallback thumbnail: `UI_ART` `salonAfter` (`public/assets/ui/salon-after.webp`, 480×270, from salon-v2
  thumbnails) keeps the original dark-green board; it shows only when `miniatureMode` (`src/core/artPick.ts`) finds a
  piece texture missing. The pack has no cream thumbnail — carry as a follow-up, no change in this slice.

### E. Views: room-done card, house cells, backdrop

- `RoomView`, `drawRoomMiniature`, `captureRoomMiniature` (`src/ui/widgets/roomCapture.ts`) → `HouseView.render`, the
  `RoomDoneCard` live mode (`miniaturePieces`) and `backdropMode` all use `sceneKey`, so kitchen stages appear
  mid-renovation everywhere with no code change (gap 203 "one rule for the room, the miniature, the house cell and the backdrop").
- House cell: `captureRoomMiniature` draws the whole 1920×1080 scene full-bleed into the 608×342 cell (scale
  `width / GAME_WIDTH`); `HOUSE_GEOMETRY['house-1'].cellFill` `0xfff5df` is used only by the stand-in shell and matches
  the pack's `houses.house-1` (cells and stairwell identical). The salon's tight corner crop therefore fills its cell
  more (checklist P2; D4 keeps it, `[human]` row).
- Backdrop (`src/core/backdrop.ts` `backdropMode`, `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render`): capture at
  `BACKDROP.scale` 0.25, WebGL blur, a `PAGE_BACKGROUND` (`#FFF5DF`) wash at alpha 0.6. Measured share of non-cream
  pixels outside the notebook rect (`TASK_LAYOUT.notebook`, x 180–1740, y 204–992; > 24 off cream, every 4 px):
  shipped salon before 1.00, cream salon before/after 0.67, kitchen before 0.00, children 0.99. The board margin merges
  into the page; the room interior keeps two thirds of the visible area. Gap 182 (kitchen) stays as is.
- Tests on the backdrop/house pixels: `tests/e2e/backdrop-restore.spec.ts` `isSalonPixel`/`expectSalonPixel` (centre
  pixel opaque and ≠ `PAGE_BACKGROUND`; centre is interior, holds), `salon-style.spec.ts` "#12"/"#16" (`graded` counts),
  `notebook-polish.spec.ts`, `canvas-renderer.spec.ts`, `house-cross-section.spec.ts` (`housePixel` alpha only),
  `tests/backdrop.test.ts`, `tests/backdropRestoreWiring.test.ts`, `tests/celebrationWiring.test.ts`. Repo grep for
  `BCD799` finds only `tests/recolourBoard.test.ts` and `scripts/make-task-art.mjs` (besides the script itself) — no
  test asserts a green/board colour.

### F. Budgets and deploy smoke

- Trial `cwebp` with the script's flags: kitchen-stage-1 87 604 B, kitchen-stage-2 86 592 B; salon-before-cream
  75 794 B (was 95 834), salon-after-cream 70 842 B (was 71 922), salon-shadows-cream 68 792 B (was 68 810). Room totals:
  kitchen 797 758 B / 21 files → ≈ 971 954 B / 23; salon 1 203 384 B → ≈ 1 182 246 B.
- `tests/bootBudget.test.ts` sums on-disk sizes in `public/` (the `npm run art` output must be committed) of
  `TASK_ART` + `bootRoomArt(room)` + `UI_ART` + font + the larger format of each boot sound, per room in `ROOMS`, at
  50 KB/s, against (`balance.loader.totalMs` 50 000 − `HEADROOM_MS` 2 000) = 48 s. Now: salon 41.85 s, kitchen 33.74 s;
  after: kitchen ≈ 37.2 s, salon ≈ 41.4 s. The byte figures in the comment on `balance.loader` (`src/data/balance.ts`)
  go stale and should be refreshed.
- Deploy smoke: `scripts/check-deploy.ts` calls `precacheCovers('room pictures', precache, ROOM_ART.map(a => a.url))`
  (`scripts/deploy-check/parse.ts`); `roomArtCheck` is used only by `tests/deployCheck.test.ts`. The count derives from
  `ROOM_ART`: 144 → 146 (two kitchen stages; the salon swap keeps its count).

## Code References

- `src/core/save.ts` — `SAVE_VERSION`, `MIGRATIONS`, `decodeSave`, `importProblem`, `saveProblem`, `writeVerdict`, `storedVersionNewer`
- `src/core/migrations/building.ts` — `LIFT_V5_BUILDING` (frozen-step pattern); `src/core/migrations/legacySalon.ts` `carryV2Salon` (tasksDone rewrite precedent)
- `src/storage/idb.ts` — `guardedPut`, `createIdbSaveStore.backup`, `putBackupOnce`, `readBackups`
- `src/core/saveFile.ts` — `parseImport`, `saveSummary`, `deviceSaveView`
- `src/core/rooms.ts` — `currentTask`, `stagesDone`, `sceneKey`, `stageFade`, `roomDone`, `roomStateProblems`, `wornPieces`, `contactShadowPieces`, `roomGrowth`
- `src/core/house.ts` — `roomInRenovation`, `nextRoom`, `roomsListView`
- `src/data/rooms.ts` — `KITCHEN`, `CHILDREN`, `SALON.worn`; `src/data/roomArt.ts` — `ROOM_SCENE_FILES`, `roomArt`, `bootRoomArt`
- `scripts/make-task-art.mjs` — `ROOM_PACKS`, `ROOM_JOBS`, `BOARD_FILES`, `BOARD_COLOUR`
- `src/core/backdrop.ts` `backdropMode`; `src/ui/widgets/SalonBackdrop.ts`; `src/ui/widgets/roomCapture.ts` `captureRoomMiniature`; `src/ui/widgets/HouseView.ts`; `src/ui/wornGrade.ts` `applyWornGrade`
- `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`
- `tests/bootBudget.test.ts`, `tests/roomArt.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/rooms.test.ts`, `tests/saveV6.test.ts`
- `deploy/README.md` § 6 rollback "Uwaga" lines

## Architecture Insights

- Room progress is a position count; any edit other than appending to a room's task list is a save-format change
  (the comment on `KITCHEN.tasks` states the rule; only `SALON` has append-only tests).
- Migration modules are frozen and data-free; the kitchen step must carry its own constant (room id `kitchen`, shift 2).
- Background art for rooms is one rule (`sceneKey`) for room, miniature, house cell and backdrop — S-32 needs no new mechanism.
- The art script is one-pack-per-row; S-32 is the first row mixing packs.

## Historical Context (from prior changes)

- `context/archive/2026-11-01-kids-room/` — `sceneKey`/`stageFade` introduced for staged rooms; follow-up 2 (`wornPieces`/`contactShadowPieces` "until the first stage") Trigger: S-32 — fires but is a no-op for the kitchen (both lists empty); re-record with a narrower trigger. Bathroom-room 11 is the same item.
- `context/archive/2026-10-31-kitchen-room/` follow-up 19 and `2026-10-31-house-cross-section` 12 (gap 182) — Trigger: the salon re-export on cream; measured above: the salon backdrop does not go blank; kitchen gap stays.
- `context/archive/2026-10-15-final-art-salon/` and `2026-10-24-salon-style/` — in-between backgrounds (gap 109) Trigger: author delivers them; fires for the kitchen.
- `2026-10-15-salon-load-health` M-6 / `rooms-as-data` — "next change to the room art set" (deploy smoke / SW install warning) and bathroom #10 "next change to the precache set" — fire because files are added.
- `2026-10-25-audit-art-renderer` — Python without `-I` in the art script and the recolour pins — fire because the script changes.
- `2026-10-24-audit-backdrop-fox` F6 (`isSalonPixel`), `house-cross-section` #9 / bathroom #8 (`drawRoomMiniature`) — fire only if those files are edited (not planned).
- `2026-10-15-final-art-salon` "future slots appended at the end" — answered by the version step; re-record with the exception.

## Related Research

- `context/archive/2026-11-01-kids-room/research.md` (staged rooms), `context/archive/2026-10-31-first-building-choice/` (v5 → v6 pattern), `context/archive/2026-10-15-salon-load-health/` (v3 step and rule B).

## PRD anchors

- `context/foundation/prd.md` FR-033 „każdy pokój działa jak salon: najpierw ściany i podłoga, potem elementy … Ściany i podłoga mogą być dwoma osobnymi wyborami” — supports stages at the front.
- FR-021 „Stare zapisy przeżywają aktualizacje gry … nieudane przeniesienie zostawia stary zapis nietknięty”, FR-035 „nic, co dziecko urządziło, nie znika”, and the success line „Postęp nigdy nie ginie” — require the migration.
- FR-038 (house miniatures „urządzona tak, jak dziecko go zostawiło”) — served by `sceneKey`.
- Cream background: the PRD is silent (only Open Question 13 names the brief P3); the pack and `PAGE_BACKGROUND` are the source.

## Open Questions

1. Salon output file names: keep `architecture-before`/`architecture-after`/`shadows` (recommended, per-file `as`) or rename to the cream names (then fix `room-art-salon.json`, delete old webps, retarget `salon-load-health.spec.ts`). Plan decides.
2. Retire `scripts/recolour-board.py` + `tests/recolourBoard.test.ts` + `BOARD_*` or keep them unused. Recommendation: keep the script and its test this slice (no row uses it), record a follow-up; retiring is a separate cleanup.
3. Kitchen stage costs (D3 5/6/7) — plan; a migrated child gets the two new stages without paying (she already paid for the result).
4. A runtime "Zapis gry" note for the kitchen move (like `salonCarried`) — optional; recommend none (the move is lossless and invisible).
5. Visual-gate judgement: worn-v2 before under the code-graded furniture (D5), salon cell fill (D4), Canvas wash over the new before.
