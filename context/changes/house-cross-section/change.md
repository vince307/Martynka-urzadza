---
change_id: house-cross-section
title: Przekrój domu z piętrami; „Do pokoju” zawsze do pokoju w remoncie
status: plan_reviewed
created: 2026-10-31
updated: 2026-10-31
archived_at: null
---

## Notes

Roadmap S-23 (M-03 „Ulica i domy”), PRD FR-038, FR-039, FR-033. Autonomous run `2026-10-31-house-cross-section`, branch
`feat/house-cross-section` cut from `main` at `112f158`. Outcome: the child sees the house from the side like a doll's house
(floors from data, each room a miniature drawn from its live layers as she left it, closed rooms as "Wkrótce" cells); a tap on
a room opens it in full view; "Do pokoju" from the notebook always reaches the room in renovation; the cross-section is a
separate button, never a forced stop; every level returns in one tap.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Roadmap claims re-verified against the repo (branch `feat/house-cross-section` at `112f158`)

| roadmap claim (S-23, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-22 (kitchen) | Shipped (#118, archived `context/archive/2026-10-31-kitchen-room/`). `ROOMS` has `salon` + `kitchen`; `HOUSES` (`src/data/houses.ts`) = `house-1`: salon (floor 0, place 0), kitchen (floor 0, place 1); `nextRoom` runs after "Dalej" and at load | confirmed |
| Blockers: "paczka skorupy domu 1 od grafika … do jej czasu skorupa rysowana w kodzie" | The pack ARRIVED: `designs/martynka-house-street-v1/` (QA `passed: true`, 10/10 checks): `assets/house/house-1-shell.png` 1920×1080, `cell-closed.png` 608×342 (roller blind, no text), `cell-frame.png` 640×374 (transparent 608×342 centre at 16,16), `manifest.json` (4 cells, stairwell, safe zones). WebP measured in the scratchpad with the art script's settings (`cwebp -q 85 -alpha_q 100 -m 6`): 44 964 + 5 554 + 8 600 = **59 118 B** (about 1.2 s at 50 KB/s) | **blocker resolved**. The shell ships with the pack's art (converted by `npm run art`); the code-drawn shell is only the missing-texture fallback |
| "piętra z danych" (FR-038: floor × place grid in data) | `HouseState`/`HouseRoomPlace` (`src/core/types.ts`) carry `floor`/`place` per room; nothing maps a cell to screen geometry. The pack manifest gives cells by `floor`/`col` with rectangles: ground-left (252,636), ground-right (1060,636), upper-left (252,236), upper-right (1060,236), each 608×342; `place` = manifest `col` | real gap: cell rectangles become layout data keyed by house id (from the manifest, not code constants); `place`↔`col` mapping confirmed (salon ground-left, kitchen ground-right, as in the pack preview) |
| "każdy pokój jako miniatura rysowana z żywych warstw tak, jak go zostawiło" | `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`) already draws a room from live layers at a scale; used by `RoomDoneCard` and `SalonBackdrop`. The pack's integration note: whole 1920×1080 diorama scaled 19/60 into the 608×342 cell, no crop | confirmed path; scale 19/60 = 608/1920 fits exactly. Rooms outside the boot set (the boot loads only the room in renovation, `bootRoomArt`) must come through `roomArtLoader` before their miniature is real (stand-in until then) |
| "zamknięte pokoje jako sylwetki „Wkrótce”" | `pl.room.done.teaser` = 'Wkrótce' exists; the pack's closed cell is a teal roller blind, the "Wkrótce" text is an HTML layer in the preview (32 px, `#FFF5DF`, shadow `#245C59`). `houseRoomList` turns the first unknown room into a teaser; the house data lists no cell for the upper floor | correction: "sylwetka" is the pack's roller blind (`cellClosed`), text drawn by the game from `pl.ts`. Closed cells = manifest cells with no known room (upper-left = the children's room of S-25, upper-right = the decided "Wkrótce" cell) |
| "dotknięcie pokoju otwiera go w pełnym widoku" | `RoomScene` has a runtime `visiting` (S-22) that opens a done room in change mode without touching `currentRoom`; `visitTarget` + `ROOM_LAYOUT.visitButton` + the hook's `visitTarget()` drive it | the cross-section reuses the `visiting` mechanism; the interim visit button, `visitTarget` and its hook target go (kitchen follow-up 1, design gap 180) |
| "„Do pokoju” z zeszytu zawsze trafia do pokoju w remoncie" | `GAME_EVENTS.toRoom` → `TaskScene` `scene.switch(SCENE_KEYS.room)`; `RoomScene` opens `visiting ?? currentRoom`; `visiting` is reset on leaving; `currentRoom` is written only by "Dalej" (`nextRoom`) and at load | confirmed today; the plan must keep it (a visit started in the house never survives the way back to the notebook). Edge: when every known room is done (`roomInRenovation` null) "Do pokoju" opens the last current room (done, change mode); acceptable, no house stop |
| "przekrój to osobny przycisk, nigdy obowiązkowy przystanek; z każdego poziomu jednym dotknięciem" | No house scene; scene list `[Boot, Welcome, Task, Room, UI]` (`src/main.ts`, `SCENE_KEYS`) | real gap: a house view (new scene or a layer of `RoomScene`, research decides), a house button in the room view, a one-tap way back from the house; at most three zoom levels (street absent until S-26) |
| Unknown: does the child choose which closed room opens next (FR-033) | scope.md fixes: order is data only | resolved: data only (decision D3) |
| Unknown: miniatures under Canvas and reduced motion | `applyWornGrade` (one place) records `worn: 'ungraded'` under Canvas; `SalonBackdrop` blurs in WebGL only; reduced motion = `prefersReducedMotion()` | follow the existing miniature path (the miniature itself has no tween); any house transition sits behind `prefersReducedMotion()`; Canvas e2e spec exists to extend |
| Risk: "zmęczenie hubem" → FR-039 in this slice | — | confirmed in scope (decision D4) |
| (implicit) boot budget | Boot loads one room (`bootRoomArt`) + pack art + fox + sounds; `tests/bootBudget.test.ts` keeps 2 s headroom under `balance.loader.totalMs` 50 000 | the house adds 59 KB; default: load at runtime on the first house open (scope.md), so the boot budget is untouched; research measures headroom anyway |
| (implicit) save format | v5 carries `house` (id + cells), `rooms`, `currentRoom`; `visiting` is runtime only; cell geometry is data, not save | **no migration expected** (decision D6) |

## Design kit views and spec sections this change binds (profile § 6 + the house pack)

| source | what it binds |
|---|---|
| `designs/martynka-house-street-v1/manifest.json` (`houses.house-1`) | `shell`, `cellClosed`, `cellFrame`, `cellFill` `#FFF5DF`, the four cells (id, floor, col, x, y, 608×342), `stairwell` (860,236,200×742), `safeZones.stars` (1560,0,360×120) and `safeZones.buttons` (0,1010,1920×70: where the house view's controls go) |
| `designs/martynka-house-street-v1/README.md` § Integracja | draw order: shell, then each whole diorama 1920×1080 at 19/60 into its cell, `cellClosed` for a closed cell, the frame at (cell.x−16, cell.y−16); sRGB, no darkening filter on room margins; half-open rectangles |
| `designs/martynka-house-street-v1/preview.html` | stage background `linear-gradient(#e7f4f4, #eef4e1)` (sky/green is CSS, not in the export: the game draws it from tokens with these values); "Wkrótce" text style (32 px, weight 650, `#FFF5DF`, shadow `#245C59`); frame shown on hover/focus |
| `designs/martynka-house-street-v1/screenshots/house-with-dioramas.png`, `house-empty.png` | visual-gate references for the house view |
| `docs/designer-brief-m03.md` „Układ domów” | house 1: salon (ground left), kitchen (ground right), children's room (upper left), closed "Wkrótce" (upper right) |
| `Martynka-urzadza.md` (plan) | room flow and asset naming (§ 10) for the new `public/assets/house/` files |
| Copy keys | existing: `pl.room.done.teaser` ('Wkrótce'), `pl.room.resume` ('Wróć do notesu'), `pl.room.names`; NEW (none in the kit): the house button label in the room view, the way back from the house, the house screen's spoken/aria name |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 182)

- The kit has no house button in the room view (label, icon, place): the interim visit button's place under the star counter (`ROOM_LAYOUT.visitButton`, inside nothing the pack reserves) is the default; label copy written in the existing style.
- The kit has no way back from the house view: a button in the pack's `safeZones.buttons` band; copy written in the existing style.
- The frame is a hover/focus highlight in the preview; touch has no hover. Default: the frame marks the room in renovation.
- The salon's green board (`#BCD799`, gap 178) inside a cream cell: the pack's preview used a locally recoloured `salon-after-ivory` that is NOT a game asset. The live miniature shows the green board until the P3.2 re-export; gap 178 is extended, nothing recoloured here.
- A tap on a closed cell: the kit says nothing; default inert (no harsh feedback, no text).
- No kit view for the house art missing: the code-drawn shell (cell rectangles in `cellFill`, outline) is the stand-in.

## Migration

None expected. The cross-section reads `house` (cells) and `rooms` already in v5; cell rectangles are layout data; `visiting`
stays runtime. Closed cells come from the manifest's cells that have no known room, so no unknown room id is written into the
save. If research finds a field this slice must persist (e.g. "last zoom level"), it is a recorded decision with a frozen
fixture like F-04; the default answer is no (FR-039: "Do pokoju" always goes to the room, so no level needs remembering).

## Open follow-ups triggered by this slice

| follow-up (source) | trigger | take |
|---|---|---|
| kitchen-room 1: S-23 replaces the interim visit button (`ROOM_LAYOUT.visitButton`, `visitTarget`, hook `visitTarget`, gap 180) | S-23 | **in scope**: the core of the navigation change; `tests/roomVisit.test.ts`, `tests/layout.test.ts` and `tests/e2e/kitchen-room.spec.ts` move to the house path; gap 180 closed |
| rooms-as-data 11: kids' room id and closed cells in the house | S-25 or S-23 (house shell art) | **fires, in scope partly**: closed cells come from the pack manifest (cells without a known room). The kids' room id stays S-25 (no `kids` row in `HOUSES` here, so the save never holds an unknown room); re-record the id part for S-25 |
| kitchen-room 12: house and street celebration copy and the keepsake | S-23 / S-24 | **not in S-23**: house 1 cannot be finished before S-25 (children's room), so no house-intensity moment exists here (scope.md). Re-record with `Trigger: S-24` |
| kitchen-room 16: `RoomScene` `onSleep`/wake drop a drawn celebration card without `moveAfterDone` | a way out of the room view that stays visible while the card is up (S-23) | **guarded in scope**: the house button is hidden while the card, the panel or change mode is up (as the visit button is), so the trigger does not fire; a unit/e2e check pins it. Re-record the fix itself |
| kitchen-room 19: task-screen backdrop invisible while the kitchen is current (gap 182) | S-23 (house cross-section and its backdrop) | **not in scope**: the task-screen backdrop is a neighbouring view; showing the house behind the notebook would be a redesign without a kit view. Re-record with `Trigger: the designer's salon re-export on cream (P3.2), a backdrop design answer, or a playtest note` |
| kitchen-room 10 / final-art-salon F2 etc.: `drawRoomMiniature` stand-in depth, curtains clip, worn stand-ins, grade boolean | the next change to `drawRoomMiniature` | conditional: fires only if the cell miniature needs a change to `drawRoomMiniature` (e.g. clipping to the cell); research decides, the curtains clip is the likely one |
| kitchen-room 3, 14, 15: runtime loader `wrongSizes`, `ensure` catch-path detach, repeated `once('complete')` | the next change to `src/ui/roomArtLoader.ts` | conditional: fires if the house art or the cross-section's room preloading edits `roomArtLoader`; if it does, 14 and 15 are small and in scope, 3 re-recorded unless cheap |
| kitchen-room 6 / F-04 6: service-worker install warning | the next change to the precache set | **fires** (three house WebP files join the precache); small; in scope if cheap (a `console.warn` in `registerServiceWorker`), else re-record with the reason |
| kitchen-room 2: a visited room is not judged by "Obrazki" | a change to `artHealth` / "Obrazki" | conditional: fires only if the house art gets a health line; default house art records its fallback in `REGISTRY_KEYS.artFallbacks` (decision D8); re-record otherwise |
| audit-art-renderer 2: `make-task-art.mjs` runs Python without `-I` | the next change to `scripts/make-task-art.mjs` | **already fixed** (`execFileSync('python3', ['-I', …])` in the board recolour call); close it in this slice's follow-ups as stale |
| salon-extra-slots / salon-style L-R8 (`stepPanel` refusals), rooms-as-data 13 | the next change to `RoomScene` (purchase handling) | `RoomScene` changes (house button, visit removal) but purchase does not: re-record |
| final-art-salon F1 `fadeStage` ghosts on sleep | the next change to `RoomScene.fadeStage` or a tablet check | not fired unless the house exit touches `fadeStage`; research checks sleep with a running cross-fade when the house button is tapped mid-fade |
| notebook-polish 66, audit-backdrop-fox, audit-art-renderer 27: `SalonBackdrop` follow-ups | the next change to `SalonBackdrop` | not fired (backdrop untouched, see kitchen 19) |

## Autonomous decisions

- **D1 — orchestrator starting decision (scope.md): the designer pack is IN scope.** Chosen: convert
  `designs/martynka-house-street-v1/assets/house/*.png` to WebP in `public/assets/house/` through `npm run art` (extend
  `scripts/make-task-art.mjs`, no board recolour: the shell is not a room background); code-drawn shell only as the
  missing-texture fallback. Rejected: code-drawn shell as the main view (the roadmap's interim plan) — the pack exists and QA
  passed. Would change: the maintainer rejecting the pack, or the pack failing the in-game visual gate.
- **D2 — orchestrator starting decision (scope.md): house layout.** House 1 = salon + kitchen (ground), children's room +
  "Wkrótce" (upper). In S-23 both upper cells are closed. Cell rectangles are layout data from the manifest keyed by house id
  (not code constants); `place` = manifest `col`. Rejected: adding a `kids` cell to `HOUSES` now (it would write an unknown
  room id into saves before S-25 defines it). Would change: S-25 landing first, or research showing `houseRoomList` needs
  the cell in `HouseState`.
- **D3 — orchestrator starting decision (scope.md): next-room order is data only (FR-033).** The child does not pick which
  closed room opens next. Rejected: a choice among closed cells (no second openable room exists in house 1; would need a
  save field). Would change: the author asking for a choice once a house has two closed openable rooms (S-26).
- **D4 — orchestrator starting decision (scope.md): FR-039 navigation.** "Do pokoju" from the notebook always opens the room
  in renovation (a house visit never survives leaving to the notebook); the house is reached only through its own button in
  the room view; the house returns in one tap; at most three zoom levels (street absent). Rejected: a house button in the
  notebook HUD (would make the house a stop between notebook and room for a 6-year-old; FR-039 says the room is one tap).
  Would change: playtest notes that the child cannot find the house from the room.
- **D5 — orchestrator starting decision (scope.md): miniatures from live layers.** Done and in-renovation rooms are drawn by
  `drawRoomMiniature` at 19/60 into their cell; rooms outside the boot set load through `roomArtLoader` (stand-in meanwhile);
  closed cells show `cellClosed` with `pl.room.done.teaser`. Canvas and reduced motion follow the existing paths. Would
  change: a pack thumbnail per room (brief P3) arriving.
- **D6 — orchestrator starting decision (scope.md): save format stays v5.** Verified above: nothing new is read from the
  save. Would change: research finding a field this slice must persist (then a recorded decision + frozen fixture).
- **D7 — orchestrator starting decision (scope.md): no balance change; boot budget.** Default: the house art (59 118 B
  measured as WebP) loads at runtime on the first house open, not in the boot queue, so `balance.loader.totalMs` stays.
  Rejected: adding it to the boot queue (cheap at about 1.2 s, but every boot pays for a screen the child may not open).
  Would change: research showing runtime loading makes the first open look broken (then boot it, within the measured
  headroom, never a raise of `totalMs` without a `[human]` row).
- **D8 — this step: replace, do not keep, the interim visit button** (scope.md + kitchen follow-up 1). The house button
  takes its place under the star counter; visiting a done room happens only from the house. Rejected: keeping both (two ways
  to the same thing, more buttons for a 6-year-old). Would change: a playtest showing the child misses the direct jump.
- **D9 — this step: celebration stays room intensity** (scope.md). No house-done moment is reachable in S-23 (the children's
  room is S-25). Would change: S-25 shipping before S-23, which would make house 1 finishable.
- **D10 — this step: missing copy is written in the existing style with a design-gap row** (profile § 6; precedent gaps 175,
  180): the house button label, the way back from the house. Rejected: blocking on the designer for two short labels.
  Would change: the designer delivering the wording.
- **D11 — this step: next step is `/10x-research`, not `/10x-plan`** (the skill's default). The slice adds a scene/view,
  touches navigation across `TaskScene`/`RoomScene`/`UIScene`, the runtime loader and the e2e hook; grounding is needed
  before the plan. Would change: nothing at this point; the orchestrator prompt fixes it.
