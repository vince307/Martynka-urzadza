# Handoff — `house-cross-section` (slice S-23)

Written by the `/10x-e2e` step, phase 6 (the last) of run 2026-10-31-house-cross-section; the test commit is `4112bd0`. The slice is `implemented`; the full e2e count is the orchestrator's to confirm (see §3), do not read "full suite" as run to the end.

## 1. State

| | |
|---|---|
| branch | `feat/house-cross-section`, cut from `main` at `112f158` |
| commits | docs, p1 `158004b`, p2 `c470f94`, p3 `518f581`, p4 `b46f63f`, p5 `5d59882`, p6 `4112bd0` (+ this handoff/epilogue commit) |
| pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 7: 3.5, 4.4, 4.6 (earlier e2e rows ticked by the orchestrator earlier; check `grep -n '^- \[ \]' plan.md`), 2.7, 5.11 [reviewer], 5.6 [visual], 5.7-5.10 [human] |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/house-cross-section.spec.ts` | new, 4 tests under `chromium-hook` |
| `tests/e2e/canvas-renderer.spec.ts` | + `S-23 canvas-renderer house miniatures are captured under Canvas` |
| `tests/e2e/support/hook.ts` | `houseView` on `Snapshot`, `housePixel(page, cellId)` helper |
| `tests/e2e/support/salon.ts` | `solveByRetype` exported |
| `playwright.config.ts` | `house-cross-section` added to `ROUND_SPEC` only |
| `context/changes/house-cross-section/plan.md`, `change.md` | rows 6.1-6.3 ticked with sha; status implemented |

## 3. Verification

| command | result |
|---|---|
| new tests alone, `--workers=1` | 5 passed (house spec 4, canvas 1) |
| `npx playwright test --list` | Total 179 tests = baseline 174 + 5 |
| deliberate break A: `RoomScene` wake keeps `visiting` from the previous value AND the sleep reset removed | FR-039 test red (`roomId` "salon", expected "kitchen"); restored. Meta-check: a first try with only the `?? this.visiting` change stayed green because the sleep handler already resets `visiting` — the sleep reset is the second guard, so the test protects the pair, not the wake line alone |
| break B: `cellTap` returns a room for a closed cell | FR-038 test red (screen "room", expected "house"); restored |
| break C: `captureRoomMiniature` skipped in `HouseView` | both pixel asserts red (house spec and Canvas case, received null); restored |
| break D: `?e2eArt=house` seam ignored in `HouseScene.loadArt` | stand-in test red (`artFallbacks.house` undefined); restored |
| lint / typecheck / `npm test` / build | green; `Tests 4089 passed` (delta 0), `e2e hook: absent (2 chunks checked)` |
| full e2e `--workers=2` | NOT run to the end: machine load ~29, about 70 tests in 25 minutes, run stopped by me. 70 passed, 2 failed (`adaptive.spec.ts` #13 "Nowa umiejętność!", `first-launch.spec.ts` #12 "Wróć"); both pass alone with `--workers=1` (load timeouts). The orchestrator's `--workers=4` run owns the final number (expect 179) |

## 4. Next command

`/10x-impl-review house-cross-section`

## 5. Open

- Manual rows: 2.7, 5.11 `[reviewer]`; 5.6 `[visual]`; 5.7-5.10 `[human]`.
- Follow-up 11 (Dom button hidden under the celebration card) is NOT covered: the new test checks the button is absent while the variant panel is open (gap 183), not under the celebration card. It stays open in `follow-ups/review-fixes.md`.
- The plan's third test names the kitchen cell; the spec uses the salon cell on a fresh device (the kitchen cell is closed there) and the kitchen path is covered by the FR-039 test (kitchen current after "Dalej").
- Full-suite count unconfirmed (above).

## 6. Autonomous decisions

- Mixed-phase gate: the cell-state rules are covered by `tests/houseCells.test.ts` (unit); this phase drives only the browser part.
- Third test uses the salon's current cell, not the kitchen's, to avoid a second `finishSalon` run under load. Would change: the plan insisting on the kitchen cell.
- Stopped the full run at 72 of 179 under load instead of waiting hours; reran the two failures alone. Would change: the orchestrator wanting the full count from this step.
- Driver stays `e2e`.
