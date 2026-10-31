# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-impl-review kitchen-room` step of run 2026-10-30-rooms-kitchen (2026-10-31). Review verdict APPROVED after one fix commit (82b690c, runtime room-art loader); `MERGE: CLEAR`. The next agent must not get this wrong: **82b690c changed `src/ui/roomArtLoader.ts` after the orchestrator's last full e2e, so the room specs must be re-run at the gate.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` |
| Commits | p1-p8 `3412b6e`..`779a306`, phase-8 handoff `8ab15e2`, review fix `82b690c` (`fix(kitchen-room): poprawki z przeglądu implementacji`), review docs commit `docs(kitchen-room): przegląd implementacji` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows open | 8 (`grep -c '^- \[ \]' plan.md`): 4.5, 7.6 [visual]; 5.8, 7.7, 7.8, 7.9 [human]; 7.10 [reviewer] (CI at ship); 8.2 (full e2e count, orchestrator) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/roomArtLoader.ts` | fix: `attempted` (texture, keyed failure, or fetched without a texture = decode failure) settles a room and is what `ensure` passes to `roomsToLoad`; a failed key is not re-queued in the session |
| `tests/roomArtLoader.test.ts` | 2 new cases (decode failure settles with cause `decode`; a failed key is not queued again) and a `fetched` rig helper |
| `src/data/layout.ts`, `src/scenes/BootScene.ts` | stale comments (`REGISTRY_KEYS.roomArtHealth`, boot queue order) |
| `docs/design-gaps.md` | row 175 wording (actual imperatives, teacher read done) |
| `context/changes/kitchen-room/reviews/impl-review.md` | the review report (F1 CRITICAL fixed, F2 WARNING fixed, F3-F9 observations) |
| `context/changes/kitchen-room/follow-ups/review-fixes.md` | follow-ups 14-18 with `Trigger:` |
| `context/changes/kitchen-room/plan.md` | rows 5.6, 5.7 ticked |
| `context/changes/kitchen-room/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK (8ab15e2 and 82b690c) |
| `npm test` | 8ab15e2: 4055 = baseline 4014 + 41 (per-file delta in impl-review.md); 82b690c: 4057 = 4055 + 2 |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1..E6` | OK, OK, all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test tests/e2e/kitchen-room.spec.ts --workers=1` (82b690c) | 4 passed (2.8m) |
| RED of the fix | both new loader cases failed on the old code (`pending().size` expected 0, received 1), green after |
| Deliberate break re-executed: `flush('now')` moved before `registry.set(currentRoom)` in `RoomScene.moveAfterDone` | `celebrationWiring` order case red; restored from a copy, 8/8 green; meta-check: a source-order guard, the browser order is proven by the kitchen-room move + reload test |
| Leftover processes | none of mine (`ps -U`), ports 4397/4398 free |

## 4. Next command

Visual gate (`references/visual-gate.md`, hook build on 4399, desktop 1440 + tablet 1024): kitchen before the stage, after the stage, furnished, finished, the celebration card (salon tile + kitchen tile, and the kitchen's two-done-tiles card; plus reduced motion), the "Salon"/"Kuchnia" visit button (rows 4.5, 7.6) — then `/10x-archive kitchen-room`.

## 5. Open

- Orchestrator: re-run `tests/e2e/kitchen-room.spec.ts`, `rooms-as-data`, `salon-art`, `health-lines`, `room-change` (loader fix 82b690c), then the full e2e for row 8.2 (`<branch baseline> + 4`, total = `npx playwright test --list | tail -1`, 174).
- Manual rows: 4.5 / 7.6 [visual]; 5.8 S-17 kitchen costs, 7.7 accept the interim visit button, 7.8 green board vs cream margin, 7.9 offline tablet kitchen load [human]; 7.10 [reviewer] (CI at ship): job `check`, log `Tests +[0-9]+ passed` and `e2e hook: absent \(`.
- Follow-ups 14-18 (`createRoomArtLoader` `ensure` catch detach and repeated `once('complete')`; `RoomScene` `onSleep`/`refresh` dropping a card without `moveAfterDone`; `TaskScene` `onWake` backdrop; `ANIMATION.celebration` literal 22) in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged (save v5, kitchen from locations-v2, one celebration, one room in renovation, no balance change, boot budget measured).
- **Triage without questions (contract rule 1):** CRITICAL fixed, WARNING fixed when cheap, observations recorded. Skill continuation question answered "Done" (stop after this step).
- **F1 graded CRITICAL, not WARNING:** the failure path of the runtime load (focus risk 1) kept a room pending forever on a decode failure and looped fetch + redraw on a fetch failure; cheap, test-led fix. Rejected: retrying a failed key with a back-off (more state; boot does not retry either). Would change: a requirement that a transient runtime failure heals without a reload.
- **F3 (catch-path detach) deferred, not fixed:** no test rig for a throwing `load.image` and the path is practically unreachable. Would change: a report of "Room art could not be queued".
- **5.6 / 5.7 ticked:** teacher read and manifest geometry both pass (evidence in impl-review.md).
