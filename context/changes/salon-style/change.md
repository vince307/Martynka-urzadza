---
change_id: salon-style
title: Salon before state in the house clay style, palette board, contact shadows in the empty room
status: planned
created: 2026-10-24
updated: 2026-10-24
archived_at: null
---

## Notes

Non-roadmap fix change of run 2026-10-24-salon-style (no roadmap row, no roadmap edit). Source: the maintainer's
"zrób salon w kodzie" (2026-10-24) after the read-only art review of 2026-10-24, summarised in the run's scope. The
review found that the salon's BEFORE state (the neglected background plus the one-layer worn furnishings picture) is
painted in a different technique (gouache/storybook grain, sepia, darker, greyish teal) than everything after it (smooth,
glossy "clay/vinyl toy" furniture, wallet, coins, icons, notebook), so after the renovation the room "changes style"
instead of looking renewed. Smaller findings: a saturated green board baked into both room backgrounds around the
diorama, three different turquoises, and an empty renovated room whose fixed decoration floats without contact shadows.

Pre-agreed scope (the run's scope, items 1-8), fixed in code and in the art conversion script, WITHOUT new art:

1. One fresh change `salon-style`.
2. Before state in the house style: stop drawing the worn furnishings picture; show the AFTER furniture (variant 0 of
   each slot the before picture covers, or the closest variant) through a Phaser 4 colour filter (about -25 % saturation,
   light sepia, about -8 % brightness) plus a dust/wear overlay drawn in code (or one tiny generated file); keep the
   before background unless research shows it clashes. Each slot's before -> after must stay understandable. Nothing new
   animates under `prefersReducedMotion()`.
3. Green board: recolour the green around the diorama in both room backgrounds to a palette colour in the art
   conversion (`npm run art`, `scripts/make-task-art.mjs`; colour mask, edge smoothing, deterministic) or in code if
   research shows that is cleaner. The blurred backdrop behind the notebook follows.
4. Turquoises (optional, low risk): nudge `sofa-morska`, `ui/wallet-open`, `icons/cup` towards the palette turquoise in
   the conversion, only if a side-by-side shows a clear gain.
5. Empty AFTER room: contact shadows under the fixed decoration right after the background stage; optionally a very
   light paper/noise texture; nothing that changes slot geometry or hit areas.
6. No game logic, balance, costs, slots, variants or save change (save stays v4). No new player-facing text. The boot
   budget test stays green; art health ("Obrazki", `roomArtCheck`, `precacheCovers`) stays truthful; a missing room
   picture still shows the existing stand-in.
7. DESIGN-GAP rows for what the kit does not specify; `docs/art-inventory.md` updated; follow-ups with triggers (the
   salon thumbnail and loading background still show curtains; a proper "before" from the author if the code version
   falls short).
8. Visual gate as the key proof: room before, after the stage, after the first furniture purchase, a finished room, the
   task-screen backdrop; desktop 1440 + tablet 1024, next to the review's comparison of the after furniture.

Out of scope: new art from the author, the fox, the notebook UI, task icons other than the turquoise nudge, other rooms,
street and houses. How far: stop at an open PR.

## Scope claims re-verified against the repo (branch `feat/salon-style` at `309e672`)

| claim (scope / art review) | repo now | correction |
|---|---|---|
| The before state draws `architecture-before` + `furnishings-before` | `RoomView.render`: `renovated = stagesDone(room, state) > 0`; scene layer `room.scene.before` and, only while `!renovated`, a `furnishings` layer `room.scene.furnishingsBefore` at `ROOM_LAYOUT.depth.furnishingsBefore` (1). Before the stage NO decor and NO slot is drawn: `shownVariant` returns null for `shownBeforePurchase` slots while `stagesDone === 0`. `miniaturePieces` (used by `drawRoomMiniature` -> `SalonBackdrop` and `RoomDoneCard`) mirrors it | none for the files; note the before state is today exactly two whole-scene pictures |
| The before files come from expansion-v1 | `scripts/make-task-art.mjs` converts every room file from `designs/martynka-salon-v2/assets/room/` (`sceneFiles`); the salon-v2 `furnishings-before.png` and `shadows.png` are byte-identical to expansion-v1's, `architecture-before.png` differs (curtains erased by the v2 curtain mask) | the source pack is salon-v2 (content inherited from expansion-v1); the script needs no second pack |
| How the stage task switches before -> after | Task 1 is `{ kind: 'stage', id: 'renovate' }` and must be bought before any slot (`tasks` order). On purchase `RoomScene.fadeStage` adds two ghost images (`room.scene.before`, `room.scene.furnishingsBefore`) over the new render and tweens them to alpha 0 over `ANIMATION.stageFadeMs`; nothing under `prefersReducedMotion()`. After the stage the worn set is gone and every slot is empty until bought, except lamp, left plant and pouf (variant 0 via `shownBeforePurchase`) and the right plant (`decor`) | the worn furniture never sits beside a bought piece: the "sofa changes style" jump happens across the stage (worn sofa -> empty spot -> bought sofa). `fadeStage` must ghost the new filtered layers instead of the dropped file |
| Which slots the before picture covers | Read from the decoded picture: sofa (teal, cushions), rug (circles), coffee table, cabinet (with two potted plants on top), armchair (cream), pouf (knit, yellow), lamp on a round side table (+ small plant), three wall frames, big left plant (monstera), right plant, plus litter (papers, leaves). Not covered: curtains, wall shelf. The plants on the cabinet and the side-table plant belong to no slot; the right plant is `decor`, not a slot | research maps each piece to slot + variant (variant 0 is not always the closest: e.g. the before pouf is knit/yellow, the slot has `pouf`, `pouf-knit`, `pouf-oak`); the extra plants and litter have no slot counterpart (dropped, or wear overlay) |
| "the existing `shadows` layer / `ROOM_LAYOUT.depth.shadows`" for contact shadows under the fixed decoration | `shadows.webp` is ONE whole-scene layer (alpha bbox 144,433-1881,999) with soft shadows under cabinet, sofa, coffee table, armchair+pouf, lamp and both plants, i.e. under bought furniture too; `RoomView.render` shows it only when `roomDone` (depth 2) | showing the whole layer right after the stage would put shadows under the absent sofa, table, cabinet and armchair. Contact shadows for lamp, left plant, pouf and right plant must be per-piece: drawn in code (ellipses at each piece's `anchor`) or cut per region from the shadows picture; research picks |
| Boot budget "~0.4 s of headroom" | observed: payload 2 378 800 B = 47.58 s at 50 KB/s vs limit (`balance.loader.totalMs` 50 000 - 2 000) = 48 s, headroom 0.42 s (~21 200 B); `tests/bootBudget.test.ts` green | none. Dropping `furnishings-before.webp` (288 634 B, the largest boot file) frees ~5.8 s |
| `npm run art` can recolour the green board | `scripts/make-task-art.mjs` only shells out to `cwebp` (`-q 85 -alpha_q 100 -m 6`) per file; no pixel access; no image library in `package.json` (no sharp/pngjs/jimp); `scripts/make-font.py` is the precedent for a pinned Python tool step | a colour mask needs pixel access: a new pinned devDependency, a pinned Python step (precedent `make-font.py`), or the recolour done in code; research decides and records determinism |
| The green is "uniform, about rgb 106,175,97" | measured: a lit gradient, about (57,140,89) to (115,183,105), ~13-15 % of each background frame (`architecture-before` 13.4 %, `-after` 14.7 %), touching the frame edges around the diorama | a single-colour key is not enough; the mask is a hue/saturation range, with soft edges at the diorama's outline |
| Turquoise files | `sofa-morska` (salon-v2 furniture, room art), `ui/wallet-open` (salon-v2 `learning`, `UI_JOBS`), `icons/cup` (maths-A kit, `JOBS`); palette turquoise `#54BEB4` = `PLACEHOLDER_COLORS.turquoise` and the salon-v2 manifest palette | none; note `icons/cup` comes from a different pack than the other two |
| Art health stays truthful when files are removed | `ROOM_ART` is derived from `SCENE_FILES` (`src/data/roomArt.ts`) and `RoomDef.scene.furnishingsBefore` (`src/core/types.ts`); it feeds the boot queue, "Obrazki" counts, `tests/roomArt.test.ts` (`toHaveLength(38)`), `tests/bootBudget.test.ts`, `scripts/check-deploy.ts` (`precacheCovers('room pictures', ...)`), `tests/uiArt.test.ts` | dropping the file touches the type, the table, these tests, `tests/layout.test.ts` (`depth.furnishingsBefore`), `tests/roomMiniature.test.ts`, `tests/roomShown.test.ts`, `tests/roomFixtures.ts`, and `tests/e2e/salon-load-health.spec.ts` #15 (it stalls exactly `furnishings-before.webp`; needs another target). The `balance.loader` comment ("the largest file is 289 KB") goes stale |
| A missing room picture still shows the stand-in | `RoomLayer.show`: missing texture -> stand-in box with caption (slot/decor), nothing for a whole-scene layer; `RoomView.drawBackdrop` fills the coloured backdrop for a missing scene picture | the filtered before pieces reuse slot textures, so a missing one would show the slot's stand-in box in the before state (today: nothing); research decides whether worn pieces get the stand-in or nothing |
| Hit areas unchanged | `slotAt` / `holdPoint` (`src/core/roomHit.ts`) only consider slots with `chosen[slot.id] !== undefined` | worn before pieces stay non-interactive automatically, provided they are not routed through `state.chosen`. The e2e room snapshot `shown` comes from `RoomView.shown()` (`shownNow`); worn pieces must not enter it, or the hook contract changes |
| The before background "moderate texture", may stay | decoded at half size: scuffed walls, plank floor, the same green board; style closer to the after background than the furnishings picture | research judges it beside the filtered furniture (scope item 2) |
| The blurred backdrop "follows automatically" | `SalonBackdrop.render` draws `drawRoomMiniature` into a DynamicTexture and blurs it (WebGL only); `backdropMode` (`src/core/backdrop.ts`) keys on the scene picture only | the board recolour follows automatically (same files); the filtered worn furniture does NOT: `miniaturePieces`/`drawRoomMiniature` must apply the same filter, and on the Canvas renderer filters are unavailable (research: what Canvas shows) |
| Maintainer's earlier style decision | `docs/art-inventory.md` "Styl salonu" row: "a) zostaje" (salon kept as v1, unify with the room list after v1) | superseded in part by the 2026-10-24 decision; the inventory row is updated, not deleted |
| Gap 107 | `docs/design-gaps.md` row 107: "the room is `furnishings-before` (all pieces in their worn form, one layer) plus `shadows`" | row 107 is amended (worn look now drawn from the after furniture); new rows for the worn filter, the board colour and the contact shadows |
| Lessons file | `context/foundation/lessons.md` does not exist | none applied |

## Design kit views and spec sections this change binds (profile § 6)

- Palette: `designs/martynka-maths-A-v1/style-guide.md` "Palette and rendering" (Ivory `#FFF5DF`, Turquoise `#54BEB4`) and
  the salon-v2 manifest `palette` (turquoise, leafGreen `#90C36A`, butterYellow, ivory, terracotta, oak, deepTeal) mirrored
  by `PLACEHOLDER_COLORS` / `PAGE_BACKGROUND` in `src/data/layout.ts`. The board colour and any wear/shadow tint come from
  these tokens only.
- Room composition: the salon-v2 README drawing order ("architecture-after, then shadows and fixed layers, one variant of
  each slot by z; for the before state architecture-before and furnishings-before") and its manifest (`scene`, `slots`,
  `layers`, `camera`, light upper-left). This change departs from the before-state rule on the maintainer's decision.
- Kit views to screenshot against: `designs/martynka-maths-A-v1/screenshots/` and `preview.html` (task screen with the
  room behind the notebook); the after furniture of all packs is the style reference.
- DESIGN-GAP (kit silent, never invented): the worn/dusty look of a not-yet-renewed piece (filter numbers, dust overlay);
  the colour of the area around the diorama; contact shadows for fixed decoration in an otherwise empty room; what a
  missing texture of a worn piece shows. Rows go to `docs/design-gaps.md`; gap 107 (and 109 for the cross-fade, if the
  ghosts change) amended.
- Spec: `Martynka-urzadza.md` § 14 working rules (no player text or balance numbers in scenes; colours/tokens from
  `data/`); profile § 6 tokens rule.

## Migration

None expected. Save format stays v4 (`SAVE_VERSION` 4, `MIGRATIONS` untouched); `RoomState` (`tasksDone`, `chosen`)
keeps its meaning; nothing new enters `SAVE_KEYS`. Removing `RoomDef.scene.furnishingsBefore` is a data/type change, not a
save change (no saved field names a texture). Profile § 4: no database.

## Open follow-ups triggered by this slice

| follow-up | trigger | take |
|---|---|---|
| final-art-salon impl-review F1: `fadeStage` ghosts and the pop pause while `RoomScene` sleeps | the next change to `RoomScene.fadeStage` | **fires** (fadeStage must ghost the new worn layers). Fold in: complete/destroy the ghosts in the `sleep` handler, small and in the same function |
| final-art-salon impl-review F2: `drawRoomMiniature` draws all stand-ins on one Graphics under all pictures | the next change to `drawRoomMiniature` | **fires** (miniature must draw the worn layers). Fold in only if the worn layers need stand-ins in the miniature; otherwise re-record open |
| salon-extra-slots plan review F2: miniature does not clip the curtains above its top | the next change to `drawRoomMiniature` | fires on the same edit; not a style issue, re-record open unless the visual gate shows it |
| final-art-salon VO2 / salon-extra-slots VO2: overlapping stand-in labels | the next change to `RoomView.render` | fires; the fix needs the one stand-in drawer (F5), out of scope; re-record open |
| final-art-salon F5/F7 one Box helper, one stand-in drawer | a second room or the next refactor of the room widgets | not fired (no refactor planned), stays |
| salon-extra-slots L-7 / health-lines §9 per-layer state in the hook | the next change to `RoomLayer` | fires only if `RoomLayer` gains a filter; then the worn layers' state goes into the room snapshot as a minimal field (it is the e2e proof anyway); otherwise stays |
| salon-extra-slots L-R8, L-R11 (`stepPanel` refusals, `celebrate`/`onSleep`) | the next change to `RoomScene` | fires; `onSleep` overlaps F1 (folded with it); `stepPanel` refusals untouched, re-record open |
| salon-load-health M-6: `check:deploy` counts room art / one salon file | the next change to the room art set | fires (one file removed), nothing to fold: `scripts/check-deploy.ts` now checks `precacheCovers('room pictures', precache, ROOM_ART.map(...))`, derived from the table, and names no salon file; the M-6 second half (service-worker install warn) is unrelated, re-record open |
| salon-extra-slots "Per-file timeout test of final-art-p2" | the next change to `balance.loader` or the boot queue | fires (boot queue loses one file); no unit test names `furnishings` except the four room tests listed above; `balance.loader` numbers unchanged, only its comment; re-record open |
| fox-guide F4 boot budget headroom | `tests/bootBudget.test.ts` red | not fired; this change frees ~5.8 s. The `balance.loader` comment numbers are refreshed |
| final-art-salon / final-art-p2 / salon-extra-slots texture atlas | precache over budget, a second room, a slow-start report | not fired, stays |
| final-art-salon "Renovation stage has one plain cross-fade" (gap 109) | the author delivers in-between backgrounds | not fired (no new art), stays; gap 109 text updated if the ghosts change |
| final-art-salon GPU memory (crop `shadows`, ~59 MB) | a tablet check finding memory trouble | not fired; dropping a full-scene RGBA texture lowers it (~8 MB), noted |
| final-art-p2 `salon-before` thumbnail not converted | the author asks / a room list with not-done rooms | not fired; new follow-up of this change covers the thumbnail and loading background with curtains (scope item 7) |
| salon-extra-slots "A done salon loses its shadows ... until task 12" | S-17 if the author dislikes it | not fired; adjacent (shadows logic touched for the decoration); kept open, the plan must not change when the whole shadows layer shows |
| audit-backdrop-fox F6 `isSalonPixel` in `backdrop-restore.spec.ts` | the next change to `SalonBackdrop.render` or the backdrop blur | fires only if `SalonBackdrop.render` changes (expected not: the change sits in `miniaturePieces`/`drawRoomMiniature`); otherwise stays |
| notebook-polish 16 (remainder) | the next change to `SalonBackdrop`, `starBurst`, `Keypad`, `WelcomeScene` | same condition as above; stays unless `SalonBackdrop` is edited |
| first-furniture-purchase V1 slot captions | S-16 (art) or the next change to `RoomView` | obsolete: captions were removed with the art in S-16a (captions now only on stand-ins); recorded as closed-by-history, not folded |
| salon-load-health L-4 / salon-extra-slots L-4 hit test | a change to the room hit test | not fired (no hit-test change), stays |

## Autonomous decisions

- **D0 Scope items 1-8**: pre-agreed by the maintainer 2026-10-24 (the run's scope), taken as written: code + conversion
  script, no new art, no logic/save change, stop at an open PR. Would change: a new maintainer instruction.
- **D1 Next step `/10x-research`** (not the skill's default `/10x-plan`): fixed by the step prompt, and the change has real
  unknowns (Phaser 4.2.1 ColorMatrix on images and inside a DynamicTexture draw, Canvas fallback, slot/variant mapping of
  the worn picture, pixel tooling for the board recolour, per-piece contact shadows). Rejected `/10x-frame`: framing is
  pre-agreed. Would change: nothing (prompt-fixed).
- **D2 The worn set disappears at the stage, as today**: the filtered worn pieces replace the worn picture only in the
  before state; after the stage the slots stay empty until bought (current flow). Rejected: keeping each worn piece in the
  renovated room until its slot is bought (it would alter the after-stage look the scope's item 5 describes, the variant
  panel/preview interplay and the done-room logic). Would change: research's screenshots showing the empty-spot jump
  still reads as "changed style", or the maintainer asking for per-slot renewal.
- **D3 Worn pieces are drawn outside `state.chosen` / `shownVariants`**: separate layers so hit tests, `RoomView.shown()`
  and the e2e `shown` snapshot keep their meaning. Rejected: routing through `shownBeforePurchase` (changes core rules
  and the hook contract). Would change: research finding a core rule is needed for the miniature to stay in sync with the
  room (then a pure helper beside `miniaturePieces`, still not in `chosen`).
- **D4 Contact shadows per piece, not the whole `shadows` layer**: the layer holds shadows of absent furniture. Rejected:
  showing `salon/shadows` right after the stage. Would change: research finding the layer can be cropped per region in
  the conversion more cheaply and as well-matched as code ellipses.
- **D5 Board recolour tool left to research**, with a preference for the conversion step (scope item 3) only if it stays
  deterministic with a pinned tool; code is the fallback. Would change: nothing beyond research's measured result.
- **D6 Turquoise nudge (item 4) stays optional**: done only with a side-by-side showing a clear gain; `icons/cup` comes from
  the maths-A pack, so it also follows the conversion job of that pack. Would change: the side-by-side.
- **D7 Follow-ups folded**: final-art-salon F1 (ghosts on sleep, same function) and, conditionally, final-art-salon F2 and
  L-7 (only if the plan's miniature/`RoomLayer` edit needs them). Everything else in the table is re-recorded open or not fired. Would change: the
  plan finding a folded item larger than a few lines (then it is re-recorded instead).
