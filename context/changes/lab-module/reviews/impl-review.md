<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Laboratorium, the third module of the base, with the base's own cell frame

- **Plan**: `context/changes/lab-module/plan.md`
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-11-01
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (both fixed in `7c8b9a5`), 3 observations

Run `2026-11-01-bathroom-polish-lab`, slice S-33, branch `feat/lab-module` at `0f4d052` (review fix `7c8b9a5` on top). The diff is
small (6 source files under `src/data` and `src/scenes`, 1 script, 9 test files, 22 WebP), so both review passes (plan drift;
safety, quality and patterns) were done inline instead of by two sub-agents; every planned file was read against its contract.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F2, fixed) |
| Success Criteria | PASS |

## Evidence

### Plan vs code

| planned change | verdict |
|---|---|
| `scripts/make-task-art.mjs`: `SPACE_BASE_V3`, `SPACE_BASE_V5`, `ROOM_PACKS` lab row, per-row `pack` in `BASE_FILES`, kit-existence loop over `BASE_FILES` packs | MATCH |
| `src/data/rooms.ts` `labSlots` / `LAB` / `ROOMS` | MATCH — every slot's x, y, width, height, z, anchor, visibleRect re-checked against `designs/bystrow-space-base-v3/manifest.json` `rooms.lab` (identical); costs 6/10/13/14/17/19/21 = 100 |
| `src/data/roomArt.ts` `ROOM_SCENE_FILES.lab` | MATCH |
| `src/data/pl.ts` names, slots, variants, tasks (gap 208 comment) | MATCH (teacher read below) |
| `src/data/houses.ts` `HOUSES['base-1']` lab row `(1,0)`; `HOUSE_GEOMETRY['base-1'].cellFrame` = `house/base-1-cell-frame`, DESIGN-GAP comment replaced | MATCH |
| `src/data/houseArt.ts` `entry('base-1-cell-frame', 640, 374)` | MATCH |
| `src/scenes/HouseScene.ts` `art()` doc comment only | MATCH (comment line only) |
| tests (roomArt + snapshot fixture, roomsData, roomHit, rooms, houseCells, houseArt, fixtureLoadPath, hangar-module #16, lab-module spec, `ROUND_SPEC`) | MATCH |
| CLAUDE.md S-33 sentence + S-30 clause; gaps 196/199/208; follow-ups | MATCH (12 `Trigger:` lines) |

Nothing changed in `src/core`, `src/ui`, `src/main.ts`, `src/testing`, `vite/`, `balance.ts`. Save format stays v7:
`git diff 60472aa -- tests/fixtures src/core/save.ts src/core/migrations` shows only two ADDED files
(`tests/fixtures/room-art-lab.json`, `tests/fixtures/save-v7-hangar-done.json`).

### Local gate (re-run by this review on `0f4d052`, again after `7c8b9a5`)

| gate | result |
|---|---|
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm test` | `Tests  4263 passed (4263)` = baseline 4254 + 9 (phase 1 +5, phase 2 +4, phase 3 +0 renamed cases; 4254 + 5 + 4 = 4263) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | exit 0 each (no task content changed) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e full (orchestrator, pinned worktree `0f4d052`, `--workers=4`) | 198 = baseline 196 + 2 (`lab-module.spec.ts`); 174 passed + 15 timeouts + 9 not run, `--last-failed --workers=1` 24/24 passed (known load-sensitive set plus save-restart #16, parent-settings #14) |
| `lab-module.spec.ts` alone (this review, `--workers=1`, sandbox disabled) | 2 passed (1.6 m) |

### Deliberate breaks re-executed by this review

1. Unit (tdd phase 2 RED evidence): the lab row removed from `HOUSES['base-1']` → exactly the 6 assertions quoted in the phase-2
   handoff turned red (`houseCells` `['done','done','closed','closed']`, roomsData placement `lab: expected [] to have a length of 1`,
   base `houseRoomList`, `expected 'hangar' to be 'lab'`, fixtureLoadPath ×2); restored, green.
2. E2E (break named in the handoff): `HOUSE_GEOMETRY['base-1'].cellFrame` back to `'house/cell-frame'` → `lab-module.spec.ts` `#2`
   RED at the rendered mint-pixel poll (`Expected: true Received: false`, line 52); restored, both tests green. The spec does not
   survive its break.

### Teacher / Polish read ([reviewer] rows 1.7 and 4.7)

Captions (nominative): „mikroskop”, „gablota z kamieniami”, „stół z kolbami”, „model Księżyca”, „stołek”, „tablica magnetyczna” —
correct. Variants agree with gender: masculine nouns (mikroskop, stół, model, stołek) Naturalny/Słoneczny/Miętowy; feminine
(gablota, tablica) Naturalna/Słoneczna/Miętowa — correct. Task labels imperative + accusative: „Postaw mikroskop”, „Postaw gablotę
z kamieniami”, „Postaw stół z kolbami”, „Postaw model Księżyca”, „Postaw stołek”, „Powieś tablicę magnetyczną” (wall-mounted board,
like „Powieś ramki”) — correct; „Księżyca” capitalised as the celestial body — correct. Longest label (27 characters) is as long as
the shipped Hangar „Ustaw skrzynie z częściami” and `RoomTaskButton` scales by `labelScale`. Room name „Laboratorium”, house button
„Baza” (`pl.house.open['base-1']`), „Dalej”, stage „Odnów ściany i podłogę” — correct. Row 4.7 was read on the source strings the
frames (1)-(11) draw; how they render and fit is the visual gate's row 4.6. `npm run sample` unaffected (no task content).

### Process (phase 1 without the `/10x-implement` Skill)

Phase 1 still left what the ritual asks: six Progress rows ticked with `947e665`, one phase commit on green, a committed handoff
with the verification table (focused vitest, three deliberate breaks with restore, meta-check, full gate, unit 4259 = 4254 + 5,
`sw.js` count 21, scope diff empty), the placement exemption with its comment, removed red-first in phase 2. Nothing missing.
No hook bypass seen: no `--no-verify` trail, every phase commit sits on a green gate re-run here, harness files untouched.

### `[reviewer] (CI at ship)` rows left open

- 1.8 — Deploy job `deploy`, step `Smoke check (deploy)`: `ok   precache covers room pictures — 167 of 167 room pictures precached`.
- 3.7 — Deploy job `deploy`, step `Smoke check (deploy)`: `ok   precache covers house pictures — 6 of 6 house pictures precached`
  and `ok   precache served: 261/261 — every entry answered with its media type`.
- 4.12 — Deploy job `build`, steps `Run npm test` / `Run npm run build`: `Tests  4260 passed | 3 skipped` (4251 + 9) and
  `e2e hook: absent (`.
  Each names its job and log line.

## Findings

### F1 — Follow-up 8 trigger narrowed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/changes/lab-module/follow-ups/review-fixes.md` item 8
- **Detail**: The plan says house-1-polish follow-up 2 (retire `recolour-board.py`) is carried "with the trigger kept". The file
  rewrote it to "the next change to `scripts/make-task-art.mjs` that is not a pack row", so the next pack slice would no longer
  fire it — a trigger narrowed to dodge itself.
- **Fix**: restore the original trigger („the next change to `scripts/make-task-art.mjs` or `scripts/recolour-board.py`, or an audit”).
- **Decision**: FIXED in `7c8b9a5`

### F2 — Wrong measured weight in the house-art comment

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `tests/houseArt.test.ts` (comment above `CAPS`)
- **Detail**: Comment said "the base measured about 106 400 B with its own frame"; the files are shell 81 970 + closed cell 12 308 +
  frame 3 498 = 97 776 B (as the plan's Performance section says). The cap (110 000) and the test were right; only the recorded
  number was wrong, which would mislead the next cap change.
- **Fix**: comment states 97 776 B with its parts.
- **Decision**: FIXED in `7c8b9a5`

### F3 — Phase commit subjects mix English and Polish

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: commits `e9e6ae2`, `48e67df`, `be81f83`, `7bf4af8`, `2681066`
- **Detail**: The profile (§ 1) asks for Polish commit messages; p1 and p4 are Polish, p2, p3, p5 and two handoffs use the English
  plan phase title. Commits are not rewritten (contract); the squash/PR title at ship is Polish.
- **Decision**: ACCEPTED (recorded)

### F4 — Hangar #16 lost its mode-button assert by design

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/hangar-module.spec.ts` #16
- **Detail**: "Dalej" now leaves the Hangar, so its change-mode assert went; the same last-module behaviour (mode button, "Baza")
  is asserted by `lab-module.spec.ts` #16 for the new last module. No coverage lost.
- **Decision**: ACCEPTED (recorded)

### F5 — Fixture load proof mirrors `main.ts` rather than running it

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/fixtureLoadPath.test.ts` "save-v7-hangar-done meets the Laboratorium"
- **Detail**: Stated in the plan's meta-check; the browser proof of the same path is `lab-module.spec.ts` #2's reload (in-session
  save, not the frozen fixture). Precedent for every earlier module.
- **Decision**: ACCEPTED (recorded)

MERGE: CLEAR — 0 critical; local gate green (unit 4254 + 9), full e2e 196 + 2 with all load timeouts green on re-run, both re-executed breaks red, save format v7 untouched, two warnings fixed in 7c8b9a5.
