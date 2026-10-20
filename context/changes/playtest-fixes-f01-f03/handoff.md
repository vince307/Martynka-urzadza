# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-e2e` step, phase 9 (gear hint spec, risk #14), run 2026-10-20-playtest-boot. All nine phases are committed and `change.md` status is `implemented`; the orchestrator's full-suite rows and the manual rows stay open.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phases 1-8 as before, phase 9 spec c8cea1a, `Snapshot.settingsHint` type fix 70229d8, a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 9.2, 9.3, 8.2, 8.3, 7.3 (orchestrator), 7.4 [human], 7.5 [reviewer], 6.4 [visual], 6.5 [reviewer], 6.6 [human], 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer] |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/parent-settings.spec.ts` | existing #14 hold test asserts `settingsHint` true after the first tap; new test "the hint after a tap on the gear shows once per page load, and a hold still opens the gate afterwards" |
| `tests/e2e/support/hook.ts` | `Snapshot` type gains `settingsHint: boolean` (the hook already exposed it) |
| `context/changes/playtest-fixes-f01-f03/plan.md`, `change.md` | row 9.1 ticked, status implemented |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test --config=<abs> tests/e2e/parent-settings.spec.ts` | 5 passed (4 old + 1 new), twice |
| npm run lint / tsc --noEmit | OK / OK after 70229d8 (c8cea1a alone had a type error: `Snapshot` lacked `settingsHint`, fixed in a new commit) |
| deliberate break 1 | removed the `settingsHintShown` guard in `UIScene.showHintOnce`: new test red at "Expected: false, Received: true" after the second tap; restored |
| deliberate break 2 | moved `showHintOnce` from the `tap` branch to `fire` in `UIScene.feed`: extended hold test red at "Expected: true, Received: false" on the first tap; restored |
| meta-check | both breaks change the rule (once-per-load guard, tap vs hold trigger), not a label or selector |
| full e2e, full gate | not run here, orchestrator owns 9.2 and 9.3; ports 4397/4398 freed |

## 4. Next command

`/10x-impl-review playtest-fixes-f01-f03`

## 5. Open

- Rows 7.3, 8.2, 8.3, 9.2, 9.3 wait for the orchestrator's full e2e and gate (baseline + 1 + 1).
- Manual rows: 7.4 [human] PRD FR-009, 7.5 [reviewer], 6.4-6.6, 4.5-4.7, 1.6, 3.5.
- Follow-ups: `context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md`.

## 6. Autonomous decisions

- T-1..T-3, P4-1..P4-3, P5-1, P5-2, P6-1..P6-3, P7-1, P7-2, P8-1 stand.
- P9-1 Did not invoke the Skill tool; followed the phase plan directly. The hint-hides wait polls the hook with a 10 s timeout (hintMs is 3000), no fixed sleep.
- P9-2 c8cea1a was committed before lint/tsc finished (chained with `;`), so the type fix went in a new commit 70229d8 rather than an amend.
