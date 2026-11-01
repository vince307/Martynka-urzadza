# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-e2e` phase 5 step of run `2026-10-31-space-base`. Phases 1-5 are committed. The next agent must not get this wrong: only `/10x-impl-review` remains for the agent; rows 4.6-4.9 and 2.7 are [visual]/[human]/[reviewer], not ticked here.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | p1 `55c8c16`, p2 `7db029e`, p3 `0dbfcf9`, p4 `2bcc350`, p5 `f89cf1d` (+ this docs commit) |
| pushed / PR / merged | no / none / no |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (4.6-4.10, 2.7: visual/human/reviewer) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/base-cross-section.spec.ts` | 3 tests, `chromium-hook` only (#12 x2, #16 #2) |
| `tests/e2e/support/hook.ts` | `renderedPixel(page, point)` (1x1 screenshot clip, node:zlib PNG decode) |
| `playwright.config.ts` | `base-cross-section` added to `ROUND_SPEC` only |
| `context/changes/base-cross-section/plan.md` | rows 4.5, 5.1-5.3 ticked |

## 3. Verification

| command | result |
|---|---|
| spec alone, `--workers=1` | 3/3 green |
| full e2e `--workers=3` | 166 passed, 12 timeout failures + 9 not run (machine loaded); `--last-failed --workers=1`: 21/21 green; total 187 (baseline 184, +3) = `playwright.config --list` |
| lint, tsc, `npm test`, build | OK; 4185 unit tests (no change); `e2e hook: absent (2 chunks checked)` |
| break: `RoomScene` house label fixed to `pl.house.open['house-1']` | test 1 red (Expected "Baza", Received "Dom"), restored |
| break: drop `this.artQueued = false` in `HouseScene.create` | test 3 red (`shellReady` false), restored |
| break: house button hide rule `blocked` -> `open` | test 2 red (houseButton target present while card up), restored |
| break: base `background` 0xe8efeb -> 0xe7f4f4 | first run stayed GREEN: the oracle read `HOUSE_GEOMETRY` so it moved with the break; oracle changed to literal hex `#e8efeb`/`#e7f4f4`, rerun red, restored |
| break: base `cellClosed` key -> house `cell-closed` | test 1 red (cell pixel assert), restored |
| meta-check | the plan's pl.ts-string break is copy-only, so the label break was moved into the rule (which building's label shows) |

## 4. Next command

`/10x-impl-review base-cross-section`

## 5. Open

- Rows 4.6 [visual], 4.7-4.9 [human], 4.10 and 2.7 [reviewer]. Follow-ups: `follow-ups/review-fixes.md`.
- Test 2 does not assert "a right answer raises stars" in the notebook before the reload (the task was settled and no Dalej target was published); it answers right after the reload instead.

## 6. Autonomous decisions

- Pixel oracles are literal values from the packs, not from `src/data/houses.ts` (circular otherwise); the closed-cell point scene (1123,816) is cream where the house cell is teal.
- Test 3 plays one settled task (`solveByRetype`) before "Do pokoju"; the Dom roomSwitch needs a settled task after the new choice.
- 4.5 ticked from the orchestrator's 184/184 on f51eedc.
