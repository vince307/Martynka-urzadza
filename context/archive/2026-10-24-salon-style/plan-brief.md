# Salon before state in the house clay style — Plan Brief

> Full plan: `context/changes/salon-style/plan.md`
> Research: `context/changes/salon-style/research.md`

## What & Why

The salon's before state is one painted "worn" picture in a gouache/storybook technique, while everything bought after
it is smooth glossy clay; a purchase reads as "the style changed", not "the room was renewed". The maintainer asked to
fix it in code and in the art conversion script, without new art (run scope items 1-8).

## Starting Point

`RoomView.render` draws `architecture-before` + `furnishings-before` until the background stage, then the renovated
room; the fixed decoration floats without shadows until the room is done; both backgrounds carry a saturated green board;
`npm run art` only shells out to cwebp.

## Desired End State

A fresh salon shows the after furniture faded and matte (soft furnishings greyer) on the worn background with its floor
shadows; the stage cross-fades into the renovated room where lamp, plants and pouf stand on soft contact shadows; the
board is a pale leaf green; the backdrops behind the notebook and the welcome follow. Save, costs, slots and hit areas
are unchanged.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Worn look | after pieces v0 + grade E (−30 % sat, sepia 0.20, br 0.90, contrast 0.90, lift +4) | A left the sofa cyan; E reads faded and matte | Research |
| Orchestrator concern | extra grade on sofa, rug, armchair, pouf (−35 %, sepia 0.10, br 0.95) | montage m13: clearly larger purchase step; no vase-less table variant exists (m12) | Plan |
| Dust overlay | none | speckles read as polka dots, stains as spots | Research |
| Grade mechanics | per-image ColorMatrix via one helper `applyWornGrade` | one path for room, stage ghost and backdrop; z order kept | Plan |
| Board | `#BCD799` via pinned Python (Pillow 12.1.0 + numpy 2.4.3) in `npm run art` | keeps the lit gradient and a clean rim, deterministic | Research |
| Turquoise nudge | not done | dulls the sofa whose vividness carries "renewed" | Research |
| Contact shadows | code ellipses under lamp, plants, pouf from stage to done | crops of `shadows` touch neighbours | Research |
| `furnishings-before` | deleted (−289 KB, ≈ 6 s boot headroom) | no longer drawn | Research |

## Scope

**In scope:** pure grade and piece rules, room/ghost/backdrop drawing, file removal, board recolour step, gap rows
169-172, inventory, CLAUDE.md, follow-ups, one e2e spec.

**Out of scope:** new art, turquoise nudge, dust overlay, thumbnail/loading art, other rooms, save/logic/balance/text.

## Architecture / Approach

Data (`SALON.worn`, `SALON.contactShadows`, `ROOM_LAYOUT.worn/contactShadow`) → pure core (`gradeMatrix`,
`wornPieces`, `contactShadowPieces`) → one UI helper (`applyWornGrade`) used by `RoomView`, `RoomScene.fadeStage` and
`drawRoomMiniature` (→ `SalonBackdrop`); the hook reports `room.worn`, `room.contactShadows`, `backdrop.graded`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Worn grade and piece rules (tdd) | pure rules + data, literal oracles | matrix order |
| 2. Room draws worn set and contact shadows (impl) | before/after room, ghost, F1 | depth order, WebGL vs prototype |
| 3. Miniature, backdrop, removal (impl) | graded backdrops, file gone, #15 retarget | nested filters in the backdrop capture |
| 4. Board recolour (impl) | pinned Python step, two webps | determinism |
| 5. Docs, follow-ups, sweep (impl) | gaps, inventory, CLAUDE.md, manual rows | stale counts |
| 6. e2e (#16, #12) | `salon-style.spec.ts`, 4 tests | load flakes |

**Prerequisites:** local `designs/` packs, `cwebp`, `python3` with Pillow 12.1.0 + numpy 2.4.3 (present on this machine).
**Estimated effort:** six fresh-agent phases, one visual gate.

## Open Risks & Assumptions

- The graded room may still read as "faded new", not "old": `[human]` 5.6 accepts it or asks the author for a before picture.
- WebGL output vs the Pillow prototype; the visual gate decides, numbers live in data.

## Success Criteria (Summary)

- The first purchase visibly renews a piece in the same style; the after room's fixed pieces are grounded.
- Unit `baseline + N`, e2e `160 + 4`, `npm run art` byte-stable, save v4 untouched.
