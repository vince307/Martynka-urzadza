# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-impl-review` step of run 2026-10-16-audit-sweep. All 14 phases are reviewed: verdict NEEDS ATTENTION (warnings only) and `MERGE: CLEAR`, with one review fix committed (`03a597e`). The save format stays v4 and the frozen fixtures are untouched; the next agent must not change what is saved.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1-p14 + handoffs, then `03a597e` `fix(child-flow-guards): „OK” klocków nie działa, gdy klocek jest w ręce (poprawki po przeglądzie)`, then `docs(child-flow-guards): impl review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 11 (`grep -c '^- \[ \]' plan.md`): `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5; `[human]` 2.7, 5.7, 6.7, 9.5, 14.4; `[reviewer] (CI at ship)` 13.7 |
| Working tree | clean after the review commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/child-flow-guards/reviews/impl-review.md` | full-plan review report (phases 1-14), findings F1-F9, ends with `MERGE: CLEAR — …` |
| `src/scenes/TaskScene.ts` | F1 fix: in `create`, the `BlockMat` "OK" callback now asks `canSubmit(this.dragState)`, the same way the clock and the wallet already did |
| `tests/gestureWiring.test.ts` | an assertion that the block mat "OK" asks `canSubmit` (red before the fix, green after) |
| `context/changes/child-flow-guards/follow-ups/review-fixes.md` | 6 new entries (F2-F7), each with a `Trigger:` line; 18 entries and 18 triggers in total |
| `context/changes/child-flow-guards/plan.md` | `[reviewer]` rows ticked: 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 8.4, 9.4, 10.4, 11.4, 12.4, 13.6 |
| `context/changes/child-flow-guards/change.md` | `status: impl_reviewed` |

## 3. Verification

All of these were run and observed in this step.

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK (also after the fix) |
| `npm test` | `Tests 3416 passed` = baseline 3139 + 277. Still 3416 after the fix, because the new assertion went into an existing test |
| deploy scripts, `sample` E1-E6 | OK, OK; `Naruszenia: 0` for every stage |
| `npm run build` | `e2e hook: absent (2 chunks checked)` (before and after the fix) |
| `npx playwright test --workers=4` | `127 passed (10.5m)` = baseline 125 + 2, no flake |
| after the fix: the `child-flow-guards`, `drawn-tasks`, `money-pay` and `clock-set` specs | `14 passed` |
| same-seed `sample --count 6`, main (`git archive`) vs branch | E2, E4, E5, E6 identical. E1 differs only in the COMPARE_QTY tile order, E3 only in the HALF hint, both as the plan says |
| `git diff main...HEAD -- tests/fixtures src/core/save.ts` | empty; `SAVE_VERSION = 4` |
| hook bypass | none: no change under `.claude/`, no `--no-verify` |

Deliberate breaks re-executed in this step:
- **Phase 6 (tdd):** removed `pl.tasks.halfMethodHint` from `half.ts`. `tests/hints.test.ts` went red with `E3.10.half_30 seed 0: expected null to be '2 : 2 = 1'`. Restored.
- **Phase 14 (e2e, break b):** made `SolutionSteps.overflowed()` return `true`. `#11 WNA-04` went red with `Expected: false / Received: true`. Restored. Meta-check: this proves the measured flag reaches the hook; it does not prove that every skill fits.
- **F1 fix:** the new wiring assertion was red before the edit and green after.

No DB, no write endpoints and no external identifiers are in this slice. Servers 4397/4398 were stopped after Playwright; `lsof` showed no listener.

## 4. Next command

`visual gate (settings/progress preview, wallet line, COMPARE_QTY tiles, HALF hint) then /10x-archive child-flow-guards`

## 5. Open

**Visual rows** (each at 1440 and at 1024×768):
- 2.6: parent progress preview with a weak E5 skill while on E6.11.
- 3.6: progress preview with a wallet example and a shapes example.
- 5.6: wallet line in the bar of `?e2eSkills=E1.11.money_pay_10`.
- 6.6: COMPARE_QTY tile order, and the E3.10 HALF first hint.
- 10.5: PERIMETER composite and PUZZLE_GRID pyramid in the solution phase. Also judge F3 here: is the runtime cell floor still met under a long prompt (`belowPrompt` in `TaskScene.render`)?

**Human checklist:**
- 2.7: accept the 90/10 share on E6.11.
- 5.7: accept the wallet line wording (gap 124).
- 6.7: accept the COMPARE_QTY tile order (gap 125).
- 9.5: on a tablet, "OK" does nothing while a coin, block or clock hand is held.
- 14.4: answer the puzzle, close before "Dalej", reopen; there is no second ×2.

**Ship row:**
- 13.7 `[reviewer] (CI at ship)`: workflow `CI`, job `check`. The `npm test` step must print `Tests +[0-9]+ passed` and the `npm run build` step must print `e2e hook: absent ([0-9]+ chunks checked)`.

**Follow-ups** (in `follow-ups/review-fixes.md`):
- F2: `modeWidgets` is not yet the only mode switch in `TaskScene.render`.
- F3: the cell floor is checked only in tests (`drawingFit`).
- F4: `stepClockSet` keeps a hold through a lost `up` when mouse and touch are mixed.
- F5: a variant's clean-round bonus is lost on a close before "Dalej".
- F6: `artBlocked` 'ORDINAL' does not match the ICONS pool of `generateOrdinal`.
- F7: the `progressView` "began" rule.
- The 12 entries from phase 13 are unchanged.

**DESIGN-GAP rows:** 122-125, all present and matching the code comments.

## 6. Autonomous decisions

- **F1 fixed now rather than deferred.** It was a one-line guard plus a wiring assertion and matched the existing `canSubmit` doc. The rejected option was narrowing the comment. This would change if a reviewer wanted blocks to behave differently from coins and the clock.
- **F2 and F3 deferred to follow-ups, not fixed.** F2 is a scene refactor with no behaviour defect. F3 needs the visual gate to judge whether a runtime clamp is needed. This would change if the visual gate (10.5) shows cells under 36 px.
- **F4 rated WARNING, not CRITICAL.** Phaser 4.2.1 delivers one touch pointer, so on a tablet the same-pointer `down` restarts the grab and the child recovers. This would change on a device report of a stuck hand.
- **F5 accepted.** Counting the variant at its last answer is the intended SV2-10 fix, and losing the bonus is much smaller than paying the puzzle ×2 twice. This would change if the maintainer wants the bonus credited at the last answer.
- **Known deviations accepted:**
  - p10 has no `minScale` in the layout. `minCell` is read in one place and every skill passes `drawingFit` (F3).
  - p13 keeps a `forcedSkills` id from another stage as null, which parent-settings #14 needs. Unknown and unplayable ids throw.
  - p11 put its tests in existing files.
- **Report verdict NEEDS ATTENTION, merge CLEAR**: four warnings stay open (F2-F4 deferred with triggers, F5 accepted); warnings never block a merge under the contract. Would change: a CRITICAL found at the visual gate.
