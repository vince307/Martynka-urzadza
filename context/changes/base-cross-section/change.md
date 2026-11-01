---
change_id: base-cross-section
title: Przekrój bazy; dziecko zostaje w bazie po Mostku; przycisk „Baza”
status: planned
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

Roadmap S-29 (M-03, Stream D „Baza kosmiczna”), PRD FR-045, FR-046, FR-048. Autonomous run `2026-10-31-space-base`,
branch `feat/base-cross-section` cut from `main` at `9a44799` (S-28 merge). Outcome: a child with the space base sees the
base in cross-section (the same cells as the house cross-section, closed modules as the pack's airlock with „Wkrótce”) and
returns to the module in one tap; after Mostek she gets the room celebration and stays in the base (free variant changes,
stars accumulate); „Do pokoju” reaches the module in renovation; the zoom-out button is named after the building: „Baza”
in the base, „Dom” in the house.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Roadmap claims re-verified against the repo (branch `feat/base-cross-section` at `9a44799`)

| roadmap claim (S-29, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-28 (choice + Mostek) | Shipped (#127, archived `context/archive/2026-10-31-first-building-choice/`). `HOUSES` (`src/data/houses.ts`) has `house-1` and `base-1` = `[{ room: 'bridge', floor: 0, place: 0 }]`; `BUILDING_CHOICES` maps `space` → `base-1`; `ROOMS.bridge` exists; save v6 | confirmed |
| Prerequisite S-23 (house cross-section) | Shipped (#121). `HouseScene`, `HouseView`, `houseCells`/`cellTap`/`houseWakeVisit` (`src/core/houseCells.ts`), `HOUSE_GEOMETRY` keyed by house id with only `'house-1'` | confirmed; the cross-section is already keyed by the saved house id (`HouseScene.geometry`, `RoomScene.houseCellList`), with a fallback to `house-1` |
| Blockers: „skorupa bazy `base-1-shell` i śluza 608×342 są w paczce `bystrow-space-base-v1`” | `designs/bystrow-space-base-v1/assets/base/base-1-shell.png` 1920×1080 RGBA and `cell-closed.png` 608×342 RGBA exist; manifest `bases.base-1` gives the same four cells as the house (ground-left 252,636; ground-right 1060,636; upper-left 252,236; upper-right 1060,236; 608×342), `liftShaft` 860,236 200×742 (the house calls it `stairwell`), `cellFill` `#FFF5DF`, `safeZones` identical to the house | confirmed, **but the pack has NO cell frame** (`cellFrame` is required by `HouseGeometry`; the house pack has `cell-frame.png` 640×374). DESIGN-GAP: the frame of the module in renovation (default: reuse the house `house/cell-frame` picture, research checks it reads on the base shell; else draw it) |
| „te same komórki co przekrój domu” | Cell rectangles in the manifest are byte-for-byte the house's | confirmed: `HOUSE_GEOMETRY['base-1']` is data only; `HouseGeometry` field `stairwell` takes the `liftShaft` rectangle |
| „zamknięte moduły jako śluza z „Wkrótce”” | `HouseView` draws `cellClosed` plus the „Wkrótce” text in the house pack's style (`#FFF5DF` with a `#245C59` shadow on a teal blind). The base preview (`preview.html`, `view=base`) draws the airlock and „Wkrótce” in `#245c59`, 600 32px, no shadow, on a `#e8efeb` stage background | correction: closed-cell text colour and stage background differ per building → building data, not a scene branch (research decides where: `HouseGeometry` or a sibling style record) |
| „wraca z niego do modułu jednym dotknięciem” | `HouseScene` back button `pl.house.back` „Wróć do pokoju”; `cellTap` current cell → room | confirmed mechanism; copy: „Wróć do pokoju” is used as is in the base (a module is a room, FR-048 keeps „Do pokoju”) |
| „po ukończeniu Mostka dostaje celebrację i zostaje w bazie” | Today: the room-done card (`RoomDoneCard`, `celebrationView('room')`) shows one tile, no teaser (`houseRoomList` lists only `bridge`), „Dalej” → `moveAfterDone` → `nextRoom` finds nothing in renovation, `movedFrom === null`, stays on Mostek; change mode („Zmień wygląd”) works; stars accumulate (gap 196) | mostly **already true**; what is missing is the zoom-out („Baza” button) and the decision what the card shows while no next module exists (roadmap unknown, see D4) |
| „„Do pokoju” prowadzi do modułu w remoncie” | `GAME_EVENTS.toRoom` → `RoomScene` opens `visiting ?? currentRoom`; `currentRoom` = `bridge` for a base child | confirmed, no change expected; when every module is done it opens Mostek in change mode (same as the house edge case) |
| „przycisk oddalenia nazywa się „Baza” (u dziecka z domem nadal „Dom”)” | `RoomScene.redraw` shows `pl.house.open` = 'Dom' (a constant) and hides the button when `HOUSE_GEOMETRY` has no entry for the saved house id (gap 195) | real gap: the button label must come from building data (e.g. a label key per house id in `pl.ts`), hook target `houseButton` kept |
| Risk: „scena domu rozgałęzia się na dom i bazę w kodzie zamiast w danych” | `HouseScene.shellReady`/`loadArt` read the flat `HOUSE_ART` table (three house files) whatever the building; `HouseScene.geometry` falls back to `house-1` | real: `HOUSE_ART` must become per building (keyed by the geometry's art keys), so the base loads only base pictures; no `if base` in `HouseScene`/`HouseView`/`RoomScene` |
| (implicit) art pipeline | `scripts/make-task-art.mjs` already reads `designs/bystrow-space-base-v1` (`SPACE_BASE`, `SPACE`) for Mostek and the choice cards; house shell root `HOUSE_OUT` = `public/assets/house/` | add the base shell and airlock to the house-art root (no board recolour: not a room); deploy smoke `scripts/check-deploy.ts` already compares `HOUSE_ART` with the precache, so a per-building table must keep that coverage |
| (implicit) boot budget | House pictures load on the house scene's first open, not at boot (`HouseScene.loadArt`) | base pictures follow the same path: `tests/bootBudget.test.ts` untouched |
| (implicit) save format | v6 carries `building` (via `house.id`), `rooms`, `currentRoom`; `visiting` is runtime only; cell geometry and art are data | **no migration expected** (D6) |
| (S-28 follow-up 9) `bases.base-1.label` „Baza księżycowa” vs card „Baza kosmiczna” | The label lives only in the designer manifest (`designs/bystrow-space-base-v1/manifest.json`); no code reads it; the game's names are `pl.welcome.choice.space` „Baza kosmiczna” and the new zoom-out label „Baza” (FR-048) | resolved by not importing the manifest label: the game copy is `pl.ts` only (D5) |
| (S-28 follow-up 17) `TaskScene.backToChoice` does not stop a sleeping `HouseScene` | `TaskScene.backToChoice` stops `SCENE_KEYS.ui` and `SCENE_KEYS.room` only | in scope: once the base has a cross-section, a child on the parent-less path could open „Baza”, go back to the notebook and press „Wróć” within the first round; the sleeping `HouseScene` would keep the base geometry. Stop it there (D3) |

## Design kit views and spec sections this change binds (profile § 6 + the space-base pack)

| source | what it binds |
|---|---|
| `designs/bystrow-space-base-v1/manifest.json` (`bases.base-1`) | `shell` `assets/base/base-1-shell.png`, `cellClosed` `assets/base/cell-closed.png` (airlock, no text), `cellFill` `#FFF5DF`, the four cells (id, floor, col, x, y, 608×342), `liftShaft` (860,236,200×742), `safeZones.stars` (1560,0,360×120), `safeZones.buttons` (0,1010,1920×70) |
| `designs/bystrow-space-base-v1/README.md` § Pliki, § Manifest i integracja | shell 1920×1080 with opaque cream cells and a transparent surround; airlock 608×342 without text („Napisy „Wkrótce” … rysowane wyłącznie przez podgląd”); Mostek in ground-left, other cells closed |
| `designs/bystrow-space-base-v1/preview.html` (`?view=base`) | stage background `#e8efeb`; whole Mostek scene scaled into ground-left 608×342; „Wkrótce” 600 32px `#245c59`, centred at cell x+304, y+182 |
| `designs/bystrow-space-base-v1/screenshots/base-with-bridge.png` | visual-gate reference for the base cross-section |
| `designs/bystrow-space-base-v2/README.md` (S-30, read only for placement) | Hangar goes in ground-right (1060,636) next to Mostek: so `base-1` cell order is ground-left → ground-right, and S-29 leaves ground-right closed |
| `designs/martynka-house-street-v1/` (S-23) | the house frame `cell-frame.png` 640×374 (inset 16), the only frame picture in any pack |
| `Martynka-urzadza.md` § 10 | asset naming for the new `public/assets/house/` (or `public/assets/base/`) files |
| Copy keys | existing: `pl.house.back` „Wróć do pokoju”, `pl.room.done.teaser` „Wkrótce”, `pl.room.done.title` „Pokój gotowy!”, `pl.room.names.bridge` „Mostek”, `pl.welcome.choice.space` „Baza kosmiczna”; changed: `pl.house.open` (today the constant „Dom”) becomes a per-building label: „Dom” for `house-1`, NEW „Baza” for `base-1` (FR-048 names the word, so it is not invented) |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 198)

- The base pack has no frame for the module in renovation: default reuse the house `cell-frame` picture (same 608×342 cell, inset 16); if research or the visual gate shows it clashes with the base shell, a code-drawn frame in a token colour.
- The kit has no base zoom-out button: same place and style as the house button (`ROOM_LAYOUT.houseButton`), label „Baza” (FR-048); gap 195 is closed by this slice.
- The kit has no celebration copy for a building's last available module (gap 196): see D4.
- Stand-in when the base pictures are missing: the code-drawn shell of `HouseView.standInShell` (the house's), recorded as `artFallbacks.house` as today; no new kit view.
- Hasło words in the base (gap 198): stays deferred (D7).

## Migration

**None expected.** The save already names the building through `house.id` (`base-1`), `currentRoom` and `rooms`; the
cross-section geometry, its art and the button label are data keyed by that id, and `visiting` stays runtime only. Save
format stays v6 (`SAVE_VERSION` 6). What would change it: research finding that the base needs a saved per-building field
the v6 shape cannot carry (none foreseen).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| first-building-choice 9 | `bases.base-1.label` „Baza księżycowa” vs card „Baza kosmiczna” | **in scope, closed by decision**: the game never reads the manifest label; copy is `pl.ts` (D5). Record as closed in this slice's follow-ups |
| first-building-choice 17 | `TaskScene.backToChoice` leaves a sleeping `HouseScene` | **in scope**: stop `SCENE_KEYS.house` in `backToChoice`, with a source guard (as `tests/roomVisitWiring.test.ts`) and, if cheap, an e2e path (choose base → room → „Baza” → notebook → „Wróć” → choose house → „Dom” shows the house) |
| first-building-choice 18 | `FIRST_ROOM` fallbacks in `HouseScene`, `RoomScene`, `TaskScene`, `SalonBackdrop`; trigger „a second building without a salon reaching a `FIRST_ROOM` fallback” | **in scope to check**: `HouseScene.render`/`RoomScene.currentRoomId` fall back to `FIRST_ROOM` (salon) and `HouseScene.geometry` to `house-1`; reached only with no `currentRoom`/house in the registry. Research confirms the base never reaches them; fix only if it does |
| first-building-choice 16 | `UIScene.create` `refreshHealth` after „Wróć” house → base | out of scope unless the plan touches `UIScene.create` room-loader wiring (trigger is that file) |
| first-building-choice 19 | HUD star counter with three digits | out of scope (trigger: `StarCounter`/`TASK_LAYOUT.starCounter`) |
| first-building-choice 11 / gap 198 | Hasło words come from the house in the base | out of scope (D7) |
| house-cross-section 19 | undecoded house picture leaves no console line | **fires** if `HouseScene.loadArt` changes (it will: per-building art); carry: decide in plan whether to add the `onProcessError` line now (cheap) or re-record |
| house-cross-section 20 | stand-in shell geometry inline in `HouseView.standInShell` | **fires** if `HouseView`/`HOUSE_LAYOUT` change (likely: closed-cell text style per building); plan decides whether to move the stand-in numbers into `HOUSE_LAYOUT` now |
| house-cross-section 21 | browser test for `houseButton` null while the celebration card is up | **fires** if `RoomScene.redraw` changes (it will: per-building label); in scope: the Mostek celebration is the natural place for that e2e assertion |
| house-cross-section 2, 4, 5, 9, 11 | no way back to a previous room, unreached room shown closed, no house „Obrazki” line, `drawRoomMiniature`, card wake | triggers not fired by this slice (playtest notes / `drawRoomMiniature` / „Obrazki” changes); carry unchanged |

## Autonomous decisions

- **D1 — orchestrator starting decision (scope.md): the base cross-section is data, like the house.** Chosen:
  `HOUSE_GEOMETRY['base-1']` from the manifest (cells, `liftShaft` → `stairwell`), a per-building art table replacing the
  flat `HOUSE_ART`, a per-building label for the zoom-out button and per-building closed-cell text/background style; the same
  `HouseScene`/`HouseView`/`houseCells` with no `if base` branch. Rejected: a separate `BaseScene` (duplicated scene, the risk
  the roadmap names; would drift before the street, S-26). Would change: research showing `HouseView` drawing differs beyond
  data (e.g. the airlock needs a different composition than the roller blind).
- **D2 — orchestrator starting decision (scope.md): art in scope through `npm run art`.** The base shell and airlock go to
  WebP through the house-art root of `scripts/make-task-art.mjs`, native size, no board recolour (not a room), loaded on the
  first open of the cross-section, precached and checked by the deploy smoke. Rejected: code-drawn shell (the pack exists, QA
  passed). Would change: the in-game visual gate failing the pack.
- **D3 — follow-up 17 in scope.** `TaskScene.backToChoice` stops the house scene too. Rejected: leaving it (the trigger is this
  slice, and a second building with a cross-section makes the stale geometry reachable). Would change: research showing
  `HouseScene` re-reads the house on every wake so a stale sleeper is harmless (then a source guard documents it instead).
- **D4 — roadmap unknown (FR-046: what the Mostek celebration shows while no next module exists); starting default for
  `/10x-plan`.** Chosen default: the existing room celebration (`celebrationView('room')`, `RoomDoneCard`, „Pokój gotowy!”)
  with the Mostek tile; „Dalej” closes the card and the child stays in Mostek with change mode and the „Baza” button (the
  closed cells in the cross-section are the „Wkrótce” promise, since `houseRoomList` lists no unknown room in `base-1` and so
  shows no teaser tile). Rejected: a new card or a „Moduł gotowy!” title (not in the kit, not asked by FR-046/FR-040 which
  reuse the one mechanism); adding a fake `hangar` entry to `base-1` to get a teaser tile now (S-30 adds Hangar as data, and a
  room the build does not know would ride in the save). Would change: the author's answer to the roadmap unknown, or the plan
  finding the teaser tile cheap and data-only (e.g. a building-level „more to come” flag).
- **D5 — follow-up 9: the manifest label is not game copy.** The game names the building only through `pl.ts` („Baza
  kosmiczna” on the card, „Baza” on the zoom-out button); `designs/` stays untouched and its „Baza księżycowa” is ignored.
  Rejected: renaming the card to „Baza księżycowa” (the maintainer's shape decision and PRD say „baza kosmiczna”). Would
  change: the maintainer choosing the moon base name.
- **D6 — no migration.** Save format stays v6 (see `## Migration`). Rejected: a v7 with a per-building view field (nothing to
  store: `visiting` is runtime, geometry is data). Would change: research finding a saved field the base needs.
- **D7 — Hasło words in the base (gap 198) stay out of scope.** FR-045/046/048 do not cover them and FR-050 asks rounds to be
  building-neutral; `MINIGAME_WORDS` stays one list. Rejected: per-building word lists now (touches `TaskScene.freshRound`
  inputs and the FR-050 guard `tests/freshRoundWiring.test.ts`). Would change: the maintainer asking for base words, or S-30
  touching the minigame inputs.
- **D8 — the back button copy in the base stays „Wróć do pokoju”.** A module is a room (scope.md), and FR-048 keeps „Do
  pokoju” for the HUD. Rejected: „Wróć do modułu” (new copy, not in the kit or PRD). Would change: a playtest note that the
  child does not connect „pokój” with Mostek.
