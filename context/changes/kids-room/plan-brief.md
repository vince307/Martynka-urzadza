# Kids' room, the third room of house 1 — Plan Brief

> Full plan: `context/changes/kids-room/plan.md`
> Research: `context/changes/kids-room/research.md`

## What & Why

Roadmap S-25 (M-03, house-1 path; PRD FR-033, FR-035): after the kitchen, the child renovates the children's room —
three stages (clean up, paint the walls, renew the floor), each showing the next pack background, then six pieces with
3 variants (the bed in 3 forms). The room fills the `upper-left` cell of the house cross-section. The roadmap Risk is
whether "a room is data" still holds: it does for the room itself; the staged renovation needs one small generic rule.

## Starting Point

Rooms are data (`ROOMS`, `ROOM_SCENE_FILES`, `ROOM_PACKS`, `HOUSES`, `pl.room`), but every room has one before/after
pair and the background choice "`stagesDone > 0 ? after : before`" is copied in four places (`RoomView.render`,
`miniaturePieces`, `backdropMode`, `RoomScene.fadeStage`). The room-done card fits only two tiles.

## Desired End State

A finished kitchen leads ("Dalej" or a reload) into the children's room at stage 0; each stage purchase shows the next
background (with a cross-fade from the previous one); six pieces furnish it; its card shows three done rooms and "Dalej"
stays. The house shows it in `upper-left`. A saved finished kitchen loads into it; save stays v6.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Staged renovation | Three stage tasks with pack backgrounds (D1, option A: `scene` on a stage task) | Pack and roadmap S-32 define the kids room as the staged precedent; code bound held | Change / Research |
| Background rule | `sceneKey` = last done stage's `scene`, else `after` once staged, else `before`; `stageFade` pure | One rule instead of four copies; unit-tested | Plan |
| Room id, cell | `children`, `upper-left` (floor 1, place 0) | Pack ids; maintainer house layout | Change |
| Costs | 3/4/5 + 7/9/10/12/13/15 = 78 | Kitchen curve, cheap stages; S-17 tunes | Change / Plan |
| Card overflow | Tiles 320 wide, gap 40, every card | Layout data only, no scene code | Research / Plan |
| Landing proof | Frozen `save-v6-kitchen-done.json` + load-order mirror test | S-30 precedent, no e2e seam | Research / Plan |
| Wording | Imperatives and agreed variant forms ours (gap 202) | Pack gives nouns and masculine labels | Research / Plan |
| `children-before` | Not converted; `before` = `children-stage-0` | Pack `renovation.stages[0]` | Research |

## Scope

**In scope:** `sceneKey`/`stageFade`; the four sites and `roomArt` stage keys; `CHILDREN` data, 23 WebP, copy; the
`HOUSES` row; card tiles; fixture; docs, gaps 202-204, follow-ups; one e2e spec.

**Out of scope:** kitchen stages (S-32), bathroom (S-31), atlas, `HouseView`/`RoomDoneCard`/celebration code, save
format, worn/contact-shadow rules, thumbnails, e2e save seam.

## Architecture / Approach

Pure rule in `src/core/rooms.ts` → consumers (`RoomView`, `RoomScene.fadeStage`, `backdrop.ts`) and the art table
(`roomArt` emits stage keys, read from `room.tasks` because `src/data` cannot import core logic) → the room as data →
one house row. `HouseView`, the card and the backdrop follow automatically through `miniaturePieces`/`backdropMode`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Background rule (tdd) | `sceneKey`, `stageFade`, `scene?` on stage task, `backdropMode` | salon/kitchen behaviour must not move |
| 2. Wire the sites (impl) | RoomView, miniature, fadeStage, snapshot `stagesDone`, `roomArt` stage keys, wiring test | existing room-art snapshots byte-identical |
| 3. Room data and art (impl) | `CHILDREN`, 23 WebP, copy, snapshot (unreachable) | copy agreement; files/table drift |
| 4. Join house 1 (tdd) | `HOUSES` row, tiles 320/40, fixture, flipped unit + e2e | other specs pinning a two-room house |
| 5. Docs and sweep (impl) | CLAUDE.md, gaps, follow-ups, seam sweep, 13-frame visual pass, `[human]` rows | visual: subtle stage differences in miniatures |
| 6. Browser proof (e2e) | `kids-room.spec.ts`: staged backgrounds in the rendered frame, purchases, cell, reload | long purchase run under load |

**Prerequisites:** branch `feat/kids-room` at research; `cwebp`, Pillow 12.1.0 + numpy 2.4.3 for `npm run art`.
**Estimated effort:** 6 phase agents + review; e2e full suite ~10-45 min per gate.

## Open Risks & Assumptions

- D1 and the card change go beyond "data and art only" — `[human]` rows 5.7, 5.8 name them for the product owner.
- Stage differences may read weakly at miniature size; visual frame (11).
- Purchase-heavy e2e is load-sensitive (`--last-failed --workers=1`).

## Success Criteria (Summary)

- A child who finished the kitchen renovates the children's room stage by stage, seeing each new background, and furnishes it.
- House 1 shows three rooms; the card fits three tiles; saves land with nothing lost (v6).
- Existing rooms look and behave exactly as before.
