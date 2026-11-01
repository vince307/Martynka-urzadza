<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Kitchen in stages and the salon on cream (house-1 polish)

- **Plan**: context/changes/house-1-polish/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-11-01
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 3 observations

Reviewed on `feat/house-1-polish` at `d10e0d6` against `main` `964285b`. Run step of `2026-11-01-bathroom-polish-lab`, no
`AskUserQuestion`; triage decided in place (contract rule 1). The non-test code diff is about 80 lines (`kitchenStages.ts`,
`save.ts`, `types.ts`, `rooms.ts`, `pl.ts`, `e2eHook.ts`, `e2eHookGuard.mjs`, `make-task-art.mjs`, one `balance.ts` comment), so the
drift and quality checks were done inline instead of by two subagents (decision R1 in the handoff).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Plan adherence (file by file)

| file | plan | verdict |
|---|---|---|
| `src/core/migrations/kitchenStages.ts` `LIFT_V6_KITCHEN_STAGES` | frozen, local constants, `k ≥ 1 → k + 2`, no mutation, no `src/data` | MATCH |
| `src/core/save.ts` `SAVE_VERSION`, `MIGRATIONS[6]`; `src/core/types.ts` `SaveV7` | v7, doc comments name v7 | MATCH |
| `src/data/rooms.ts` `KITCHEN.tasks`; `src/data/pl.ts` `cleanKitchen`, `renewWalls` | 3 stages 5/6/7 then six slots (84), list comment with the version-step exception | MATCH |
| `scripts/make-task-art.mjs` `ROOM_PACKS`, `ROOM_JOBS` | per-file `{ pack, id, as? }`, salon `recolourBoard: false`, pack-existence loop | MATCH |
| `public/assets/rooms/kitchen/kitchen-stage-{1,2}.webp`, salon three files | 87 604 / 86 592 B; 75 794 / 70 842 / 68 792 B | MATCH (sizes equal research) |
| `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS`, `e2eSaveStore`; `vite/e2eHookGuard.mjs` | `v6-kitchen` seam + marker | MATCH |
| `deploy/README.md` § 6 | v7 rollback note, docs only | MATCH (only file under `deploy/`) |
| tests, fixtures, `tests/e2e/house-1-polish.spec.ts`, `playwright.config.ts` | as phases 1-6 | MATCH |

## Save migration v6 → v7 (checked against the code)

- Frozen fixtures: `git diff --name-status 964285b -- tests/fixtures` = `A save-v6-kitchen-mid.json`, `A save-v7.json`,
  `M room-art-kitchen.json` (the room-art table fixture, planned in phase 2, not a save fixture). No save fixture modified.
- Step frozen: no import at all, local `'kitchen'` and `2`; source guard in `tests/saveV7.test.ts`.
- Every v6 kitchen state: absent / no `rooms` / malformed → version only; `0 → 0`; `1 → 3` (the after look the old stage
  showed); `3 → 5` with `chosen` kept (slot ids unchanged, every slot index moves by +2, so `roomStateProblems`
  `chosen-not-bought` stays consistent); `7 → 9` done (`fixtureLoadPath` kitchen-done → children, children-done → bathroom,
  `roomStateProblems` `[]`); `8 → 10` stays `tasks-overflow` as before. `chosen` is never touched: no path loses bought furniture.
- No loop: `decodeSave` walks `from..SAVE_VERSION-1` once; a missing step makes the save `unreadable` (break 3 below), not a loop.
- `backup-v6` write-once: `fixtureLoadPath` asserts `profile:default:backup-v6` equals the raw bytes and a second `backup` returns
  `kept`; `idbStore` reads it back through `readBackups`.
- Pre-v7 build: `decodeSave` returns `future` for `from > SAVE_VERSION`; `writeVerdict` refuses with `NEWER_SAVE` through
  `storedVersionNewer` (generic). v8 future case pinned in `saveV7` and `saveV6`.
- Import of a v6 export: `parseImport` of a v6 envelope yields kitchen `tasksDone 5` (`saveV7`); `importProblem` null.

## Findings

### F1 — Fourth `isRecord` copy fires save-truth follow-up 20

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/migrations/kitchenStages.ts (`isRecord`)
- **Detail**: `context/archive/2026-10-16-save-truth/follow-ups/review-fixes.md` item 20 says "Trigger: a fourth copy in
  `src/core`: extract `src/core/isRecord.ts`". `kitchenStages.ts` is that fourth copy (with `save.ts`, `saveFile.ts`,
  `migrations/legacySalon.ts`). The slice's follow-ups did not record it. Keeping it local is defensible: frozen steps carry their
  own helpers so a shared edit cannot change their meaning, and an extraction would edit two frozen steps.
- **Fix**: Record in `follow-ups/review-fixes.md` with a narrowed trigger (extract only the non-frozen copies).
- **Decision**: FIXED (follow-up 14 in `context/changes/house-1-polish/follow-ups/review-fixes.md`)

### F2 — The `tasksDone 0` boundary is proven by a unit literal only

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/saveV7.test.ts (`kitchen tasksDone %i becomes %i`)
- **Detail**: Re-executed break `done < 0` turned only the `0 → 0` literal red; no frozen v6 fixture holds a kitchen at
  `tasksDone 0` (a child who just moved into the kitchen). The literal is a sufficient oracle for a pure step; plan P3 names the
  condition for a second frozen fixture.
- **Fix**: None now.
- **Decision**: ACCEPTED

### F3 — SAVE_VERSION pinned in two test files

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/saveV6.test.ts (`is one version behind the current one`)
- **Detail**: The test title says the current version is pinned in `saveV7`, yet it asserts `SAVE_VERSION` 7 itself; a v8 step
  edits both. Harmless; the precedent files did the same move.
- **Fix**: None now.
- **Decision**: ACCEPTED

### F4 — Mid-kitchen fixture derived from a decoded v6 fixture

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/fixtures/save-v6-kitchen-mid.json
- **Detail**: Phase 1 built it on the v6 code from `save-v6-kitchen-done` with the kitchen set to `tasksDone 3` and two pieces,
  written by the real `encodeSave` and round-tripped (`migratedFrom null`, re-encode equal) — a genuine v6 write of a state the v6
  game can reach; diff against `save-v7.json` is exactly `version` and `tasksDone` (checked).
- **Fix**: None.
- **Decision**: ACCEPTED

## Success criteria re-run (this step)

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | clean / clean |
| `npm test` | 230 files, 4254 passed (baseline 4233 = 4230 + 3 CI-skipped; delta +21) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | pass |
| `npm run sample -- E1..E6` | all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| break A: `done + 1` in `LIFT_V6_KITCHEN_STAGES` | 13 unit failures (`saveV7` literals and fixture deep-equal, `fixtureLoadPath` kitchen cases: "expected 4 to be 5", "expected 'kitchen' to be 'children'"); restored |
| break B: `done < 0` | `kitchen tasksDone 0 becomes 0` red; restored |
| break C: `MIGRATIONS[6]` removed with `SAVE_VERSION` 7 | 31 failures, every pre-v7 fixture `unreadable` (no loop); restored |
| e2e break: `done + 1`, `house-1-polish.spec.ts -g FR-021 --workers=1` | red: "Expected: place-kitchen-table, Received: place-fridge"; restored; whole spec 3 passed (1.3 m) |
| full e2e | orchestrator: 196 = 193 + 3; 182 + 14 load timeouts, 14/14 pass `--last-failed --workers=1` (not re-run here) |
| hooks | no `--no-verify` evidence; every phase commit sits after a green gate in its handoff |

Manual rows: 2.8 `[reviewer]` ticked (Polish read: "Posprzątaj kuchnię", "Odnów ściany", "Odnów podłogę" are correct
imperatives with the accusative; each shorter than "Postaw stół i krzesła" on the same `RoomTaskButton`). 2.9 and 5.12
`[reviewer] (CI at ship)` stay open: 2.9 names Deploy job `deploy`, step `Smoke check (deploy)`, line
`146 of 146 room pictures precached`; 5.12 names Deploy job `build`, steps `Run npm test` (expected
`Tests  4251 passed | 3 skipped (4254)`) and `Run npm run build` (`e2e hook: absent (`). 5.6 `[visual]` is the next step; 5.7-5.11
`[human]`.

MERGE: CLEAR — no CRITICAL; the v6 → v7 kitchen step is frozen, keeps every bought piece, runs once, and its breaks go red in unit and e2e.
