# Bathroom, the fourth room of house 1 — Plan Brief

> Full plan: `context/changes/bathroom-room/plan.md`
> Research: `context/changes/bathroom-room/research.md`

## What & Why

Roadmap S-31: a child who finished the children's room renovates the bathroom (walls and floor, then tub, sink and
mirror, towel shelf, rug, plant, toy shelf, 3 variants each) in the `upper-right` cell of the house-1 cross-section.
It is the second proof that "a room is data" and the first time house 1 has no next room. The maintainer put the
four-tile "Pokój gotowy!" card in scope: every house-1 card now lists four rooms, which overflow today's 1144 px card.

## Starting Point

House 1 has salon, kitchen and children's room as data (`src/data/rooms.ts`, `src/data/houses.ts`); the card draws tiles
of 340 px with a 32 gap in a fixed 1144 card (`RoomDoneCard.show`, `ROOM_DONE_LAYOUT`); the bathroom pack
`designs/martynka-bathroom-v1` is ready (one before/after pair, six slots, QA passed). Save format v6.

## Desired End State

After the children's room the card shows four tiles and "Dalej" opens the bathroom; after its last purchase the card
shows four done tiles and "Dalej" keeps the child there in change mode with "Dom"; the cross-section shows no "Wkrótce"
once the bathroom is reached. Two- and three-tile cards (base, older states) look exactly as before.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Four-tile card | Card width by tile count (`max(1144, n·340 + (n−1)·32 + 60)`), pure helper `roomDoneCardRect` in `src/core/roomDoneLayout.ts` | Accepted 2/3-tile cards stay pixel-identical, captions fit, testable without Phaser | Research (option A) / Plan P1 |
| Card data | `ROOM_DONE_LAYOUT.card` → `centerX`/`minWidth`/`padding`; `tiles.left` deleted | No stale fixed rectangle; closes kids-room follow-up 3 | Plan P2 |
| Renovation shape | One stage "Odnów ściany i podłogę", then six slots | The pack has one before/after pair | change.md D1 |
| Costs | 5 + 7/9/10/12/13/15 = 71 | Kitchen curve, every task 5-21; S-17 tunes | change.md D3 / Plan P3 |
| Captions | Pack labels ("regał z ręcznikami", "półka z zabawkami") over the roadmap's "szafka", "półka z kaczuszkami" | The pack is the design source | change.md D2 / Plan P4 |
| Last room | No teaser, "Dalej" stays, no closed cell | Hangar (S-30) precedent | change.md D5 |
| Celebration | 'room' intensity, not PRD FR-040 'house' | Roadmap S-24 owns the finished-house moment | Research R4 / Plan P5 |
| Save | v6 unchanged, frozen `save-v6-children-done.json` + load-order mirror test | Same move as S-22/S-25/S-30 | change.md D7 / Plan P6 |
| Browser proof of the fit | Rendered pixel inside the new card outside the old one; "Dom" hidden under the card | A hook rect from the same helper would only prove wiring | Plan P7, P9 |

## Scope

**In scope:** card rule + widget wiring; bathroom data, copy, 21 WebP through `npm run art`; the `HOUSES` row; frozen
fixture; flipped unit tests and four e2e specs; docs, gaps 204/205, follow-ups; one new e2e spec.

**Out of scope:** 'house' celebration (S-24), more stages, smaller tiles or two rows, hook card rect, e2e save seam,
atlas, `deploy/README.md` line, S-32/S-33 work.

## Architecture / Approach

Pure card rule (tdd) → `RoomDoneCard` reads it with existing cards unchanged (impl) → bathroom as unreachable data/art
(impl, temporary placement exemption) → the one `HOUSES` row with fixture and flipped tests (tdd) → docs/sweep/visual
(impl) → browser spec (e2e). The card change lands before the row, so no commit shows an overflowing card.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Card rule (tdd) | `roomDoneCardRect` with literal tests for 0-5 tiles | none — pure maths |
| 2. Card reads the rule (impl) | `RoomDoneCard.show` + `ROOM_DONE_LAYOUT.card`, layout test over n | an accepted card shifting by a pixel (identity test) |
| 3. Bathroom data/art (impl) | `BATHROOM`, copy, 21 WebP, snapshot, exemption | local `cwebp`/Python tools; copy wording |
| 4. Joins house 1 (tdd) | `HOUSES` row, fixture, unit + 4 e2e specs flipped | a spec flipped for an unlisted reason |
| 5. Docs, sweep, visual (impl) | CLAUDE.md, gaps, follow-ups, 14 frames × 2 widths | 1516 card legibility at 1024 |
| 6. E2E (e2e) | `bathroom-room.spec.ts`, #16 and #2 | long purchase run under load |

**Prerequisites:** S-25 shipped (#133); `cwebp`, Pillow 12.1.0, numpy 2.4.3 locally; the local `designs/` pack.
**Estimated effort:** 6 phase sessions; e2e full suite once by the orchestrator after phase 6 (expected 191 + 2).

## Open Risks & Assumptions

- `[human]` rows: the card code change outside data, costs 71, bathroom wording (gap 205), the 'room' celebration
  against PRD FR-040's literal text, a real-tablet offline check.
- A child who finished the children's room on an older build meets the bathroom without the announcing card.
- The phase-6 run buys 35 tasks across four rooms; load flakes are re-run with `--last-failed --workers=1`.

## Success Criteria (Summary)

- A child moves from the children's room into the bathroom and finishes it; the balance is exact; the house is complete.
- Every house-1 card shows four readable tiles inside the card; base cards are unchanged.
- Deploy smoke reports 144 of 144 room pictures precached.
