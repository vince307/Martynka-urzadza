# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 6 step: the variant panel shows the variants' pictures, the "Pokój gotowy!" miniature is built from the room's own pictures, and the task button no longer runs its label into the star (commit 9364408). The next agent must not get wrong:
the e2e part of phase 6 was NOT run (Chromium cannot start here), so rows 6.2 and 6.3 stay open for the orchestrator; the purchase pop in `RoomScene.celebrate` is still the old stand-in box (phase 7).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993`, phase 2 `bab7ad7`, phase 3 `200d188`, phase 4 `b6b0b77`, phase 5 `9f5a798`, phase 6 `9364408`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-5 done except `[human]` 2.5 and `[visual]` 4.7, 5.3, 5.4; phase 6: 6.1 ticked, 6.2 and 6.3 open (e2e), 6.4 `[visual]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/fitLabel.ts` + `tests/fitLabel.test.ts` | pure `labelRoom`/`labelScale`: a label shrinks so it ends at least `labelGap` before the star |
| `src/core/thumbFit.ts` + `tests/thumbFit.test.ts` | pure fit of a slot's visible rectangle into a thumbnail above the name strip |
| `src/ui/widgets/RoomTaskButton.ts` | uses `labelScale`; fixes "Odnów ściany i podłogę⭐ 5" (label touched the star: the room it shrank into ended exactly at the star's left edge) |
| `src/ui/widgets/VariantPanel.ts` | thumbnails are Images of the variant, cropped to `visibleRect` and scaled by `thumbFit`; stand-in box when the texture is missing; name at `thumbs.labelY` |
| `src/ui/widgets/RoomView.ts` | `miniaturePieces` (pure ordering, tested in `tests/roomMiniature.test.ts`) and `drawRoomMiniature(scene, g, ...)` returning the Images |
| `src/ui/widgets/RoomDoneCard.ts` | miniature from pictures (images destroyed with the captions); check mark and padlock numbers moved to `ROOM_DONE_LAYOUT.tiles.mark/lock` |
| `src/data/layout.ts` | `thumbs`: `minAspect` and `nameInset` gone, `labelY` 172; `taskButton.labelGap` 24 |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | typecheck pass; `eslint src tests` pass. `npm run lint` fails ONLY on the gitignored `tests/e2e/visual.local/room-change.spec.ts` (an unnecessary assertion, line 10; exists before this phase, not mine; delete it or fix it before the gate, it is also picked up by Playwright as 2 extra specs) |
| unit incl. deploy tests, sample E1-E6 | Tests 2939 passed (branch baseline 2930, +9: fitLabel 4, thumbFit 2, roomMiniature 3, layout test replaced one); deploy and ops OK; six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)`; `rg minAspect src` empty |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`). Expect 94 passed (phase 6 adds no spec; `room-change` uses `thumbTargets`, unchanged geometry). Row 5.1 ticked from the orchestrator note |
| Deliberate break | `labelGap: 0`: `tests/fitLabel.test.ts` red ("expected 1 to be less than 1", "expected 0 to be greater than or equal to 16"), restored. The plan's break (`thumbTargets` shifted by `labelY`, e2e `room-change` red) needs the browser: orchestrator. Meta-check: the unit break proves the button spacing rule only; thumbnail hit geometry is proved by e2e, appearance by the visual gate |

## 4. Next command

`/10x-implement final-art-salon phase 7`

## 5. Open

- ORCHESTRATOR: run `npx playwright test --workers=4` (expect 94 passed), do the `thumbTargets` break, tick 6.2 and 6.3.
- Visual 6.4 (and 4.7, 5.3, 5.4): panel for each of the 6 slots (the crop of the picture with `setCrop` + `setPosition` offset is unverified in a browser: if a thumbnail shows the wrong part of the picture, the position formula in `VariantPanel.show` is the place), change-mode panel, done card with the miniature and the "Wkrótce" tile, the task button with the long stage label and a gap before the star.
- `RoomScene.celebrate` pop is still the stand-in box (phase 7: `RoomView.objectOf`).
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough. design-gaps rows (stand-in room, room-art line) still for phase 9.

## 6. Autonomous decisions

1. The label-vs-star defect was fixed by a pure `labelScale` with a data gap (`labelGap` 24) rather than a text-ellipsis: the label stays whole and shrinks, as before for long labels.
2. `drawRoomMiniature` now takes the scene and returns Images (Graphics cannot draw pictures); a missing scene texture keeps the coloured stand-in backdrop, a missing furnishings/shadows overlay draws nothing, as in `RoomView`. Would change: the visual gate shows a thumbnail at the wrong depth.
3. `nameInset` replaced by `labelY` (172, same pixel as before); thumbnails use the object's visible part, so the furniture fills the square instead of the stand-in's minimum aspect.
4. Check mark and padlock numbers went to `ROOM_DONE_LAYOUT.tiles.mark/lock` (row 6.1 demands them in layout.ts only).
5. The gitignored `visual.local` lint error was left alone: not part of the repository.
