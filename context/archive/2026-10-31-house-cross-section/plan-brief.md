# House cross-section with floors; "Do pokoju" always to the room in renovation — Plan Brief

> Full plan: `context/changes/house-cross-section/plan.md`
> Research: `context/changes/house-cross-section/research.md`

## What & Why

Roadmap S-23 (PRD FR-038, FR-039, FR-033): the child chooses rooms in a side view of the house like a doll's house —
floors from data, each room a miniature as she left it, closed rooms as "Wkrótce" — while "Do pokoju" from the notebook
always reaches the room in renovation and the house is never a forced stop. It replaces the interim S-22 visit button.

## Starting Point

S-22 shipped salon + kitchen; `RoomScene` opens a done room through a runtime `visiting` and a visit button, and nulls
`visiting` on every sleep and wake (that reset is what keeps FR-039 today). `HOUSES` has floor/place per room but no
geometry; the designer's house pack (`designs/martynka-house-street-v1`, QA passed) gives the shell, the closed cell, the
frame and four 608×342 cells.

## Desired End State

A "Dom" button in the room opens a new `HouseScene`: the pack shell, the salon and kitchen captured live into their
cells, the upper cells closed with "Wkrótce", the room in renovation framed. A done room's cell opens it for free
changes; the current room's cell and "Wróć do pokoju" open the room in renovation; a closed cell does nothing. "Do
pokoju" from the notebook always opens the room in renovation. Save stays v5; boot unchanged.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Pack in scope | Pack shell as WebP via `npm run art`; code-drawn shell only as stand-in | The pack exists and passed QA | Scope (D1) |
| Hosting | New `HouseScene`, `scene.switch(room, { visit })` | Room sleeps for free; existing resets keep FR-039 | Research → Plan (P1) |
| `visiting` rule | Set only by pure `houseWakeVisit(data)` on the room's wake | Notebook path passes no data, so FR-039 holds by construction | Plan |
| Miniature | Per-cell `DynamicTexture` capture at (0,0) | Renderer-neutral clip; `drawRoomMiniature` untouched | Research → Plan (P2) |
| House art load | `HouseScene`'s own loader at first open, not boot, not `roomArtLoader` | Boot budget untouched; shared loader not refactored | Plan (P3) |
| Art health | `artFallbacks.house` record, no "Obrazki" line | Consistent with kitchen follow-up 2 | Research → Plan (P4) |
| Cell states | current / done / closed; a not-reached room is closed | FR-033 one room at a time; roller blind = "sylwetka" | Plan (P5, [human]) |
| Back | To the room in renovation | No runtime field that could leak into the notebook path | Plan (P6) |
| Copy / place | "Dom" under the star counter; "Wróć do pokoju" top-left | Button band 70 px < 96 touch minimum | Plan (P7, [human]) |
| Motion / voice | No transition, no narrator line in the house | Reduced motion by construction | Plan (P8) |
| Next-room choice | Data only | No second openable closed room in house 1 | Scope (D3) |
| Save / balance | v5, no field; no balance change | Nothing new persisted | Scope (D6, D7) |

## Scope

**In scope:** pure cell rules + geometry data; house art pipeline, table, deploy smoke; `HouseScene` + `HouseView` +
capture helper; "Dom" button and wake data in `RoomScene`; visit button removed; e2e hook house screen; moved tests;
SW `redundant` warning (kitchen follow-up 6); docs, gap rows 183+, follow-ups; e2e spec + Canvas case.

**Out of scope:** street and house 2, kids' room, house celebration/keepsake, child choice of next room, save field,
boot queue or loader changes, `roomArtLoader`/`drawRoomMiniature`/`SalonBackdrop` changes, "Obrazki" line, animations.

## Architecture / Approach

`src/core/houseCells.ts` (`houseCells`, `cellTap`, `houseWakeVisit`) over `HOUSE_GEOMETRY` (`src/data/houses.ts`).
`HouseScene` asks `roomArtLoader.ensure` for open rooms, captures each into `house-cell-<id>`, draws `HouseView`, and
switches back to `RoomScene` with `{ visit }` or no data. `RoomScene`'s wake sets `visiting` only through
`houseWakeVisit`; its sleep clears it.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. House cells and the wake rule (tdd) | Pure cell states, tap and wake rules + geometry data | Rule too permissive on wake data |
| 2. House art (impl) | 3 WebP, `HOUSE_ART`, smoke check, SW warning | Art script changing other outputs |
| 3. House scene and view (impl) | `HouseScene`, `HouseView`, capture helper, tokens, copy | Canvas capture of Graphics/filters |
| 4. Navigation, hook, moved tests (impl) | "Dom" button, wake data, visit button gone, hook house screen | First scene-data hand-off in the repo |
| 5. Docs, gaps, follow-ups, seam sweep, visual (impl) | Records + screenshot matrix | Leftover visit wording |
| 6. e2e (e2e) | FR-039/FR-038 spec + Canvas case | Load-sensitive e2e timing |

**Prerequisites:** S-22 shipped (yes); cwebp + python3 Pillow/numpy for `npm run art`; e2e outside the sandbox.
**Estimated effort:** six fresh-agent phases, one slice of the run.

## Open Risks & Assumptions

- Phaser wake data and Canvas capture are unproven in this repo; phase 4/6 prove them, with a recorded fallback.
- Runtime house art may flash the stand-in shell on the first open (precache makes it near-instant).
- Four `[human]` rows: roller blind as "sylwetki" + not-reached room closed; copy/placement; green board in a cream cell; tablet offline.

## Success Criteria (Summary)

- From the notebook "Do pokoju" always lands in the room in renovation, even right after a house visit (e2e).
- The house shows live miniatures, closed "Wkrótce" cells and the framed current room; taps behave per cell (e2e, visual).
- Save v5 and the boot budget unchanged; full local gate and e2e green.
