# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-implement` step, phase 6 ("Wróć" scene glue, F-02 b), run 2026-10-20-playtest-boot.
Phase 6 committed (33772b7); local gate green; e2e (rows 5.4, 6.3) left to the orchestrator. `backToAge` must never call advance/finishRound/countRound/applyRound.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phases 1-5 (49a682f, e6b1d9c, 9f0cb7c, 27227e3, 6bd7c17), phase 6 `feat(playtest-fixes-f01-f03): "Wróć" on the warm-up and the first round (p6)` 33772b7, a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.4, 6.3 (e2e, orchestrator), 6.4 [visual], 6.5 [reviewer], 6.6 [human], 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer]; phases 7-9 open |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/TaskScene.ts` | `ageBack` PageButton, `renderAgeBack` (called first in `render`), `backToAge` (cleanup, learner null, flush, stop UI and Room, start welcome), `targets.ageBack` |
| `src/data/layout.ts`, `src/data/pl.ts` | `TASK_LAYOUT.ageBack` (16, 880, 148x96, left margin), `TASK_TOUCH_TARGETS.ageBack`, `pl.round.ageBack` |
| `docs/design-gaps.md` | row 152 |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `targets.ageBack` (hidden in the room) |
| `tests/layout.test.ts` | margin/touch-size case for `ageBack` |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck / npm test | OK / OK / 3682 passed (phase 5 3681, +1) |
| deploy scripts, sample E1-E6, build | OK, `e2e hook: absent (2 chunks checked)` |
| deliberate break | `ageBack` height 80: `keeps every touch target at least the minimum size` red (`ageBack height: expected 80 to be greater than or equal to 96`); meta: caught by the generic TASK_TOUCH_TARGETS loop, restored, green |
| `backToAge` body | no advance/finishRound/countRound/applyRound (grep over the method) |
| e2e | not run (orchestrator) |

## 4. Next command

Phase 7 (`Driver: impl`): `/10x-implement playtest-fixes-f01-f03 phase 7`

## 5. Open

- Rows 5.4, 6.3 wait for the orchestrator's e2e (`139 + 0`).
- Manual rows: 6.4 [visual], 6.5 [reviewer], 6.6 [human], 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer].
- Not visually checked: "Wróć" overlap with answer tiles/keypad (button sits at x 16-164, notebook starts at 180) and that the welcome after "Wróć" shows no HUD (UIScene stopped explicitly).

## 6. Autonomous decisions

- T-1..T-3, P4-1..P4-3, P5-1, P5-2 stand.
- P6-1 Did not invoke the Skill tool; followed the phase plan directly. Box 148x96 at left 16, top 880 (margin 0-180, above the caption); label uses the default pageButton font (46 px), no smaller style needed. Rejected: a new text style.
- P6-2 `renderAgeBack` runs at the top of `render` so it also covers the warm-up summary and mid-task; `learner`/`variants` undefined or null hide it.
- P6-3 `scene.stop(room)` called unconditionally (safe on a stopped scene). Stopped after phase 6.
