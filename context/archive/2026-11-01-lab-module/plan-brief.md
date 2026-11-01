# Laboratorium, the base's third module, with the base's own frame — Plan Brief

> Full plan: `context/changes/lab-module/plan.md`
> Research: `context/changes/lab-module/research.md`

## What & Why

Roadmap S-33 (PRD FR-046, FR-045, FR-035): a child with the space base, after the Hangar, renovates the Laboratorium
(walls and floor, then six pieces in three variants) in the base's upper-left cell, and the module in renovation wears the
base's own mint frame instead of the house frame. Third proof that "a module is a room": data and art.

## Starting Point

The base has Mostek and Hangar (`HOUSES['base-1']`); the Hangar is the last module (two-tile card, "Dalej" stays). The
cross-section frames the current module with the house's butter `cell-frame` (gap 199). The v3 pack has the Laboratorium
(21 PNGs, manifest with slot literals); the v5 pack has `base-1-cell-frame.png` with identical geometry.

## Desired End State

Every base card shows three tiles; "Dalej" after the Hangar opens the Laboratorium; the Laboratorium is the last module
(three done tiles, no teaser, change mode with "Baza"). The base cross-section shows the mint frame; house 1 keeps the
butter one. A finished-Hangar v7 save opens in the Laboratorium. Smoke: 167 room pictures, 6 house pictures.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Costs | 6/10/13/14/17/19/21 = 100, manifest order | Mostek/Hangar ladder; S-17 tunes → `[human]` | change.md D1 |
| Cell | `upper-left` (floor 1, place 0) | v3 README and three-module screenshot | change.md D2 |
| Teaser | None on any base card | `houseRoomList` teases only unknown rooms; a `cabins` row before S-34 would leak into saves → `[human]` (against the roadmap Risk text, not the PRD) | change.md D3 / Plan P8 |
| Frame | Data key + `HOUSE_ART` row + art-script row with per-row pack | Pack delivers the art; `HouseView` unchanged | change.md D4 |
| Save | v7 unchanged; frozen hand-written `save-v7-hangar-done.json` | No per-room field missing; fixture round-trip proves the load | change.md D6 / research R2 |
| Task labels | "Postaw …", "Powieś tablicę magnetyczną" | Board is wall-mounted; wording ours (gap 208) → `[human]` | Plan P1 |
| Phasing | Room unreachable → joins base → frame → docs → e2e | Small green phases; placement exemption bridges p1→p2 | Plan P2, P3 |
| e2e frame proof | Rendered pixel at (244,407): mint, not butter | Texture reads missed a covered cell before (profile § 8) | Plan P5 |

## Scope

**In scope:** `LAB` data, copy, 21 WebP; `HOUSES` row; frozen fixture; flipped unit tests and Hangar e2e #16; base frame
(WebP, `HOUSE_ART`, `cellFrame`); CLAUDE.md sentence, gaps 196/199/208, follow-ups; one e2e spec.

**Out of scope:** S-34 cabins/teaser; v5 crew/life layers (S-35); base stand-in shell (gap 200); save format; loader
comment; `roomArtCheck`; recolour-script retirement; thumbnails.

## Architecture / Approach

Data on existing mechanisms: `RoomDef` + `ROOMS` + `ROOM_SCENE_FILES` + `pl.room.*` + a `ROOM_PACKS` row, then one
`HOUSES` row that switches it on; the frame is a per-geometry key read by an unchanged `HouseView`. Non-data: the art
script (`SPACE_BASE_V3`, `SPACE_BASE_V5`, `BASE_FILES` pack), tests, one doc comment in `HouseScene.art`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Room data and art (impl) | `LAB`, copy, 21 WebP, snapshot, placement exemption | Copy agreement; `npm run art` tooling |
| 2. Joins the base (tdd) | `HOUSES` row, fixture, flipped unit tests, Hangar #16 | Hidden "Hangar is last" pins |
| 3. Base frame (impl) | v5 frame WebP, `HOUSE_ART`, `cellFrame` | Touching house 1's frame |
| 4. Docs and sweep (impl) | CLAUDE.md, gaps, follow-ups, seam sweep, visual pass (11 frames × 2 widths) | Stale "Hangar is last" wording |
| 5. Browser (e2e) | `lab-module.spec.ts`: frame pixel + three modules bought | Load-sensitive 21-buy run |

**Prerequisites:** branch `feat/lab-module` at `63fb504`; local `cwebp`, Pillow 12.1.0 + numpy 2.4.3; packs v3 and v5 in `designs/`.
**Estimated effort:** 5 phase sessions plus the orchestrator's single full e2e run (expected 196 + 2).

## Open Risks & Assumptions

- Mint frame may read weakly on the base shell (visual frames 8-9, tablet `[human]`).
- A child who finished the Hangar on an older build meets the Laboratorium without its card (carried follow-up).
- Purchase-heavy e2e under machine load: judged with `--last-failed --workers=1`.

## Success Criteria (Summary)

- A base child goes Mostek → Hangar → Laboratorium with three-tile cards and an exact balance (unit + browser).
- The rendered base frame is mint; house 1's stays butter.
- A saved finished Hangar opens in the Laboratorium with nothing lost; deploy smoke counts 167 room and 6 house pictures.
