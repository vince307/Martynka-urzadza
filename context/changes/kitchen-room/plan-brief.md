# Kitchen, the second room from data, with the parameterised room celebration — Plan Brief

> Full plan: `context/changes/kitchen-room/plan.md`
> Research: `context/changes/kitchen-room/research.md`

## What & Why

Roadmap S-22: after the salon the child sees one room-intensity celebration (FR-040) and moves to the kitchen, which she
furnishes like the salon (FR-033, US-02). It is the measure of F-04: the kitchen should be data and art; code changes
only where F-04 left named follow-ups (the move after "Dalej", the celebration, room-neutral copy, the boot budget).

## Starting Point

Rooms and the house are data and the save is v5 with a house (F-04). The done card lists the salon and a "Wkrótce"
teaser; "Dalej" redraws the same room; `nextRoom` runs only at load. The boot loads every room's art; adding the kitchen
would push the cold boot to 57.8 s against a 48 s budget.

## Desired End State

A boot loads the shared art plus ONE room (the one in renovation; worst case the salon, 41.8 s). The last salon purchase
plays a hold of the finished room, the card with a star burst, the cue and at most "Pokój gotowy!"; "Dalej" saves and
opens the kitchen (its art loaded at runtime from the precache, stand-ins until then). The kitchen has a stage and 6
pieces × 3 variants, costs 5–15 (sum 71); its own card shows two done tiles and its change mode works.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Boot budget | Boot loads the room in renovation; other visible rooms load at runtime | Fits 48 s for every room without raising `totalMs` and scales to later rooms | Research / Plan (K-1) |
| When other rooms load | At the last purchase, for every room on the card | The card is the first screen that needs them; the reveal hold buys time | Plan (K-2) |
| Runtime loader home | Session service on the HUD scene loader | Same pattern as the music loop, survives the room scene's sleep | Plan (K-3) |
| Celebration | `celebrationView(intensity, reducedMotion, table)` over the existing card; only `'room'` reachable | One mechanism (FR-040, scope.md), no invented house/street copy | scope.md / Plan (K-4, K-5) |
| Narrator line | Unchanged "Pokój gotowy!" | Room-neutral, no per-room gender agreement | Research / Plan |
| Salon change mode after the move | Unreachable until S-23 (against FR-019's literal text, `[human]` row) | FR-033/FR-040 forbid staying or a second button | Plan (K-6) |
| Kitchen content | Manifest slots only, no decor/worn/shadows/thumbnail; order counter → rack | Nothing invented; bench tucks under the counter | scope.md / Research |
| Kitchen costs | 5, 7, 9, 10, 12, 13, 15 (71) | Salon's first-seven ramp; S-17 tunes (`[human]`) | Plan (K-7) |
| Save format | Stays v5 | Everything derives from `rooms` + `house` | Research (D3) |

## Scope

**In scope:** pure celebration and room-load rules; boot of one room + per-room budget test; runtime room-art loader;
celebration card + "Dalej" → `nextRoom` + save; kitchen data, art (`npm run art`), copy, room-neutral parent lines;
docs, gap rows, follow-ups, visual pass; one e2e spec.

**Out of scope:** save v6, `totalMs` raise, atlas, kitchen thumbnail, cross-section/revisiting done rooms (S-23),
house/street celebration copy and keepsakes (S-23/S-24), recolouring the kitchen margin, SW warning and panel guard
follow-ups, any balance change but kitchen costs.

## Architecture / Approach

`bootRoomArt(currentRoom)` (data) feeds the boot queue and the budget test. `roomArtLoader` (UI service on the HUD loader,
in the registry) loads rooms with `roomsToLoad` (core), per-file timeout and keyed errors, records `roomLoad` and
refreshes `roomArtHealth` for the current room. `RoomScene` asks `celebrationView('room', …)` for the reveal/burst,
ensures the card's rooms at the last purchase and applies `nextRoom` on "Dalej" (registry writes, `flush('now')`, redraw).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Pure rules (tdd) | `celebrationView`, `cardRooms`/`roomsToLoad` | Oracles computed from the code |
| 2. Boot one room (impl) | `bootRoomArt`, per-room budget, scoped health | Budget test no longer matching the queue |
| 3. Runtime loader (tdd) | `roomArtLoader` on the HUD loader | Shared loader with the music |
| 4. Celebration + move (impl) | Card burst/hold, honest tiles, "Dalej" → `nextRoom` | Save order, reduced motion |
| 5. Kitchen data + art (impl) | 21 WebP, `KITCHEN`, copy, spec updates | Teaser-expecting specs, copy grammar |
| 6. Docs + sweep + visual (impl) | CLAUDE.md, gaps 175+, follow-ups, 7-state matrix | Stale salon-only text |
| 7. E2E (#2, #16) | `kitchen-room.spec.ts` (+3) | Long purchase flows under load |

**Prerequisites:** F-04 merged (942e237); local `designs/martynka-locations-v2`, `cwebp`.
**Estimated effort:** 7 phases, one fresh agent each; phase 5 is the largest (data + art + spec edits).

## Open Risks & Assumptions

- A cold link may show kitchen stand-ins for a few seconds after "Dalej" (accepted; visual gate checks it).
- The salon's change mode is gone until S-23 (`[human]` acceptance).
- Offline runtime load is proven by the precache check and a tablet check, not by an e2e.

## Success Criteria (Summary)

- A child finishes the salon, sees one celebration, taps "Dalej" and furnishes the kitchen; a reload keeps her there.
- Every boot stays under the 48 s budget with `totalMs` unchanged, proven per room by `tests/bootBudget.test.ts`.
- No screen shows a broken room while art loads; "Obrazki" reports only the current room.
