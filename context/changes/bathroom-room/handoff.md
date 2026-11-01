# Handoff — `bathroom-room` (slice S-31)

The impl-review step wrote this: the full plan (phases 1-6) is reviewed, verdict APPROVED, `MERGE: CLEAR`; one WARNING fixed in b1989b9. The next step is the visual gate (plan row 5.6, 14 frames at 1440 and 1024 into `reviews/visual-review.md`); do not tick the `[human]` or `(CI at ship)` rows there.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity … p1 `7c742b8`, p2 `32c2a5b`, p3 `69694ce`, p4 `8eab432`, p5 `a9a4ee5`, p6 `883a68b`, review fix `b1989b9`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 8: 3.8 and 5.12 `[reviewer] (CI at ship)`, 5.6 `[visual]`, 5.7-5.11 `[human]` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/bathroom-room/reviews/impl-review.md` | review report: plan-adherence table, F1 (fixed) + F2-F5 observations, Polish read, observed gate, `MERGE: CLEAR` |
| `tests/fixtureLoadPath.test.ts` | F1: the `save-v6-kitchen-done meets the children's room` title now says four cells (b1989b9) |
| `context/changes/bathroom-room/plan.md` | rows 2.5 and 3.7 `[reviewer]` ticked with evidence |
| `context/changes/bathroom-room/change.md` | status `impl_reviewed` |
| `context/changes/bathroom-room/follow-ups/review-fixes.md` | item 6 marked closed (spec committed 883a68b, break re-run red) |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (also after the fix) |
| `npm test` | 4233 passed = baseline 4215 + 18 (roomDoneLayout 7, `RoomDoneCard` wiring 1, roomsData 4, houseCells 2, fixtureLoadPath 2, roomHit 1, bootBudget per-room 1) |
| `bash deploy/test-martynka-deploy.sh` / `bash deploy/ops/test-martynka-ops.sh` | OK / OK |
| `npm run sample -- E1` … `E6` | all OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| full e2e | not run here (scope.md); orchestrator at b5a2a1e: 193 = 191 + 2, 180 passed + 13 load timeouts, 13/13 green on `--last-failed --workers=1` — inherited, unverified by this step |
| `npx playwright test tests/e2e/bathroom-room.spec.ts --workers=1` (sandbox off) | 2 passed (2.2 m) after restoring the break |
| Break `roomDoneCardRect` without `2 * spec.padding` | `tests/roomDoneLayout.test.ts` n=4, n=5 red; `tests/layout.test.ts` stayed green (F2: the pure test is the guard); restored |
| Break: `HOUSES['house-1']` bathroom row removed (phase-4 tdd RED) | 7 red in roomsData, houseCells, fixtureLoadPath; restored |
| Break: `RoomDoneCard.show` draws a fixed 1144 card (handoff break) | e2e #16 red on the `CARD_RIGHT_EDGE` border poll; restored; meta-check: the border, not the card face (within 2 of the cream), proves the width |
| Ports 4397/4398 after the run | none listening |

## 4. Next command

`visual gate (bathroom-room)`

## 5. Open

- `[visual]` 5.6: 14 frames (plan Phase 5 Manual) into `context/changes/bathroom-room/reviews/visual-review.md`.
- `[human]` checklist: 5.7 accept `roomDoneCardRect` / `RoomDoneCard.show` (card 1516 for four tiles); 5.8 costs 5 + 7/9/10/12/13/15 = 71; 5.9 wording (gap 205); 5.10 room (not house) celebration at the end of house 1; 5.11 real tablet offline.
- `[reviewer] (CI at ship)`: 3.8 Deploy job `deploy` step `Smoke check (deploy)` prints `144 of 144 room pictures precached`; 5.12 Deploy job `build` steps `Run npm test` (expected `Tests  4230 passed | 3 skipped (4233)` = 4212 + 18 with the same 3 CI skips) and `Run npm run build` (`e2e hook: absent (`).
- Observations F2-F5 in `reviews/impl-review.md` (no action). Follow-ups: `follow-ups/review-fixes.md` (items 1-3, 7-12 open with `Trigger:`).
- Archive: rewrite the CLAUDE.md follow-ups path to the archive folder.

## 6. Autonomous decisions

- Plan drift and quality read by the reviewer directly, not by two sub-agents as the skill suggests: the code diff is ~6 small files; sub-agents would add handoff loss for no coverage gain. Would change: a diff touching scenes or core beyond one helper.
- F1 fixed in place (cheap WARNING, test title only); F2-F5 recorded, not fixed (no behaviour risk). Would change: a later slice relying on the layout test to guard the padding.
- Triage prompt ("Triage now / later / Done") decided as triage now, in place; no `AskUserQuestion`. Would change: none.
- 5.12 expected CI count written as 4215 + 18 with the 3 CI skips; the ship step reads the actual line. Would change: a different skip set in CI.
