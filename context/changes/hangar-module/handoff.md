# Handoff — `hangar-module` (slice S-30)

Written by the `/10x-e2e hangar-module phase 4` step of run 2026-10-31-space-base. All four phases are committed (phase 4 at baa785b); change.md is `implemented`. The next agent must not miss that the full e2e (`187 + 2` = 189, `--workers=4`) is the orchestrator's gate and that [reviewer]/[human] rows stay open.

## 1. State

| | |
|---|---|
| Branch | `feat/hangar-module`, cut from `main` at `a4a0aee` |
| Commits | phase 1 `041e279`, phase 2 `de5ab57`, phase 3 `862dca7`, phase 4 `baa785b`, plus docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` (epilogue run; [reviewer]/[human] rows still open) |
| `## Progress` rows remaining | 6: 1.7, 1.8, 3.10 [reviewer]; 3.7, 3.8, 3.9 [human] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/hangar-module.spec.ts` | 2 tests (hook build): `#2 S-30 FR-047 the base shows Mostek done and the Hangar framed ...; a reload keeps it`, `#16 S-30 FR-047 the Hangar is bought to the end ...; the balance is exact` |
| `tests/e2e/support/salon.ts` | new `buyAllTasks(page, def)`, reused by `base-cross-section.spec.ts` #16 |
| `playwright.config.ts` | `hangar-module` added to `ROUND_SPEC` only |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/hangar-module.spec.ts --list` | 2 tests, `chromium-hook` only; `npx playwright test --list` total 189 (187 + 2) |
| hangar-module + base-cross-section specs, `--workers=1` | 5 passed |
| `npm run lint`, `npm run typecheck` | OK; `npm test` Tests 4194 passed; `npm run build` `e2e hook: absent (2 chunks checked)` |
| Break 1: Hangar row `place: 2` in `HOUSES['base-1']` | #2 RED (cell states toEqual); restored |
| Break 2: third room `kitchen` added to the base row | #16 RED (card items toEqual, +1 item); restored |
| Break 3: last Hangar cost 21 to 22 | first run stayed GREEN (seed was summed from the data, so it followed the change); seed changed to literal 100 + 100, re-run RED (purchase flow stalls: unaffordable last task); restored. Meta-check: the cost rule is now caught through the literal budget |
| Break 4: `ROOM_SCENE_FILES.hangar.after` pointed at the before file | GREEN, expected: at `tasksDone 0` the Hangar miniature already shows the before picture, so the window pixel cannot see it. Not a defect of the spec; the pixel oracle's break is proven by break 1 context (the cell shows no Hangar) is NOT claimed. Recorded, not fixed |
| Pixel oracle | scene (1417,720), the starry window of the Hangar miniature, differs from the cream cell background by more than 40; the first chosen point (1123,816) was cream in the Hangar too and was dropped |
| Ports | 4397/4398 free after the runs |

## 4. Next command

`/10x-impl-review hangar-module`

## 5. Open

- Full e2e (`--workers=4`, `187 + 2`) at the orchestrator's gate; a load timeout is re-judged with `--last-failed --workers=1`.
- [human] 3.7, 3.8, 3.9; [reviewer] 1.7, 1.8, 3.10.
- Follow-ups: `context/changes/hangar-module/follow-ups/review-fixes.md`. New: the e2e pixel point cannot tell the Hangar after picture from the before one (a renovated-Hangar miniature check would need the Hangar bought and the house reopened).

## 6. Autonomous decisions

- Break 4 left green and recorded as the plan allows (the miniature at `tasksDone 0` is the before picture), instead of deleting the test: the pixel assertion is proven red by break 1 only in the sense of the cell state; the test stays because break 1 and 3 turn the spec red. Would change: a requirement to prove the Hangar picture itself.
- `buyAllTasks` lives in `support/salon.ts` (not `hook.ts`) to avoid an import cycle (it needs `room`); typed with a structural parameter because `RoomDef` is not exported. Would change: exporting `RoomDef`.
- Seeds and balance use literal totals (100 + 100) rather than sums from the data. Would change: a cost ladder change by the maintainer.
- Plan said balance check "the save's stars": read from the hook snapshot `stars` (registry, the one source), not the label.
