# Handoff — `lab-module` (slice S-33)

Written by the `/10x-impl-review` step of run 2026-11-01-bathroom-polish-lab: full-plan review APPROVED, `MERGE: CLEAR`, two warnings fixed in `7c8b9a5`. The one thing not to get wrong: rows 1.7 and 4.7 are ticked on the source strings; the visual gate (row 4.6) still owes every frame (1)-(11) in `reviews/visual-review.md`.

## 1. State

| | |
|---|---|
| branch | `feat/lab-module`, cut from `main` at `60472aa` |
| commits | `b255848`..this handoff commit; phases `947e665` (p1), `e9e6ae2` (p2), `48e67df` (p3), `88004b6` (p4), `be81f83` (p5), epilogue `0f4d052`, review fix `7c8b9a5`, then `docs(lab-module): impl review` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows remaining | 8 of 35: 4.6 [visual]; 1.8, 3.7, 4.12 [reviewer] (CI at ship); 4.8-4.11 [human] |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/lab-module/reviews/impl-review.md` | full-plan review (phases 1-5), APPROVED, F1-F5, ends `MERGE: CLEAR — …` |
| `tests/houseArt.test.ts` | comment above `CAPS`: measured base weight 97 776 B (F2, `7c8b9a5`) |
| `context/changes/lab-module/follow-ups/review-fixes.md` | item 8 trigger restored to the original house-1-polish 2 wording (F1, `7c8b9a5`) |
| `context/changes/lab-module/plan.md` | rows 1.7 and 4.7 ticked (`7c8b9a5 (impl-review)`) |
| `context/changes/lab-module/change.md` | `status: impl_reviewed` |
| `context/changes/lab-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (on `0f4d052` and again after `7c8b9a5`) |
| `npm test` | `Tests  4263 passed (4263)` = baseline 4254 + 9 (p1 +5, p2 +4); same after the fix |
| deploy + ops shell tests, `npm run sample -- E1`…`E6` | OK, exit 0 each |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` (both runs) |
| e2e full (orchestrator, not this step) | 198 = 196 + 2; 174 passed + 15 timeouts + 9 not run at `--workers=4`, `--last-failed --workers=1` 24/24 — inherited from the orchestrator, not re-run (scope.md) |
| `npx playwright test tests/e2e/lab-module.spec.ts --workers=1` (sandbox disabled) | 2 passed (1.6 m) |
| break: lab row removed from `HOUSES['base-1']`, vitest roomsData + houseCells + fixtureLoadPath | 6 failed, the same 6 assertions as the phase-2 RED evidence; restored, green |
| break: `HOUSE_GEOMETRY['base-1'].cellFrame` = `'house/cell-frame'`, `lab-module.spec.ts -g "#2"` | RED at the rendered mint-pixel poll (`Expected: true Received: false`); restored, both tests green |
| `git diff 60472aa -- tests/fixtures src/core/save.ts src/core/migrations` | only two added fixtures (`room-art-lab.json`, `save-v7-hangar-done.json`); save format v7 |
| servers | none left (`lsof` 4397/4398 empty, no `playwright`/`vite` in `ps -U $(id -u)`) |

Meta-check: the e2e break proves the rendered frame differs between base and house art at (244,407); the unit break proves the `HOUSES` row drives cell state, card list, flow and the fixture load.

## 4. Next command

`visual gate (lab-module)`

## 5. Open

- [visual] 4.6: frames (1)-(11) at 1440 and 1024 in `context/changes/lab-module/reviews/visual-review.md` (hook build on 4399).
- [reviewer] (CI at ship) 1.8 (`deploy` / `Smoke check (deploy)`: `167 of 167 room pictures`), 3.7 (`6 of 6 house pictures`, `precache served: 261/261`), 4.12 (`build` / `Run npm test`: `Tests  4260 passed | 3 skipped`; `Run npm run build`: `e2e hook: absent (`).
- [human] 4.8 costs 6-21 = 100 (`LAB.tasks`), 4.9 wording (gap 208, `pl.room.tasks`), 4.10 no teaser on the last module (`houseRoomList`), 4.11 real tablet offline.
- Follow-ups: `context/changes/lab-module/follow-ups/review-fixes.md` (12 `Trigger:` lines). No `ARTIFACT GAP`.

## 6. Autonomous decisions

- Both review passes done inline instead of two sub-agents: the diff is 6 data/scene-comment files, one script and 9 test files, each read against its contract. Would change: a diff touching `src/core`/`src/ui`.
- F1 and F2 (warnings) fixed in place (cheap, one line each); F3-F5 recorded as observations. Would change: nothing.
- Row 4.7 ticked on the source strings the frames draw (all correct); rendering and fit stay with 4.6. Would change: the visual gate finding a caption cut or wrong on screen — then 4.7 is reopened.
- Commits with English subjects (F3) are not rewritten (contract forbids rewriting). Would change: nothing.
