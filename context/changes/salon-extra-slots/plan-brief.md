# Five new salon slots (S-16d) — Plan Brief

> Full plan: `context/changes/salon-extra-slots/plan.md`
> Research: `context/changes/salon-extra-slots/research.md`

## What & Why

The child furnishes five more places in the salon (curtains, wall shelf, lamp, left plant, pouf), three looks each, from
the pack `designs/martynka-salon-v2`. The author decided (2026-10-15) to append the tasks at the end of the task list so
every saved room keeps its meaning and the save format stays v3; lamp, plant and pouf keep their old look until the child
"Wymień …" them; finished salons get the new tasks and "Pokój gotowy!" again.

## Starting Point

The salon has 6 slots, 4 fixed decoration pictures (lamp, two plants, pouf) and 7 tasks (71 stars). A slot is drawn only
once bought; hit testing and the e2e hold targets assume every piece starts inside the scene; table tests pin 7 tasks,
non-decreasing costs, 26 room pictures and every piece inside the scene.

## Desired End State

11 slots and 12 tasks (`hang-curtains` 8, `hang-shelf` 10, `swap-lamp` 12, `swap-plant` 13, `swap-pouf` 15; total 129). After
the renovation stage the old lamp, plant and pouf stand in the room as variant 0 until bought; the window is bare until the
curtains are bought; the architecture pictures are curtain-less. Curtains (which reach above the scene) can be held for a
free change. A salon finished with 7 tasks continues at the curtains and shows the done card at the 12th purchase.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Costs of the five tasks | 8, 10, 12, 13, 15 `[human]` | The author's "8–15" read as a ramp in the stated order. | Research / Plan |
| Boot total limit | 45 s → 50 s `[human]` | The queue grows to ≈ 2.33 MB ≈ 46.6 s at 50 KB/s. | Plan |
| Finished salons | Reopen until task 12 `[human]` | Author decision; no "card seen" flag without v4. | Change / Plan |
| Pinned tests | "never fall" and "inside the scene" changed on purpose `[human]` | The author's data contradicts two agent-chosen invariants. | Research / Plan |
| Default look model | `SlotDef.shownBeforePurchase` + `shownVariant` in core | One rule for the room and its miniature, tested in vitest. | Research |
| Hold target | `holdPoint` clipped to the scene | Curtains box starts at y −54, off the canvas. | Research |
| Shadows depth | 4 → 2 | Pack order puts shadows under every slot (curtains z 3). | Research |
| Slot ids | Pack ids (`curtains` reuses an old v2 key, pinned safe) | The v2 step runs only for version < 3. | Change |
| Done-salon e2e | Buy 7 + reload, no new seam | Same bytes as a salon finished under S-16c. | Plan |
| Hook | `RoomSnapshot.shown` from the drawn layers | A render break must change what the e2e reads. | Plan |
| M-6 | Precache room-art count in `check:deploy` | Fires now, cheap, under `scripts/`. | Research |

## Scope

**In scope:** core rule and hold clip; room, miniature and hook wiring; salon data, copy, art conversion and table tests;
boot limit; deploy-smoke room count; CLAUDE.md and follow-ups; three e2e phases (risks #16, #2 / FR-019).

**Out of scope:** save v4 or migrations; new e2e seams; texture atlas; `VariantPanel` changes (VO1), hold outline (VO3),
per-layer hook state (L-7), minigame words, SW install warning (P-6), cost tuning (S-17).

## Architecture / Approach

Pure rule in `src/core/rooms.ts` (`shownVariant`) and `src/core/roomHit.ts` (`holdPoint`) → `RoomView.render` /
`miniaturePieces` / `RoomScene.snapshot` call it → data in `src/data/rooms.ts` + `pl.ts` + WebP from `npm run art` →
`SALON_ART` derives the new files → boot, precache and "Obrazki" follow automatically.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Core rule (tdd) | `shownVariant`, `holdPoint` inside the scene | Clip must keep the edge margin |
| 2. Wiring (impl) | Room, miniature, hook `shown`, shadows depth 2 | Must not change today's look |
| 3. Salon content (tdd) | 11 slots, 12 tasks, copy, 12 WebP, tests changed on purpose | Big phase; e2e specs grow to 12 purchases |
| 4. Deploy smoke (tdd) | `roomArtCheck` in `check:deploy` | Only proven in production by the Deploy job |
| 5. Docs (impl) | CLAUDE.md, follow-ups with triggers | Seam sweep |
| 6. e2e #16 | Default look + five purchases by touch | 180 s spec limits |
| 7. e2e #2 / FR-019 | Finished salon reopens, card at 12 | Reload waits (30 s polls) |
| 8. e2e #16 | Curtains held from the top band | Fractional canvas scale |

**Prerequisites:** branch `feat/salon-extra-slots`; the local pack `designs/martynka-salon-v2` and `cwebp` for phase 3;
the orchestrator runs Chromium for every e2e gate.
**Estimated effort:** ~8 agent sessions (one per phase) plus orchestrator e2e runs.

## Open Risks & Assumptions

- An old finished salon loses its shadows, mode button and teaser until task 12 (author-accepted; visual gate shows it).
- "Wymień" offers variant 0 = the look already shown (allowed; S-17 follow-up).
- Cold start ≈ 46.6 s at 50 KB/s sits close to the 50 s cut; past it the game starts on stand-ins.

## Success Criteria (Summary)

- The child buys curtains, shelf, lamp, plant and pouf in that order, each with a panel, each costing its stars once.
- A salon finished before the update keeps every piece, continues at the curtains and celebrates again at the 12th task.
- Save stays v3, frozen fixtures and migration tables untouched, full gate and e2e green.
