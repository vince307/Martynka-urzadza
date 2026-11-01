# Hangar with the rocket, the second module of the base — Plan Brief

> Full plan: `context/changes/hangar-module/plan.md`
> Research: `context/changes/hangar-module/research.md`

## What & Why

Roadmap S-30 (PRD FR-047): a child with the space base, after Mostek, renovates the Hangar with the rocket (walls and
floor, then rocket, rover, workbench, crates, lamp and mat, 3 variants each), and the base cross-section shows it in its
second cell. The roadmap Risk is the point: if the Hangar needs code outside data and art, S-28/S-29 broke the "a module
is a room" contract. The plan touches only `src/data/`, the art script, generated WebP files and tests.

## Starting Point

`HOUSES['base-1']` lists only Mostek; its `ground-right` cell exists and is drawn as a closed airlock. A room is a
`RoomDef` + `ROOMS` entry + `ROOM_SCENE_FILES` row + Polish copy + a `ROOM_PACKS` row in `scripts/make-task-art.mjs`;
precache, deploy smoke, "Obrazki" and the boot budget derive from `ROOMS`. "Dalej" and the load path pick the next room
from the data house (`nextRoom`). Three tests pin the base as one room.

## Desired End State

21 Hangar WebP files from `bystrow-space-base-v2`; `HANGAR` (costs 6-21 = 100) with agreed Polish copy; the Hangar row in
`ground-right`. After Mostek the card shows two tiles and "Dalej" opens the Hangar; after the Hangar "Dalej" stays in it
with change mode and "Baza"; a saved finished Mostek opens in the Hangar. Smoke: 100 of 100 room pictures. Save v6.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Costs | 6/10/13/14/17/19/21 = 100, rocket first | Same curve as Mostek (FR-044 "about 100"); `[human]` 3.7 | change.md D1 |
| Cell | `ground-right` (floor 0, place 1) | Pack README places the Hangar at (1060,636) | change.md D2 |
| Last module | Existing card, two tiles, no teaser, "Dalej" stays | No third module exists; gap 196 moves to the Hangar | change.md D3 |
| Save | v6 unchanged, frozen `save-v6-bridge-done.json` added | Room list is data (S-22 precedent) | change.md D4 / Research |
| Copy | Pack captions, agreed variant forms, imperative tasks | Teacher read; gap 201; `[human]` 3.8 | D5 / Plan P1 |
| Back-compat proof | Frozen fixture + load-order mirror test, no e2e seam | A seam would add product code | Research R4 / Plan P2 |
| Phasing | Room unreachable first, then one `HOUSES` row | Each phase green; the e2e flip is one edit | Plan P3 |
| Old S-29 e2e | Edited ("Dalej" moves to the Hangar), not deleted | Keeps the card-hides-"Baza" proof | Plan P4 |
| `balance.loader` comment | Untouched | Salon stays the worst boot; data-only diff | Plan P5 |

## Scope

**In scope:** art script row + 21 WebP; `HANGAR`, `ROOMS`, `ROOM_SCENE_FILES`, Polish copy; the `HOUSES` row; test edits
and a frozen fixture; gaps 196/201, follow-ups, CLAUDE.md; seam sweep (duplicate v1 pack constants); visual pass; one
e2e spec.

**Out of scope:** any change in scenes, core, UI, `main.ts`, hook; a third module or teaser; an e2e save seam; balance;
`roomArtCheck` wiring (follow-up); Hangar thumbnail; save migration.

## Architecture / Approach

Pure data path: `ROOMS` + `HOUSES` + `ROOM_SCENE_FILES` + `pl.room` drive the card, "Dalej", the cross-section, art
loading, the budget and the smoke. Phase 1 adds the room (unreachable), phase 2 the house row that switches it on.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Room as data, copy, art (impl) | 21 WebP, `HANGAR`, scene files, copy, art/data tests | `npm run art` needs cwebp + pinned Pillow/numpy |
| 2. Hangar joins the base (tdd) | `HOUSES` row, flipped flow tests, frozen fixture, S-29 e2e #16 edit | Mirror test does not run `main.ts` |
| 3. Docs, gaps, follow-ups, sweep, visual (impl) | CLAUDE.md, gaps 196/201, follow-ups, 8 frames × 2 widths | Hangar miniature legibility in the cell |
| 4. Browser spec (e2e) | 2 tests: two-module cross-section, Hangar bought to the end | 14 purchases, load-sensitive |

**Prerequisites:** S-29 shipped (main `a4a0aee`); `cwebp`, Python with Pillow 12.1.0 + numpy 2.4.3 for phases 1 and 3.
**Estimated effort:** ~4 agent sessions, one per phase; unit 4185 + N, e2e 187 → 189.

## Open Risks & Assumptions

- The author owns the Hangar prices (`[human]` 3.7) and may want a teaser or a module card (`[human]` 3.8).
- A child who finished Mostek before S-30 meets the Hangar at the next start without a celebration (S-22 precedent).
- Purchase-heavy e2e runs may time out under load; judged with `--last-failed --workers=1`.

## Success Criteria (Summary)

- After Mostek "Dalej" opens the Hangar; the cross-section shows Mostek done and the Hangar framed in the second cell.
- After the Hangar the card shows two done tiles, no teaser; "Dalej" stays; the balance is exact.
- No file in `src/scenes`, `src/core`, `src/ui`, `src/main.ts`, `src/testing` changed; save stays v6.
