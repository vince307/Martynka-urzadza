# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-e2e kitchen-room phase 8` step of run 2026-10-30-rooms-kitchen (2026-10-31). All 8 phases are committed (8 = 779a306); `change.md` is `implemented`. The next agent must not get this wrong: **the full e2e run and the open [visual]/[human]/[reviewer] rows belong to the orchestrator and the maintainer; `currentRoom` is written only by "Dalej".**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room` |
| Commits | `3412b6e` (p1), `9deb86d` (p2), `f5f8904` (p3), `74d5aea` (p4), `18c0118` (p5), `0695012` (p6), `16e5d3b` (p7), `779a306` (p8: `test(kitchen-room): From the finished salon into the kitchen, e2e (p8)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows | 8.1, 8.3 ticked with sha; e2e clauses 1.4-7.5 ticked as the orchestrator's 170/170 note; 8.2 left (full-suite count is the orchestrator's); 4.5, 5.6-5.8, 7.6-7.10 left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/kitchen-room.spec.ts` | 4 tests (#2 move + reload, #16 kitchen purchases + card + change mode, reduced motion, #16 FR-019 visit) |
| `tests/e2e/support/hook.ts` | types only: `room.card.celebration`, `room.visiting`, `roomLoad`, `visitButton` |
| `playwright.config.ts` | `kitchen-room` added to `ROUND_SPEC` (webServer untouched) |
| `context/changes/kitchen-room/plan.md` | Progress rows ticked |

## 3. Verification

| command | result (observed) |
|---|---|
| `npx playwright test tests/e2e/kitchen-room.spec.ts --workers=1` | 4 passed (2.7m) |
| break: `return` before `nextRoom` in `moveAfterDone` (RoomScene), `-g "moves into the kitchen"` | red on `currentRoom` (Expected "kitchen", Received "salon"); restored |
| break: drop `registry.set(currentRoom, ...)`, same `-g` | red, Received "salon"; restored |
| break: `celebrationView` ignores `reducedMotion`, `-g "reduced motion"` | red, revealMs Expected 0, Received 1200; restored |
| break: `roomArtLoader.ensure` returns at once, `-g "moves into the kitchen"` | red, `roomLoad.settled` Received []; restored |
| break: drop `visiting = null` from the wake `refresh` only, `-g "finished salon opens"` | STAYED GREEN: `onSleep` also resets it; so the rule was broken in both `refresh` and `onSleep` -> red, Expected "kitchen", Received "salon"; restored |
| `git diff` after each restore | `git checkout --` of the file; `git status` showed only the three phase files |
| lint / typecheck / unit / build | OK / OK / 4055 passed / `e2e hook: absent (2 chunks checked)` |
| servers 4397/4398 | killed |

## 4. Next command

`/10x-impl-review kitchen-room`

## 5. Open

- Row 8.2 (full e2e count, orchestrator); manual rows 4.5 [visual]; 5.6/5.7 [reviewer]; 5.8 [human]; 7.6 [visual]; 7.7/7.8/7.9 [human]; 7.10 [reviewer] (CI at ship).
- The plan's break wording for the visit test ("drop `visiting = null` from the wake `refresh`") is not enough alone: the reset is duplicated in `onSleep`.
- Follow-ups: `context/changes/kitchen-room/follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** unchanged.
- **Phase 8 (driver e2e):** one spec of 4 tests, no skill checkpoint needed a user answer; commit message as proposed; stopped after the phase; `ROUND_SPEC` extended; hook support types extended (read-only, no production code). The break for the visit test was widened to both resets (`refresh` and `onSleep`) because the single one the plan names hits redundant code. Lessons file absent.
- Earlier phases: kitchen texture keys `kitchen/kitchen-<slot>-<look>`; `rooms-as-data` #10 oracle "opens in the kitchen"; visit button under the star counter because the bottom bar is full.
