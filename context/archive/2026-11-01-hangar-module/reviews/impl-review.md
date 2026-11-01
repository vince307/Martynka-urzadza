<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Hangar with the rocket, the second module of the base

- **Plan**: context/changes/hangar-module/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4
- **Date**: 2026-11-01
- **Verdict**: APPROVED (after the two fixes below)
- **Findings**: 1 critical (fixed), 1 warning (fixed), 3 observations

Step `/10x-impl-review hangar-module` of run 2026-10-31-space-base, branch `feat/hangar-module` (`a4a0aee...HEAD`). Reviewed by
reading the whole diff (data, art script, tests, e2e spec, docs) against plan, research, plan review and visual review; no subagents
(the diff has 6 code files and the review needed re-executed breaks, which a subagent summary would not prove). No lessons file
exists in `context/foundation/`.

## Boundary checks (FR-047 "moduł jak pokój")

| check | result |
|---|---|
| `git diff a4a0aee -- src/core/save.ts src/core/migrations` | empty (0 lines): save v6, no migration |
| `git diff --stat a4a0aee -- src/scenes src/core src/ui src/main.ts src/testing` | empty |
| fixtures added | `tests/fixtures/save-v6-bridge-done.json` (save) and `tests/fixtures/room-art-hangar.json` (a `ROOM_ART` snapshot, the same kind as the existing `room-art-{salon,kitchen,bridge}.json`, not a save); no existing fixture changed |
| non-data code | `scripts/make-task-art.mjs` only (new `ROOM_PACKS` row, `SPACE_BASE_V2`, the duplicate `SPACE` constant merged into `SPACE_BASE`) |
| hooks | `.claude/settings.json` and `.claude/hooks/*` mtimes 2026-10-10/12, before the branch base (2026-11-01); no `--no-verify` in the log; the hooks fired during this review (lint + related tests on every edit) |
| slot geometry | all six `hangarSlots` rows (x, y, width, height, z, anchor, visibleRect) equal `designs/bystrow-space-base-v2/manifest.json` `rooms.hangar` (checked with node at review) |

## Suites (observed in this step)

| command | result |
|---|---|
| `npm run lint` | exit 0 |
| `npm run typecheck` | exit 0 |
| `npm test` | Tests 4194 passed (227 files) = baseline 4185 + 9 (roomsData +4, houseCells +1, fixtureLoadPath +2 (it.each row + new case), roomHit +1, bootBudget +1 via `ROOMS`) |
| deploy/ops shell tests + `sample` E1-E6 | exit 0, `Naruszenia: 0` |
| `npm run build` | exit 0, `e2e hook: absent (2 chunks checked)` |
| e2e full `--workers=3` (after both fixes) | 184 passed + 5 timeouts (fox-guide #11, money-pay #11, save-transfer #2 #10, stale-tab ×2: test timeouts and closed-target errors under load, none in this slice's specs); `--last-failed --workers=1` 5 passed → 189 = baseline 187 + 2 |

## Deliberate breaks re-executed

1. **tdd phase 2**: removed the Hangar row from `HOUSES['base-1']` → 5 unit tests red (`fixtureLoadPath` "save-v6-bridge-done meets the Hangar", `houseCells` "with the Mostek done and the Hangar current", `roomsData` "placed in exactly one house", "the first room of the base", "moves the child to the Hangar"); restored, green. The RED evidence names real assertions on the production row.
2. **after-art path** (`ROOM_SCENE_FILES.hangar.after` → `hangar-before`): `tests/roomArt.test.ts` red twice (snapshot `room-art-hangar.json`, orphan check); restored. The e2e spec cannot see it (see O1) but the risk is held at unit level.
3. **e2e pixel oracle** (F1): Hangar row `place: 2` with the old cream-only oracle → test #2 passed the pixel line and failed only at the cell states (line 56); with the new oracle → red at the pixel poll (line 54); restored; spec + `base-cross-section.spec.ts` 5 passed.
4. **fixture** (F2): new assertion `roomStateProblems(...) = []` red on the old fixture (`unknown-slot`), green on the fixed one.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (after F1, F2) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — The #2 pixel oracle could not see the closed airlock

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/hangar-module.spec.ts` (`WINDOW_POINT`, `CREAM`, test `#2 S-30 FR-047 …`)
- **Detail**: The spec claimed "the rendered frame shows the Hangar's miniature, not the closed airlock picture", but compared only with cream. At `WINDOW_POINT` (1417,720) the airlock picture `base-1-cell-closed.webp` is (97,132,140) (Pillow at review), which also differs from cream by more than 40, so a closed `ground-right` passed the pixel line (proven: break `place: 2` failed only at the later cell-state line). The header comment named a non-existent `HANGAR_POINT_NOTE` and the dropped point (1123,816).
- **Fix**: Compare with both the airlock colour and cream (`farFrom`, `AIRLOCK`), check the pixel before the cell states, correct the header comment with the measured colours. Red on the pixel with the break, green restored.
- **Decision**: FIXED — `c5df38d`

### F2 — The frozen fixture save-v6-bridge-done had four Mostek slots that do not exist

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `tests/fixtures/save-v6-bridge-done.json` (`rooms.bridge.chosen`), `tests/fixtureLoadPath.test.ts`
- **Detail**: The fixture is described as "a v6 save as the S-29 build writes it", but `chosen` held `bridge-screen`, `bridge-lamp`, `bridge-map`, `bridge-plant`; `BRIDGE` slots are `bridge-telescope`, `bridge-shelf`, `bridge-rug`, `bridge-plants`. `roomStateProblems` reports `unknown-slot` for it. Once merged, the fixture is frozen, so the fix had to land now.
- **Fix**: Real slot ids in the fixture; the load-path case asserts `roomStateProblems(moved.rooms, ROOMS)` is empty (red on the old fixture).
- **Decision**: FIXED — `78d7f1d`

### O1 — The e2e spec cannot tell the Hangar after picture from the before one

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/hangar-module.spec.ts`; `src/data/roomArt.ts` `ROOM_SCENE_FILES`
- **Detail**: Phase 4 break 4 stayed green. Judged out of the e2e risk: #2 and #16 protect progress across a reload and the purchase flow and balance; which file is the after picture is a data-table rule, and the unit snapshot `room-art-hangar.json` (written from the pack, plan review F4) turns red on exactly that break (re-executed). At `WINDOW_POINT` the before and after pictures are the same dark window, so no point there could see it anyway. Recorded as follow-up 5.
- **Fix**: none in code; follow-up 5 with a trigger.
- **Decision**: RECORDED

### O2 — Teacher read of the Hangar copy (row 1.7)

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/data/pl.ts` `pl.room.{names,tasks,slots,variants}`
- **Detail**: Captions are nominative lower case from the pack labels; variant forms agree with gender and number (rakieta, lampa, mata: Naturalna/Słoneczna/Miętowa; łazik, stół: Naturalny/…; skrzynie (plural non-virile): Naturalne/…); task labels are imperative + accusative ("Postaw rakietę", "Połóż matę startową", "Ustaw skrzynie z częściami" acc. pl. = nom.). The longest label (26 characters) exceeds the previous longest ("Postaw regał z planetami", 24) and is shrunk by `labelScale`, never cut; it was not in a screenshot frame. `npm run sample` E1-E6: 0 violations (no task content changed). Row 1.7 ticked.
- **Decision**: PASS

### O3 — Small leftovers

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `tests/e2e/support/salon.ts` (`buyAllTasks`)
- **Detail**: Double blank line before `buyAllTasks`; lint accepts it. The handoff of phase 4 announced a follow-up for the after-picture point that was not in `follow-ups/review-fixes.md`; added as item 5 here.
- **Decision**: RECORDED (not worth a commit)

## Rows

- 1.7 [reviewer] ticked (O2).
- 1.8, 3.10 [reviewer] (CI at ship) stay open: 1.8 names Deploy job `deploy`, step `Smoke check (deploy)`, line `ok   precache covers room pictures — 100 of 100 room pictures precached` (79 of 79 seen in run 41278603357); 3.10 names Deploy job `build`, line `Tests  <4182 + 9 = 4191> passed | 3 skipped` and `e2e hook: absent (` (seen in run 41278603357, job 124765733845). Both are real lines from a real run.
- 3.7, 3.8, 3.9 [human] stay open.

MERGE: CLEAR — data-and-art only as FR-047 demands (no scene, core, ui, save or migration change), all suites green (unit 4185 + 9, e2e 187 + 2), the critical pixel-oracle gap and the bad frozen fixture fixed and proven red→green, no open criterion besides the CI-at-ship and human rows.
