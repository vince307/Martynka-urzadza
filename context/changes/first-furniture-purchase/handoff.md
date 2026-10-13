# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-implement first-furniture-purchase phase 4` (autonomous run 2026-10-13-s09-s11). Phase 4 (one balance in the registry) is committed `314a2a7`; rows 4.3 and 4.4 are the orchestrator's gate (Chromium dies with MachPort here). Row 3.3 now cites the orchestrator run on `2e7d539`.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | docs commits, `d792eee` p1, `59c9253` p2, `94873fd` p3, `314a2a7` feat(p4), then this `docs(first-furniture-purchase): handoff p4` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/TaskScene.ts` | `sessionStars` gone; `syncStars` is the only writer of `REGISTRY_KEYS.stars` (`earn(balance, starsEarned - before)`); `starBalance()`, `nextRoomTaskCost()` (summary), `flyingStars` + `endFlyingStars()` called in the `toRoom` handler; flight skipped under `prefersReducedMotion()`; `snapshot().stars` |
| `src/ui/motion.ts`, `tests/motion.test.ts` | `prefersReducedMotion(win?)`; 5 tests |
| `src/data/layout.ts`, `src/main.ts` | `REGISTRY_KEYS.rooms` / `currentRoom`; `preBoot` sets `stars: 0`, `rooms: {salon: emptyRoomState()}`, `currentRoom: 'salon'` |
| `tests/e2e/support/hook.ts` | `Snapshot.stars` |
| `context/runs/2026-10-13-s09-s11/e2e-break-s09-p4.patch` | the deliberate break for row 4.4 |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 1032 passed (baseline 1027 at p3, +5 motion) |
| `npm run build` | OK, `e2e hook: absent` |
| `grep sessionStars src` | empty; `REGISTRY_KEYS.stars` in TaskScene only in `syncStars` and `starBalance` |
| `npx playwright test` | not runnable in this session (MachPort: 7 failed on browser launch, 16 not run) — orchestrator gate |

Orchestrator, row 4.3: `npx playwright test` on `314a2a7`, expect 23 passed (`starsTotal` assertions unchanged).
Orchestrator, row 4.4: `git apply context/runs/2026-10-13-s09-s11/e2e-break-s09-p4.patch` (syncStars adds `state.starsEarned` instead of the delta), then `npx playwright test tests/e2e/task-round.spec.ts`; expect red on the `starsTotal` / counter assertion from the second answer on (double counting); then `git checkout -- src/scenes/TaskScene.ts`. Unit tests do not catch it (scene seam), which is the point.

## 4. Next command

Phase 5 has `Driver: impl`:

`/10x-implement first-furniture-purchase phase 5`

## 5. Open

- Rows 4.3, 4.4 (orchestrator gate); 4.6 `[visual]` (summary with / without highlighted "Do pokoju", 1440x900 and 1024x768; `nextRoomTaskCost` is now live: salon task 1 costs 5).
- Earlier: `[reviewer]` 2.5, 6.4, 7.5; `[human]` 7.6-7.10; `[visual]` 5.5, 6.5, 6.6; phase 8 needs Chromium.
- Follow-up S-05 (flying star on "Do pokoju") done in this phase; the HUD button follow-up stays open.

## 6. Autonomous decisions

- No AskUserQuestion; implemented in this context; committed the planned set only.
- `starBalance()` reads the registry for `starsTotal` and the summary: the counter equals the balance, so the existing `starsTotal` assertions should stay unchanged.
- Mismatch (minor): `rooms` and `currentRoom` keys added to `REGISTRY_KEYS` in `layout.ts`, per plan item 1.
- Break for 4.4 delivered as a patch, not run (no Chromium). Would change: orchestrator finds the spec stays green, then pick another break (e.g. `earn` ignoring the delta).
