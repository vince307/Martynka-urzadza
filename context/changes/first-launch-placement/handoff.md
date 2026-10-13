# Handoff — `first-launch-placement` (slice S-06)

Written by the `/10x-impl-review` step (full plan, phases 1–9). The verdict is APPROVED with no critical findings. Fix commit `a6f091b` changes code after `3320b20`: `stagePanel` aria ids, how `parentGate` builds the ⌫ key, and comments. Change.md is `impl_reviewed`. The next agent must not miss this: this session could not launch Chromium, so the orchestrator re-runs `npx playwright test` on `a6f091b` before the visual gate and ship (expected 14 passed).

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | p1 `d79ba20` … p9 `3320b20`, review fix `a6f091b`, plus docs/handoff commits; the last is `docs(first-launch-placement): impl-review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 10: `[visual]` 4.7, 5.6, 6.4; `[human]` 5.7, 6.5, 7.5–7.9 |
| Working tree | clean after the impl-review commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/first-launch-placement/reviews/impl-review.md` | review report: 9 findings, 0 critical; ends with the MERGE line |
| `context/changes/first-launch-placement/reviews/teacher-read.md` | teacher reads for rows 1.4, 2.5, 4.6 and 5.5, all PASS |
| `src/ui/dom/stagePanel.ts` | `group` ids are now `parent-panel-age`/`parent-panel-stage`; they used to contain spaces (F1) |
| `src/ui/dom/parentGate.ts` | the ⌫ button gets its `aria-label` directly instead of through `keys.children[9]` (F4) |
| `src/testing/e2eHook.ts`, `tests/e2e/narrator.spec.ts`, `CLAUDE.md` | stale comments and docs fixed (F3) |
| `context/changes/first-launch-placement/follow-ups/review-fixes.md` | adds F2 (e2e helper duplication, Trigger: S-08), F5 (core → data type import, Trigger: S-07) and F6 (dialog keydown propagation, Trigger: first Phaser keyboard input) |
| `context/changes/first-launch-placement/plan.md` | rows 1.4, 2.5, 4.6, 5.5 and 7.4 ticked |
| `context/changes/first-launch-placement/change.md` | status `impl_reviewed` |

## 3. Verification

All of the following were observed in this step, on `3320b20` and again on `a6f091b`.

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | exit 0 |
| `npm test` | 53 files, 765 passed (main baseline 671, +94) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | `Naruszenia: 0` each |
| `npm run sample -- E1 … E6 --warmup` | E1 "bez rozgrzewki"; E2–E6 6 tasks each, `Naruszenia: 0` |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rl e2eMonth dist/` and `grep -rl __martynkaE2E dist/` both empty |
| `grep -rn defaultStage src/ tests/ scripts/` | empty |
| `npx playwright test`, one plain run | Chromium did not launch (MachPort): 4 failed / 10 did not run, all launch errors. E2E evidence is inherited from the orchestrator: 14/14 on `3320b20` (baseline 8 + 6), with the breaks recorded in `context/runs/2026-10-12-s04-s08/e2e-request-s06-p8.md` and `-p9.md`. **Not re-run on `a6f091b`: the orchestrator runs it.** Servers on 4397 and 4398 were killed. |
| Deliberate break (TDD p2) | `warmupResult` with `<=` instead of `<` made `tests/warmup.test.ts` fail 2 (`E2 first=4: expected 'E1' to be 'E2'`), as in handoff p2. Restored: 11 passed. Meta-check: the test reads real outcomes against the threshold, so the break proves the threshold edge and not a fixture. |
| Hooks | `.claude/settings.json` and `.claude/hooks/*` were not modified in the slice; no `--no-verify` |

## 4. Next command

visual gate (orchestrator), then /10x-archive first-launch-placement and ship

## 5. Open

- **The orchestrator re-runs e2e on `a6f091b`** (`npx playwright test`, expected 14 passed). No spec selects by the changed ids, and the order of the digit keys is unchanged.
- `[visual]` 4.7, 5.6, 6.4 cover the welcome screen, the gate (before and after a wrong answer), the panel in 3 states, the warm-up with 6 dots, the summary with 6 stars, and the round after the warm-up, at 1440×900 and 1024×768.
- `[human]` checklist:
  - 5.7: on an iPad, use the gate and the panel with a finger and check that no touch reaches the welcome screen underneath.
  - 6.5: on an iPad, check that the first E1/E2 task is read aloud automatically.
  - 7.5: the child starts alone; parent confirmation is optional.
  - 7.6: PRD OQ1, no warm-up after a parent override.
  - 7.7: warm-up composition 3 + 3, threshold < 4 of 6.
  - 7.8: until S-11 the welcome screen appears at every cold start.
  - 7.9: gate range 13–19 × 13–19.
- Follow-ups are in `follow-ups/review-fixes.md`: risk #12 for the test plan, the `mountInstallHint` touch leak, S-11, S-08, S-14, an earlier learner save, a duplicate warm-up prompt (S-07), the warm-up bonus (S-17), parent-path speech (S-17), plus the new F2 (S-08), F5 (S-07) and F6.
- Recorded and accepted (no follow-up): F7 `AgeButton` duplicates `PageButton`'s tap logic; F8 design-gap row 21 has no code comment.

## 6. Autonomous decisions

Earlier steps (kept):
1. Bare numbers: only the three named in the S-05 follow-up were tokenised; the other house-icon coordinates in `RoomSwitchButton.draw` stay.
2. Gap rows 20 and 21 were added as the plan lists them. Row 21 has no code comment.
3. AGENTS.md was kept under 400 words.
4. Phase 8: the E2 drop uses 3 wrong first tries. Helpers were duplicated in the spec, as the other specs do. The spec was committed after the orchestrator's run.
5. Phase 8 finish: the spec was committed as is.
6. Phase 9 finish: the spec was committed as is; change.md was set to `implemented`.

This step:
7. **Warnings fixed in place, not deferred**: F1, the aria ids (a real accessibility defect, two-line fix), and F3, the stale docs. Rejected: deferring them, because they are cheap and the code change does not touch anything a spec selects. Would change the answer: if a spec selected the group by name or id, I would have deferred the change to avoid an unverified e2e change.
8. **F2 (e2e helper duplication) deferred** to S-08. Rejected: refactoring four specs now, because Chromium cannot run in this session and the change would be unverified e2e code right before ship. Would change the answer: a session that can run Playwright.
9. **Row 7.4 ticked** although the e2e helpers stay duplicated. The production code has no duplicates, and the test-code duplication was a deliberate earlier decision (4) now queued as F2. Rejected: leaving 7.4 open, because nothing in production code fails the sweep. Would change the answer: the maintainer counts test-helper duplication as a seam-sweep failure.
10. **MERGE: CLEAR, conditional on the orchestrator's e2e re-run on `a6f091b`.** Rejected: BLOCKED, because there are no critical findings and every other suite is green as observed in this step. Would change the answer: a red e2e run on `a6f091b`.
11. The `a6f091b` commit message says "JSDoc nad installE2EHook", but the header actually stays at the top of the module, separated by a blank line. It was not amended (the contract forbids amending); the discrepancy is noted in the report under F3.
