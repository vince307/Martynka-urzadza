# Handoff — `kids-room` (slice S-25)

Written by the `/10x-research kids-room` step of run 2026-11-01-kids-room. Research is complete and no product code
has changed. The next agent must not miss two things:

- D1 (three staged backgrounds) stands, and its code is bounded to 6 non-test files around one pure `sceneKey` helper.
- A new finding: the "Pokój gotowy!" card overflows with three tiles (`ROOM_DONE_LAYOUT.tiles`). The plan must fix
  it in layout data and in `tests/layout.test.ts`.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 2 (`docs(kids-room): change identity (autonomous run)`, `docs(kids-room): research`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kids-room/research.md` | research: D1 footprint module by module, boot budget measured, stage-0 compare, save landing + fixture pattern + rollback, house cell, copy sources, NEW room-done card overflow |
| `context/changes/kids-room/change.md` | frontmatter only: status `new` → `preparing` (metadata guard) |
| `context/changes/kids-room/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/kids-room` |
| numpy RGBA compare `children-before.png` vs `children-stage-0.png` (read-only, `designs/` untouched) | alpha diff 0; RGB differs: 20.5 % of opaque pixels > 32, max 244. Not the same picture. `before` = worn room with furniture baked in, `stage-0` = empty neglected room |
| `cwebp -q 85 -alpha_q 100 -m 6` (the art script's flags) on the 24 kids-room PNGs into the scratchpad | D1 boot set 862 160 B (stage-0/1/2, after, shadows + 18 furniture); fallback set 661 640 B |
| `ls -l public/assets/rooms/<room>/*.webp` sums | salon 1 203 384 B (worst case, passes `tests/bootBudget.test.ts` today), kitchen 797 758, bridge 699 124, hangar 606 452 |
| `cmp children-shadows.png kitchen-shadows.png` | byte-identical, fully transparent |
| Pillow width of "Pokój dziecięcy" at 36 px, weight 650 (`MartynkaNext.ttf`) | 258 px |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main `bfdf193` inherited from the contract, unverified) |

## 4. Next command

`/10x-plan kids-room`

## 5. Open

- **D1 code (for the product owner, outside room data):**
  - `src/core/types.ts`: an optional `scene` on the stage `RoomTaskDef`;
  - `src/core/rooms.ts`: new `sceneKey`;
  - `src/ui/widgets/RoomView.ts`: `RoomView.render` and `miniaturePieces`;
  - `src/core/backdrop.ts`: `backdropMode`;
  - `src/scenes/RoomScene.ts`: `fadeStage` ghosts the previous `sceneKey`, plus an optional `snapshot.stagesDone`;
  - `src/data/roomArt.ts`: `roomArt` emits the stage keys;
  - tests: `tests/roomArt.test.ts` (helper-based scene keys, snapshot `room-art-children.json`) and
    `tests/rooms.test.ts` (multi-stage case).
- **Room-done card overflow (for the product owner):** `ROOM_DONE_LAYOUT.tiles` in `src/data/layout.ts` is 440 + 60
  gap, so 3 tiles take 1440 against `card.width` 1144.
  - The fix is about width 320 with gap 40.
  - `tests/layout.test.ts` must check the longest `HOUSES` room list.
  - Follow-up with Trigger S-31: 4 tiles need a fitted caption (`RoomDoneCard.caption`) or a wider card.
- **Frozen fixture:** `tests/fixtures/save-v6-kitchen-done.json` + a test in `tests/fixtureLoadPath.test.ts` modelled
  on "save-v6-bridge-done meets the Hangar". Expected: rooms `['salon','kitchen','children']`, `currentRoom`
  `children`.
- **DESIGN-GAP rows to add (after 201):**
  - kids-room wording: stage imperatives, slot tasks, gender-agreed variants;
  - the staged miniature/cell rule (latest stage reached);
  - the narrowed `fadeStage` gap (brief P3.6);
  - the room-done card with 3 tiles.
- **Teacher read of the new copy:** plan/impl-review.
- **Follow-ups:**
  - The kitchen-room follow-up 5 (atlas) fires: measured, not needed. Record it in this change's
    `follow-ups/review-fixes.md`.
  - The house-cross-section 13 / rooms-as-data 11 follow-ups (kids room id) close with `children` at `upper-left`.
  - House-cross-section 21 does not fire.
  - Hangar 5 holds if stage keys come through `roomArt`.

## 6. Autonomous decisions

- `[human]` **D1 confirmed:** three stage tasks with the pack backgrounds, option A (the stage task names the scene it
  reveals).
  - Rejected: option B (a `stages` list on `RoomDef.scene`), which spreads a second shape through `roomArt.test`.
  - Rejected: the one-stage fallback, which ignores two pack pictures and leaves S-32 no precedent.
  - Why: the footprint stays inside D1's bound. The save, the celebration rules and `HouseView` are unchanged, and
    `stagesDone` and `stepPanel` already handle N stages.
  - What would change it: the plan finding `fadeStage` or `roomArt.test` needing a structural rewrite, or the
    maintainer preferring data-only. Then fall back to `children-before` → `children-after`.
- **`wornPieces`, `contactShadowPieces`, `shownVariant` and the `RoomView` shadow/decor gate keep `stagesDone > 0`.**
  - Why: the kids room has no worn pieces, contact shadows, decor or `shownBeforePurchase`, and its shadows file is
    transparent. The salon is unchanged.
  - What would change it: S-32 giving the kitchen worn pieces that should stay until the last stage.
- **`children-before` is not converted under D1** (`before` = `children-stage-0`, per the manifest's
  `renovation.stages[0]`). What would change it: the fallback.
- **No atlas.** The kids set (862 KB) is below the salon (1.20 MB, today's worst case). What would change it: the
  plan's `npm run art` output exceeding the salon or failing `tests/bootBudget.test.ts`.
- **Variant names follow caption gender, not the pack's masculine labels** (kitchen and hangar precedent, gap 201).
  The bed keeps the pack's form labels. What would change it: a designer label list.
- **The room-done overflow is fixed in layout data** (not a count-dependent tile width in `RoomDoneCard`).
  - Why: it is the smallest change and keeps the scene code untouched.
  - What would change it: the visual gate showing captions clipped at the chosen width. Then fit captions with
    `labelScale`.
- **No `deploy/README.md` rollback line.** A build without `children` keeps every room and only resets `currentRoom`
  to `salon`. What would change it: the plan changing the save shape.
