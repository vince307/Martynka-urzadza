# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-tdd` phase 1: `src/core/placement.ts` and `src/data/placement.ts` exist and are green; phase 1 is committed. The next agent must not miss: e2e could not run in this session (MachPort), so the orchestrator must run `npx playwright test` on the phase-1 commit; the change adds no scene wiring, so no e2e change is expected.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + `d79ba20` (test p1) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; first phase of nine) |
| `## Progress` rows remaining | 44 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/placement.test.ts` | 71 tests; oracle = ZADANIA §1 table typed in the test (5 ages x 12 months), band boundaries, RangeErrors, child/parent flags, `needsPlacement` |
| `src/data/placement.ts` | `placementData` (ages 6–10, month bands, table), type `Band` |
| `src/core/placement.ts` | `SessionLearner`, `previousStage`, `proposeStage`, `placeByChild`, `placeByParent`, `needsPlacement` |
| `context/changes/first-launch-placement/plan.md` | Progress rows 1.1, 1.2 ticked |
| `context/changes/first-launch-placement/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs with wrong values) | `npx vitest run tests/placement.test.ts`: 53 failed, first `AssertionError: expected 'E1' to be 'E2'` (age 7, month 1) |
| GREEN | `tests/placement.test.ts` 71 passed |
| Break 1: January moved from autumn to spring band in `placementData` | 4 failed; restored (meta-check: oracle is in the test, not read from `placementData`) |
| Break 2: `placeByParent` `overridden = ... \|\| true` | 2 failed; restored |
| `npm run lint` / `npm run typecheck` | clean |
| `npm test` | 742 passed in 50 files (baseline 671 / 49, +71) |
| `npm run build` | ok, `e2e hook: absent` |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, all `MachPortRendezvous Permission denied`) |

## 4. Next command

`/10x-tdd first-launch-placement phase 2`

## 5. Open

- Row 1.3 left unticked: local gate green except e2e (orchestrator gate).
- `[reviewer]` row 1.4: teacher read of `placementData` vs ZADANIA §1 (`reviews/teacher-read.md`) not done here. Self-check: table rows match ZADANIA §1 (6: E1; 7: E1/E2/E2; 8: E3/E4/E4; 9: E5/E6/E6; 10: E6).
- `[human]` rows unchanged: 5.7, 6.5, 7.5–7.9.

## 6. Autonomous decisions

1. Stubs exporting wrong values first so RED is an assertion failure (prompt rule), then real implementation; phase kept `Driver: tdd` (no pre-existing implementation).
2. `proposeStage` also rejects non-integer age/month with RangeError (plan said outside `ages` / 0–11); a stricter reading of the same rule. Would change if a caller needs to pass fractions (none).
3. Row 1.3 not ticked because e2e was not observed green; no e2e change in this phase.
