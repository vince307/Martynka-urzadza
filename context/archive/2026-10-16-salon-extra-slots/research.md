---
date: 2026-10-16T07:18:56+0200
researcher: Claude (autonomous run 2026-10-15-fix-s16bcd, /10x-research step)
git_commit: 429fd96e5f6710d227ec20625ef1db416822c673
branch: feat/salon-extra-slots
repository: Martynka-urzadza
topic: "S-16d salon-extra-slots: five appended salon slots, decoration until bought, curtain-less architecture"
tags: [research, rooms, RoomView, roomHit, variantPanel, roomArt, make-task-art, legacySalon, e2e]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-16d `salon-extra-slots`

**Date**: 2026-10-16T07:18:56+0200 · **Git Commit**: `429fd96` · **Branch**: `feat/salon-extra-slots` · **Repository**: Martynka-urzadza

Anchors are `file` + `SYMBOL` (run contract: symbols, never line numbers). Sources read in full: `src/data/rooms.ts`,
`src/data/roomArt.ts`, `src/core/roomHit.ts`, `src/core/rooms.ts`, `src/core/variantPanel.ts`, `src/ui/widgets/RoomView.ts`,
`src/core/migrations/legacySalon.ts`, `scripts/make-task-art.mjs`, `src/data/minigames.ts`; the room-relevant parts of
`src/scenes/RoomScene.ts`, `src/ui/widgets/RoomDoneCard.ts`, `src/core/artPick.ts`, `src/core/save.ts` (`MIGRATIONS`),
`src/data/pl.ts` (`pl.room`, `roomText`), `src/data/layout.ts` (`ROOM_LAYOUT`, `HUD_LAYOUT`), `src/data/balance.ts`
(`loader`, `round`, `roomHit`), `scripts/check-deploy.ts`, the room unit tests and the e2e specs listed below. The pack
`designs/martynka-salon-v2` (read-only): `manifest.json` (`slots`, `layers`, `scene`, `curtainEdit`, `thumbnails`), `README.md`,
`assets/room/*`, `assets/thumbnails/salon-after.png`, `screenshots/salon-before.png`. No lessons file exists in `context/foundation/`.

## Research Question

From `change.md` and the step prompt: the data model for "decoration until bought"; the curtains slot above the scene
(y −70); the curtain-less architecture swap and the art script; depth of the five new slots; live-save behaviour of a
completed v3 salon; `curtains` as an old v2 key; the miniature; `MINIGAME_WORDS`; every test/spec that assumes 7 tasks,
71 stars or 26 room files; the deploy smoke (M-6); the measured WebP weight.

## Summary

1. **The change is data + one new rule.** Three of the five slots (`lamp-table`, `plant-left`, `pouf`) are today's
   `SALON.decor` layers with the same geometry and the same texture keys (pack: variant 0 of each is the old picture,
   byte-identical to expansion-v1); `curtains` and `wall-shelf` are new. The only new concept is "a slot that shows its
   variant 0 from the renovation stage on until it is bought". Recommended: an optional field on `SlotDef` (e.g.
   `shownBeforePurchase: 0`, name for the plan) plus ONE pure helper in `src/core/rooms.ts` (e.g. `shownVariant(room, state,
   slot)`) used by both `RoomView.render` and `miniaturePieces`. `slotAt`/`holdPoint`/`stepPanel` stay keyed on `chosen`,
   so an unbought lamp is not holdable and cannot be "changed" for free (change.md decision 4 holds; no code path needs to
   change for it).
2. **Two existing invariants conflict with the author's data and must be changed on purpose**:
   `tests/roomsData.test.ts` "costs … that never fall" (last cost today is 15, so any appended 8–14 fails) and "draws every
   piece inside the scene" (`p.y + t >= 0`; curtains give −54). Plus `tests/roomArt.test.ts` "has 26 entries" (→ 38) and
   "weighs at most 1 400 000 bytes" (measured new total 1 489 688 B).
3. **Curtains above the scene** work in drawing and hit testing as is (pointer y is never negative; the box is inclusive),
   but `holdPoint` scans from `slotBox(slot).top` = −54 and can return an off-canvas point for the e2e hook. Clip the scan
   (or `slotBox` for hold purposes) to the scene.
4. **Depth**: new z values 3, 18, 25, 26, 60 are distinct from the rest (5, 10, 20, 30, 35, 40, 50). `ROOM_LAYOUT.depth.shadows`
   is 4, so curtains (z 3) would sit UNDER the shadows picture, against the pack's draw order (shadows before every slot).
   Recommend `depth.shadows` 2. The HUD (star counter x 1622+, speaker x 1494+) is a separate scene and far from the curtains.
5. **Saves**: no format change (v3). A completed v3 salon (`tasksDone` 7) has `tasks[7]` as its next task; `roomDone` is false
   until 12; the done card, the shadows, the mode button "Zmień wygląd" and the unlocked teaser all follow `roomDone` and
   disappear until the 12th purchase. `curtains` in `OLD_ONLY_KEYS` is only read by `LIFT_V2_SALON`, which `decodeSave` runs
   only for `version < 3`; the lifted v2 salon drops it (existing test input already carries `curtains`).
6. **Art**: all 22 furniture PNGs of expansion-v1 and `furnishings-before`/`shadows` are byte-identical in salon-v2, and
   `cwebp` output is deterministic, so switching `ROOM_JOBS` to `SALON_V2` changes only the two architecture files and adds
   12 files. Measured with the `npm run art` settings: +261 428 B new, −4 982 B on the architecture pair, net +256 446 B.
   This pushes the boot queue to about 2 329 739 B ≈ 46.6 s at 50 KB/s, over `balance.loader.totalMs` 45 000.
7. **E2E**: the buy-everything loops are data-driven (`SALON.tasks`) and grow to 12 purchases by themselves; only
   `tests/e2e/salon-art.spec.ts` hard-codes `health.total` 26. No spec asserts 71.

## Detailed Findings

### A. Data model for "decoration until bought"

- Today: `src/data/rooms.ts` `decor` (4 `LayerDef`: lamp-table z 25, plant-left z 26, plant-right z 35, pouf z 60) is drawn
  by `RoomView.render` when `stagesDone(room, state) > 0`, and by `miniaturePieces` under the same condition; a slot is
  drawn only when `chosen[slot.id]` (or the panel preview) is set.
- Pack manifest `slots.lamp-table|plant-left|pouf`: same x/y/size/z/anchor/visibleRect as today's decor; `variants[0]`
  is the old file (`reused: true`); `layers` keeps `plant-right` only; README: "Nie rysuj starych lamp-table, plant-left lub
  pouf z layers drugi raz".
- Texture keys stay the same (`salon/lamp-table`, `salon/plant-left`, `salon/pouf` become `variants[0]`), so a session
  that already has those textures needs no new key for the default look; `SALON_ART` gains 12 keys.
- Recommended model (choice for the plan):
  - `SlotDef` optional field marking variant 0 as the pre-purchase look (only on the three moved slots). Rejected
    alternative: keeping a `LayerDef` per moved slot with an "until bought" link — duplicates geometry and needs a
    second texture entry.
  - A pure core helper (in `src/core/rooms.ts`, tested in vitest) that returns the variant to draw: `chosen` if set,
    else the pre-purchase variant when the stage is done, else none. `RoomView.render` and `miniaturePieces` both call it,
    so the room and the miniature cannot drift (the existing comment of `miniaturePieces` promises "the same layers as
    `RoomView.render`").
  - Panel preview: `RoomView.render` writes `chosen[preview.slot] = preview.variant` before drawing, so a preview replaces
    the default look and "Zamknij" brings it back without new code.
  - Stand-in caption for a default-look slot: the slot caption + variant name, as for a bought slot (today decor uses
    `roomText.decor`); `pl.room.decor` keeps only `plant-right`.
- `roomHit.slotAt` / `holdPoint` skip slots with `chosen[slot.id] === undefined` → an unbought lamp is not hit; a touch on
  it falls to the piece below if bought (cabinet z 20 under lamp z 25), exactly as the decor lamp behaves today.
  `variantPanel.stepPanel` `change` refuses a slot without `chosen` → no free change of an unbought piece.
- `RoomScene.alphaAt` reads the texture of `chosen[slotId]` only → unchanged.
- `roomDone` = `tasksDone >= tasks.length`: becomes 12; no other consumer counts tasks except `saveSummary`
  (`src/core/saveFile.ts`, "Salon: 7 z 12" for an old done salon — correct text).

### B. Labels, captions, costs

- Labels: `pl.room.tasks` (imperative + accusative). Proposed: curtains "Powieś zasłony", wall-shelf "Powieś półkę"
  (a wall shelf is hung; "Postaw półkę" from the prompt fits a standing shelf, not this one), lamp "Wymień lampę",
  plant-left "Wymień roślinę", pouf "Wymień pufę". Lengths ≤ 14 characters, shorter than "Odnów ściany i podłogę".
- Captions (`pl.room.slots`, nominative): zasłony, półka, lampa, roślina, pufa. Variant names from the manifest:
  curtains Listkowe/Lniane/Botaniczne; wall-shelf Dębowa/Miętowa/Z łukiem; lamp-table Klasyczna/Wiklinowa/Kwiatowa;
  plant-left Monstera/Paproć/Fikus; pouf Pikowana/Pleciona/Na nóżkach (all distinct per slot, no `-`/`/`, so
  `tests/roomArt.test.ts` "labels every stand-in in Polish" passes).
- "Wymień …" with variant 0 offered: variant 0 is the look already shown, so the child can pay for "no change". Not a bug
  by the author's rule; noted for S-17.
- Costs: today 5, 7, 9, 10, 12, 13, 15 (sum 71). `tests/roomsData.test.ts` "has one furniture task per slot, whole costs of
  5-15 stars that never fall" requires non-decreasing costs (a S-09 plan choice, `context/archive/2026-10-13-first-furniture-purchase/plan.md`,
  not an author rule; FR-016 and `Martynka-urzadza.md` only say 5–15). Options:
  - (a) a new ramp 8, 10, 12, 13, 15 = 58 → salon total 129; needs the "never fall" assertion changed (e.g. non-decreasing
    within each appended block, or dropped);
  - (b) all 15 = 75 → total 146; keeps the assertion, flat pacing.
  Pacing: a round pays 5 stars + 2 for a clean round (`balance.round`), so ≈ 5–7 per round: 71 ≈ 10–14 rounds today;
  (a) adds ≈ 8–12 rounds, (b) ≈ 11–15. Recommendation: (a), it reads the author's "8–15" literally as a ramp in the stated
  order; S-17 tunes.

### C. Curtains above the scene (y −70)

- Geometry: x 232, y −70, 590×695, z 3, visibleRect [16,16,558,663] → box x 248–806, y −54–609. Manifest
  `curtainEdit.note`: "Top of right curtain intentionally extends above scene"; README: never crop the PNG canvas.
- Drawing: `RoomLayer` places by x/y; Phaser clips at the canvas, nothing else needed. `RoomView.highlight` would draw the
  hold outline partly off-canvas (harmless; VO3 already out).
- Hit test: `slotAt` is inclusive and only asked with pointer coordinates ≥ 0 (`RoomScene.holdZone` covers
  `ROOM_LAYOUT.scene` 0..1920×0..1080). Overlaps: plant-left (x 86–344, z 26), cabinet (309–789, z 20), wall-shelf
  (371–779 × 193–403, z 18), lamp (785–992, z 25) all win over curtains (z 3) where opaque; the top band y 0–~190 is curtains-only.
- `holdPoint` starts its grid at `box.top` (−54): without alpha (unit test path) it returns a point with negative y, and with
  alpha it can too (the right panel is opaque above the scene). `RoomScene.slotTargets` hands that to the e2e hook → an
  off-canvas tap. Fix: clamp the scan to the scene rectangle (top ≥ 0 + margin). L-4 (`getPixelAlpha` try/catch) fires only
  if `alphaAt` is touched; reading pixels at local y 0..15 is inside the texture.
- `tests/roomsData.test.ts` "draws every piece inside the scene" asserts `p.y + t >= 0` → must allow a piece whose visible
  rectangle extends above the top (e.g. "intersects the scene", or a named exception from the manifest note).
- HUD: `HUD_LAYOUT.speaker` (x 1494–1598) and the star counter (x 1622–1818, y 46–146) are in `UIScene`, drawn over
  `RoomScene` by scene order; no overlap with x 248–806.

### D. Architecture before/after and the art script

- `designs/martynka-salon-v2/assets/room/architecture-{before,after}.png` are curtain-less (README; `curtainEdit` mask:
  pixels outside it identical to expansion-v1). `furnishings-before.png` and `shadows.png` are byte-identical to v1
  (`cmp`). `furnishings-before` (viewed) contains the old sofa, rug, table, cabinet, armchair, frames, lamp, both plants and
  the pouf, and NO curtains and NO shelf → with the v2 architecture the neglected room has a bare window, consistent with
  "curtains absent until bought". (The pack's `screenshots/salon-before.png` shows a curtain panel because the pack
  preview may "osobno pokazać wybrany panel zasłon"; the game should not.)
- Same keys: `SCENE_FILES` in `src/data/roomArt.ts` and `SALON.scene` stay `salon/before|after`; only the file content changes.
  The service worker precache revision changes for the two files (vite-plugin-pwa hashes content).
- `scripts/make-task-art.mjs`: `ROOM_JOBS` reads from `EXPANSION`; switch to `SALON_V2` and add the 12 ids. All 22
  existing furniture PNGs are identical in both packs and `cwebp` output is deterministic (re-encoded `sofa-morska` from v2
  equals the committed file), so the switch rewrites only the architecture pair. After it, `EXPANSION` is only in the
  existence check and can go.
- Measured WebP (`-q 85 -alpha_q 100 -m 6`, into `$TMPDIR`): curtains-leaf 28 068, curtains-cream 25 954, curtains-botanical
  32 464, shelf-oak 17 660, shelf-mint 14 286, shelf-arch 19 498, lamp-wicker 20 030, lamp-flower 17 920, plant-fern 33 848,
  plant-ficus 30 202, pouf-knit 13 590, pouf-oak 7 908 → 261 428 B; architecture-before 95 606 → 93 778, architecture-after
  74 802 → 71 648. Room folder today 1 233 242 B (26 files) → 1 489 688 B (38 files).
- Boot queue (`balance.loader` comment): 2 073 293 B ≈ 41.5 s at 50 KB/s today → ≈ 2 329 739 B ≈ 46.6 s, over
  `totalMs` 45 000. `tests/loaderBalance.test.ts` allows 30–60 s and requires > 24 s → raising to e.g. 50 000 fits; past the
  limit the game still starts with stand-ins (`bootLoadPhase`), so the alternative is to accept and rewrite the comment.
- Texture atlas follow-up ("precache over budget, about 2.2 MB, S-16d adds salon art"): the boot load passes ≈ 2.2 MB.
  Atlas needs a packer and `ArtImage` changes (S-16a note); recommend re-trigger, not in scope.

### E. Depth (z) of the 11 slots

- Back to front: curtains 3, wall-frames 5, rug 10, wall-shelf 18, cabinet 20, lamp 25, plant-left 26, sofa 30,
  plant-right (layer) 35, armchair 40, coffee-table 50, pouf 60. All distinct (the "z values are distinct" assertion holds).
- `ROOM_LAYOUT.depth`: scene 0, furnishingsBefore 1, shadows 4, outline 100+. Curtains z 3 < shadows 4. The pack order
  (README: architecture-after, then shadows and layers, then slots by z) puts shadows below curtains → recommend
  `depth.shadows` 2 (and its comment). `miniaturePieces` already puts shadows before all z-sorted pieces.
- The shelf (z 18) sits under the cabinet (z 20) by design (README: the cabinet partly covers the shelf's lower edge).

### F. Live saves

- `RoomState` = `{ tasksDone, chosen }`; appending keeps every saved position. A completed v3 salon (`tasksDone` 7):
  `currentTask` = curtains; `roomDone` false → in `RoomScene.redraw` the mode button is hidden, `RoomView.render` drops the
  shadows, `roomsListView` locks the teaser; at the 12th purchase `RoomScene.dispatch` sets `card` and shows `RoomDoneCard`
  again (no persisted "seen" flag). The child keeps hold-to-change for bought pieces (`RoomScene.feed` does not check `roomDone`).
  Visible side effect for the visual gate: an old done salon loses its shadows until task 12 (the shadows picture is the
  finished room's; keeping the rule is recommended).
- `curtains`: `OLD_ONLY_KEYS` (`src/core/migrations/legacySalon.ts`) holds floor, walls, curtains, table, lamp, shelf, plant,
  picture; `LIFT_V2_SALON` is `MIGRATIONS[2]` and `decodeSave`/`importProblem` run migrations only for `from < SAVE_VERSION`
  (3) → never on a v3 save. On a v2 save it drops `curtains` (an old-only key not in `TARGET_SLOTS`), so a lifted salon
  never shows the new curtains unbought. `tests/legacySalonMigration.test.ts` already feeds `curtains: 0` in a lifted input;
  the pin to add: a v3 save with `chosen.curtains` decodes unchanged, and a lifted v2 salon has no `curtains` key.
- Pin test "L-1: the v3 target is the first 7 tasks of the live salon" compares `SALON_V3_TARGET` with
  `SALON.tasks.slice(0, 7)` → stays green; make the prefix explicit and add the M-R4 append-only guard (full ordered id
  list of the 12 tasks).
- Rollback to the S-16c build: `roomDone` reads `tasksDone` 8..12 as done; unknown `chosen` keys are ignored by
  `RoomView.render` (loops over `room.slots`) and accepted by `validateSave` (values only).

### G. Miniature and done card

- `drawRoomMiniature` is still used: `RoomDoneCard.drawRoomTile` picks `miniatureMode` = `live` (all needed keys exist) →
  `drawRoomMiniature`; else the pack thumbnail `UI_ART_KEYS.salonAfter`; else drawn stand-ins. With 11 slots it draws up to
  4 scene + 1 decor + 11 slots; it must use the same default-look helper (otherwise an unbought lamp vanishes from the
  miniature — but the card shows only for a done room where every slot is chosen, so the helper matters only for
  consistency/tests). The v2 `salon-after` thumbnail (viewed) shows curtains, lamp, plants, pouf — fits a done 11-slot room.
- F2 (stand-ins on one `Graphics` under all pictures) fires only if `drawRoomMiniature` changes; `miniaturePieces` is the
  natural place to change → F2 can stay out if `drawRoomMiniature` itself is untouched.

### H. Minigame words

- `MINIGAME_WORDS` (`src/data/minigames.ts`) is a literal of 6 words; `pl.room.slots`'s comment claims they are the words
  of "Hasło z wyników" but nothing derives them. Tests using it: `tests/wordScreen.test.ts` (longest word fits),
  `tests/hintVisual.test.ts`, `tests/wordRound.test.ts`. Unchanged per change.md decision 6; the plan may fix the
  `pl.room.slots` comment.

### I. Tests and e2e specs that change

Unit (must change): `tests/roomsData.test.ts` ("salon data": 6/4/7 → 11/1/12; "never fall" costs; "inside the scene"
for curtains), `tests/roomArt.test.ts` ("has 26 entries" → 38, weight 1 400 000 → new budget ≥ 1 489 688),
`tests/roomMiniature.test.ts` ("renovated room with the decoration after the stage": decor keys now come from default-look
slots), `tests/roomHit.test.ts` (`holdPoint` for every furnished slot: add curtains on-scene check),
`tests/legacySalonMigration.test.ts` (explicit prefix + curtains pins). Likely green as is (data-driven): `tests/artPick.test.ts`,
`tests/layout.test.ts`, `tests/thumbFit.test.ts`, `tests/soundCues.test.ts`, `tests/saveFile.test.ts`.

E2E:
- Must change: `tests/e2e/salon-art.spec.ts` "#16 with the salon pictures missing …" `expect(health.total).toBe(26)` → 38.
- Grow by data (12 purchases instead of 7, `e2eStars` = sum of costs ≤ 500 seam cap): `tests/e2e/room-change.spec.ts`
  "FR-019 the last purchase shows »Pokój gotowy!« …", `tests/e2e/final-art-room-done.spec.ts` `finishSalon` (3 tests,
  `test.setTimeout(120_000)` each; 5 more panel purchases each — watch the limit).
- Unaffected (first tasks, costs unchanged): `room-purchase.spec.ts`, `salon-art.spec.ts` #2 legacy (lands on
  `place-cabinet`), `save-restart.spec.ts`, `save-transfer.spec.ts` (`SALON.tasks.length`), `final-sound.spec.ts`,
  `salon-load-health.spec.ts`. No spec asserts 71.
- New coverage worth adding: a done v3 salon (seam fixture, e.g. `?e2eSave=done-salon` with a new frozen
  `tests/fixtures/save-v3-done-salon.json`, marker in `vite/e2eHookGuard.mjs`) → next task curtains, no mode button, card again
  at 12; a default-look lamp visible before purchase (L-7's per-layer `picture|standIn|hidden` in the hook snapshot would make
  it assertable).

### J. Deploy smoke (M-6)

- `scripts/check-deploy.ts` today checks precache vs bundles and the build id, nothing about rooms. M-6 (first half): count
  precache entries under `assets/rooms/` = `ROOM_ART.length` (38) and fetch one salon file; the SW `console.warn` half is
  P-6 and out. `check-deploy.ts` is under `scripts/`, not `deploy/` → allowed by the run contract.

## Code References

- `src/data/rooms.ts` `decor`, `slots`, `SALON.tasks` (append-only comment), `ROOM_ORDER`
- `src/core/types.ts` `SlotDef`, `LayerDef`, `RoomDef`
- `src/core/rooms.ts` `currentTask`, `purchase`, `stagesDone`, `roomDone`, `roomsListView`
- `src/core/roomHit.ts` `slotBox`, `slotAt`, `holdPoint`
- `src/core/variantPanel.ts` `stepPanel` (change branch requires `chosen`)
- `src/ui/widgets/RoomView.ts` `RoomView.render`, `RoomView.highlight`, `miniaturePieces`, `drawRoomMiniature`, `layerBox`
- `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile`; `src/core/artPick.ts` `miniatureMode`, `neededMiniatureKeys`
- `src/scenes/RoomScene.ts` `dispatch`, `redraw`, `alphaAt`, `slotTargets`, `snapshot`, `feed`
- `src/data/roomArt.ts` `SCENE_FILES`, `SALON_ART`; `scripts/make-task-art.mjs` `ROOM_JOBS`, `decor`, `furniture`, `EXPANSION`
- `src/data/layout.ts` `ROOM_LAYOUT.depth`; `src/data/balance.ts` `loader.totalMs`, `round`
- `src/core/migrations/legacySalon.ts` `OLD_ONLY_KEYS`, `LIFT_V2_SALON`, `SALON_V3_TARGET`; `src/core/save.ts` `MIGRATIONS`, `decodeSave`
- `src/data/pl.ts` `pl.room.tasks|slots|variants|decor`, `roomText`; `src/data/minigames.ts` `MINIGAME_WORDS`
- `scripts/check-deploy.ts` `main`

## Architecture Insights

- Room content is data; the scene renders `RoomState` and routes taps through `stepPanel`. The one new rule (pre-purchase
  look) belongs in `core` so it is unit-tested and shared by the room and the miniature.
- `tasksDone` as a prefix index makes appending free and reordering destructive; the M-R4 guard turns the comment into a test.
- Art keys are derived from `SALON` in `SALON_ART`, so new slots add their files to boot, precache and "Obrazki" automatically.

## Historical Context (from prior changes)

- `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` — "append at the end" rule, F2, VO1–VO3, atlas.
- `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` — M-6, L-4, L-7.
- `context/archive/2026-10-16-final-art-p2/research.md` and `follow-ups/review-fixes.md` — boot-queue budget (≈ 41 s at 50 KB/s),
  atlas trigger "about 2.2 MB, S-16d adds salon art".
- `context/archive/2026-10-13-first-furniture-purchase/plan.md` — origin of the non-decreasing cost invariant (agent choice).

## Related Research

- `context/archive/2026-10-16-final-art-p2/research.md`

## Open Questions (choices for the plan, not missing evidence)

1. Cost ramp (a) 8, 10, 12, 13, 15 vs (b) all 15 — and the matching edit of the "never fall" assertion.
2. Field name and shape for the pre-purchase look (`SlotDef` optional field vs a set on `RoomDef`).
3. `balance.loader.totalMs` 45 000 → ~50 000, or accept a slightly longer worst-case first start on stand-ins.
4. `ROOM_LAYOUT.depth.shadows` 4 → 2 (pack order) — confirm in the visual gate.
5. Whether to add the done-salon e2e seam and L-7 per-layer state in the hook.
