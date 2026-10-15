# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-implement` phase 7 step: the purchase pop now grows the real picture, the stage purchase cross-fades the neglected background, and the task-scene shake respects "ogranicz ruch" (commit 82240ec). The next agent must not get wrong: the e2e part of phase 7 was NOT run (Chromium cannot start here), so rows 7.2 and 7.3 stay open for the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-6 `d5d6993`, `bab7ad7`, `200d188`, `b6b0b77`, `9f5a798`, `9364408`; phase 7 `82240ec`, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phases 1-6 done except `[human]` 2.5 and `[visual]` 4.7, 5.3, 5.4, 6.4; phase 7: 7.1 ticked, 7.2 and 7.3 open (e2e), 7.4 `[visual]` open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/RoomScene.ts` | `celebrate` pops `RoomView.objectOf(slot)` (scale tween around the anchor, restored on complete; no stand-in box any more); new `fadeStage` cross-fades `scene.before` and `furnishingsBefore` ghosts out over the new background; card delay = max(pop, stage fade) unless reduced motion |
| `src/data/layout.ts` | `ANIMATION.stageFadeMs` 600 |
| `src/scenes/TaskScene.ts` | `shake` returns at once under `prefersReducedMotion()` |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | both pass |
| unit incl. deploy tests, sample E1-E6 | `npm test` pass (no tests added or removed: branch baseline 2939, delta 0; the change is Phaser scene code), deploy and ops OK, six samples exit 0 |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium: every test failed at launch). Expect 94 passed |
| Deliberate break | not done (needs the browser): plan 7.3 sets delay 0 for the done card at full motion and runs `room-change`; record the result and the meta-check (if green, `ROOM_DONE_LAYOUT.button` protects, not the delay) |

## 4. Next command

`/10x-implement final-art-salon phase 8`

## 5. Open

- ORCHESTRATOR: run `npx playwright test --workers=4` (expect 94 passed), do the 7.3 break, tick 7.2 and 7.3.
- Visual 7.4 (and 4.7, 5.3, 5.4, 6.4): frames of the stage fade, the sofa pop (rug must not jump), particles from the visible centre; same purchase with reduced motion shows none. The scale-around-anchor pop relies on the image origin set by `RoomLayer` (anchor / size).
- Human checklist: `[human]` 2.5 remap rule B; `[human]` 10.4 iPad playthrough. design-gaps rows (stand-in room, room-art line, no in-between backgrounds P3.6) still for phase 9.

## 6. Autonomous decisions

1. The stage fade uses ghost images of the old background and old furnishings fading out above the freshly rendered new room (no change to `RoomView.render`). Would change: the visual gate shows the old decoration popping at the wrong depth.
2. If a slot has no picture (stand-in), the pop is skipped (the stand-in box is the layer itself); particles still burst. Would change: the maintainer wants the stand-in to pop too.
3. Card delay at full motion is the longer of pop and stage fade; the last purchase is always a slot, so in practice the pop time.
