# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 5 step: the room is now drawn from the art pack's pictures (commit 9f5a798). The next agent must not get wrong:
the e2e part of phase 5 was NOT run (Chromium cannot start here), so row 5.1 stays open for the orchestrator, and the purchase pop in `RoomScene.celebrate` is still the old stand-in box (phase 7 moves it onto `RoomView.objectOf`).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993`, phase 2 `bab7ad7`, phase 3 `200d188`, phase 4 `b6b0b77`, phase 5 `9f5a798`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-4 done except `[human]` 2.5 and `[visual]` 4.7; phase 5: 5.2 ticked, 5.1 open (e2e part), 5.3 and 5.4 `[visual]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/RoomLayer.ts` | one room picture (scene layer, decor, variant): Image with origin at `anchor`, stand-in box + caption when the texture is missing (nothing for a scene layer); `object()` gives the Image |
| `src/ui/widgets/RoomView.ts` | `render` composes layers by depth: `scene` (before/after), `furnishings-before` until the stage, shadows when the room is done, decor after the stage, bought slots by `z`; coloured backdrop only when the scene texture is missing; `objectOf(slotId)` |
| `src/scenes/RoomScene.ts` | `alphaAt` from `textures.getPixelAlpha` (null when the texture is missing), passed to `slotAt` on pointer `down` only and to `holdPoint` in `slotTargets` |
| `src/data/layout.ts` | `ROOM_LAYOUT.depth` += `scene 0`, `furnishingsBefore 1`, `shadows 4` |
| `tests/e2e/room-change.spec.ts` | `overThumb` moved to x = third of the second thumbnail's width * 0.85 (740, 844): the rug is a diamond, (670, 844) is a transparent corner now |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | pass / pass |
| unit incl. deploy tests, sample E1-E6 | Tests 2930 passed (branch baseline 2930, +0; no new unit test: the phase is canvas code); deploy and ops scripts OK; six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`, 4 room specs failed to launch). Baseline 94 (orchestrator note for phase 4); phase 5 adds no spec, edits `room-change`. Row 4.5 ticked from the orchestrator note |
| Ad-hoc check (script outside the repo, real WebP alpha) | `holdPoint` finds a point for all 6 slots with every slot bought (sofa 1054,293; rug 808,477; coffee-table 939,611; cabinet 609,262; armchair 364,590; wall-frames 1091,51); `slotAt` at the new `overThumb` with sofa and rug bought returns `rug`; the old point (670, 844) is alpha 0 on the rug |
| Deliberate break | `RoomView` always uses `scene.before`: unit suite stays green (2930), as the plan says; only the visual gate (5.3) or the e2e `stageDone` snapshot with a pixel check can see it. Restored (`grep backgroundKey` shows the original line) |

## 4. Next command

`/10x-implement final-art-salon phase 6`

## 5. Open

- ORCHESTRATOR: run `npx playwright test --workers=4` (expect 94 passed; `room-change` changed its `overThumb` point); then tick 5.1.
- Visual rows 5.3, 5.4 (and 4.7): states listed in the plan; `?e2eArt=room` must show stand-ins plus the coloured backdrop.
- `RoomScene.celebrate` pop still draws a stand-in box over the real art (phase 7: `RoomView.objectOf`); `drawRoomMiniature` still stand-ins (phase 6 card).
- Shadows are drawn at depth 4 (above the architecture, below the wall frames z 5 and the rug z 10), only for a finished room; if the visual gate dislikes it, change `ROOM_LAYOUT.depth.shadows`.
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough. Docs: design-gaps rows for the stand-in room and the room-art line still to be added in the phase 9 sweep.

## 6. Autonomous decisions

1. Shadows at depth 4 (not on top of the furniture): they are a floor and window-light overlay made for the empty room, so the furniture must cover them. Would change: the visual gate shows furniture floating without a shadow.
2. The coloured backdrop stays as the fallback only when the scene texture of the moment is missing; a missing furnishings or shadows layer draws nothing (no stand-in for a full-scene overlay).
3. `celebrate` left untouched (phase 7 owns the pop); `overThumb` in the spec moved instead of the geometry, because the real rug art decides what is opaque.
4. Row 4.5 ticked citing the orchestrator note; 5.1 left open for the same reason as before. Row 5.2 text carries no sha (a commit cannot cite itself without an amend).
