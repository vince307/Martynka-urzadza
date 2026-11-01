# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-tdd` step, phase 1, of run 2026-11-01-bathroom-polish-lab: save format v7 (`MIGRATIONS[6]`, kitchen `tasksDone`
k ≥ 1 → k + 2) is committed as `13cb528` and green. The kitchen data is NOT changed yet; the one thing not to get wrong: phase 2 must
turn the temporary `TASKS_OVERFLOW_KITCHEN` expectation in `tests/fixtureLoadPath.test.ts` back into `[]` RED-FIRST, before the 9-task kitchen list.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, cut from `main` at `964285b` |
| commits | 5 on top of `964285b`: identity, research, plan, plan review, `13cb528` `test(house-1-polish): save format v7, the kitchen moves onto the staged list (p1)` (+ this handoff/plan docs commit) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged by this step) |
| Progress rows remaining | 35 (`grep -c '^- \[ \]' plan.md`); phase 1 rows 1.1-1.6 ticked |
| working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/migrations/kitchenStages.ts` | new, frozen: `LIFT_V6_KITCHEN_STAGES` (version 7; kitchen integer `tasksDone ≥ 1` → +2; everything else passes; no `src/data` import) |
| `src/core/save.ts`, `src/core/types.ts` | `SAVE_VERSION` 7, `MIGRATIONS[6]`, `SaveV7`, `SaveState = SaveV7`, doc comments |
| `tests/fixtures/save-v6-kitchen-mid.json` | new frozen v6 input, produced by the v6 code (see §3) |
| `tests/fixtures/save-v7.json` | new frozen hand-derived v7 oracle (the mid fixture's literal text with `version` 7, kitchen `tasksDone` 5) |
| `tests/saveV7.test.ts` | new: version pin, deep-equal to the oracle, literal 0/1/3/7/8 cases, no-kitchen/malformed cases, deep-frozen input, decode `migratedFrom 6`, v8 = future, import + `parseImport`, source guard |
| `tests/fixtureLoadPath.test.ts` | "writes v7", `FIXTURES` + mid + `save-v7`, +2 expectation in the loop, `backup-v6` raw check, kitchen-done/children-done expect +2, TEMPORARY `TASKS_OVERFLOW_KITCHEN`, new "save-v6-kitchen-mid stays in the kitchen" case |
| `tests/saveV6.test.ts`, `save.test.ts`, `saveV5.test.ts`, `saveV4.test.ts`, `saveFile.test.ts`, `autosave.test.ts`, `legacySalonMigration.test.ts` | pins moved to 7, chains gained `MIGRATIONS[6]`, "future" cases use v8 |
| `tests/idbStore.test.ts` | new case: `backup-v6` and `readBackups` |
| `tests/e2e/rooms-as-data.spec.ts`, `first-building-choice.spec.ts` | `SAVE_VERSION` pin 7 (and one title) |
| `deploy/README.md` | docs-only "Uwaga (format v7, house-1-polish)" rollback note |
| `context/changes/house-1-polish/plan.md`, `handoff.md` | rows 1.1-1.6 ticked with sha; this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-1-polish` |
| fixture proof (throwaway script in the scratchpad, run on the v6 code with `SAVE_VERSION` still 6) | decoded `save-v6-kitchen-done` with the real `decodeSave`, rebuilt the session (salon 12 done, kitchen `tasksDone 3` with `kitchen-counter 1`, `kitchen-fridge 2`, the four-cell house), wrote it with the real `encodeSave` + stamps `generation 6`/`writer tab3:n5`; then decoded the written file (`migratedFrom null`) and re-encoded: equal. The fixture is a v6 write, not typed by hand |
| RED (stub step = version-only lift, v6 still current) | `AssertionError: expected { tasksDone: 1, chosen: { …(1) } } to deeply equal { tasksDone: 3, chosen: { …(1) } }` (saveV7 `1 → 3`); also `expected 6 to be 7` (version pin) and `expected 3 to be 5` (fixtureLoadPath mid); 17 failures across `saveV7`/`fixtureLoadPath` before the real step |
| GREEN | real step + `SAVE_VERSION 7`; the 7 older test files' pins moved; full unit 4249 passed (baseline 4233, +16), 230 files |
| Deliberate break A: shift 1 instead of 2 | red: 13 failures (`lifts the v6 mid-kitchen fixture to the frozen v7 file`, the `1 → 3` literal, 6 fixtureLoadPath cases); restored |
| Break B: `done < 0` (shifts `tasksDone 0`) | red: `kitchen tasksDone 0 becomes 0` only; restored |
| Break C: `import { KITCHEN } from '../../data/rooms'` in the step | red: `keeps the migration frozen: no data import, no KITCHEN`; restored |
| Break D: `SAVE_VERSION` back to 6 with `MIGRATIONS[6]` present | red: 11 failures (version pin, every "writes v7" case); restored |
| Meta-check | the v6 input comes from the v6 code path, the v7 oracle is a literal file, the 0/1/3/7/8 cases are literals; none is computed by the step under test. Break B shows the 0 boundary is protected by a literal, not by the deep-equal alone (the mid fixture has no `tasksDone 0`, so only the literal case catches it) |
| `git diff 98775f8 --stat -- tests/fixtures src/core/migrations src/data public scripts src/ui src/scenes deploy` | only `deploy/README.md` (+1) in the tracked diff at that time; new files are `kitchenStages.ts` and the two fixtures; no older fixture or migration edited (1.3, 1.4) |
| `npm run lint`, `npm run typecheck` | clean |
| `npm test`, `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1..E6` | 4249 passed; OK; OK; E1-E6 ok |
| `npm run build` | green, prints `e2e hook: absent (2 chunks checked)` |
| Single e2e specs (sandbox disabled, `--workers=1`) | `rooms-as-data` 3/3, `first-building-choice` 5/5, `save-migration` 2/2 green (no timeouts) |
| full Playwright suite | not run (scope.md: the orchestrator runs it once after phase 6) |

## 4. Next command

`/10x-implement house-1-polish phase 2` (phase 2, `Driver: impl`)

## 5. Open

- `[human]` rows (plan Progress 5.7-5.11): save v7 (overturns scope.md "save stays v6"; rollback below v7 shows the
  `pl.saveFuture` card, now noted in `deploy/README.md`), kitchen costs 5/6/7 + slots = 84, salon cell fill (D4, gap 207), salon
  before look worn-v2 + code grade (D5, gap 206), real-tablet offline check.
- `[reviewer] (CI at ship)` rows 2.9 (smoke 146 of 146 room pictures) and 5.12: proven only by the post-merge Deploy log.
- Phase 2 must remove the TEMPORARY `TASKS_OVERFLOW_KITCHEN` expectation in `tests/fixtureLoadPath.test.ts` (two cases:
  `save-v6-kitchen-done`, `save-v6-children-done`) red-first: change it to `[]` with the kitchen still 7 tasks (red), then land the 9-task list.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`,
  later `scripts/make-task-art.mjs`, `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md` § 6 (done).
- Phases 2-3 need `cwebp` (`/usr/local/bin/cwebp`) and Pillow 12.1.0 + numpy 2.4.3 for `npm run art` (BLOCKED, never hand-made WebP, if missing).
- Phase 6 test 2: assert through `save.migratedFrom`, `save.store.ops`/`writtenVersion`, `save.backup` only (review F1).
- E2E: phases run only single specs; the orchestrator runs the full suite once after phase 6.
- Plan 1.5 named three specs; the phase-2 e2e grep list is the plan's own (row 2.6).
- DESIGN-GAPs planned: 206, 207 new; 109, 182, 203, 169/171 edited (phase 5). Follow-ups in phase 5 (`follow-ups/review-fixes.md`).

## 6. Autonomous decisions

- No `AskUserQuestion`; the skill's manual gate, how-to-proceed, commit message and dirty-path prompts decided in place: commit exactly
  the planned set, stop after phase 1. Would change: nothing.
- TDD gate: the migration, `SAVE_VERSION 7` and the fixtures were absent, so the phase kept `Driver: tdd` (no redirect).
- RED technique: a version-only stub step was wired as `MIGRATIONS[6]` first so the red is an assertion failure, not a missing
  module (the task's rule). Would change: nothing.
- `save-v7.json` was produced by a literal text substitution of the frozen mid fixture (`version` 6 → 7, `tasksDone` 3 → 5), not by
  running the migration. Rejected: computing it with the step (circular). Would change: nothing.
- Pins for "future" saves moved from v7 to v8 (a v7 save is now current); "writes v6" log text and the `from: 6` expectations moved to 7.
  `saveV6.test.ts` keeps `MIGRATIONS[5]` meaning, and now expects `migratedFrom: 6` for the v6 base fixture.
- Source guard regex is `\bKITCHEN\b` so the step's name `LIFT_V6_KITCHEN_STAGES` does not trip it. Would change: a rename of the constant.
- One e2e title changed ("written as v7") besides the pins; harmless. Would change: a grep elsewhere keyed on the old title (none found).
