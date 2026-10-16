# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-tdd` step for phase 1 of run `2026-10-16-fix-stale-tab-health`. Phase 1 (save format v4 and the pure `writeVerdict`) is committed as `c0d8343`; the store does not call `writeVerdict` yet. The next agent must not get wrong: `generation`/`writer` are stamped by the STORE inside its transaction (`encodeSave` emits placeholders `0`/`''`), the default `writer` is a fresh random id per `createIdbSaveStore` call, and `base` moves only when a put's transaction completes.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | identity, research, plan, plan review, `c0d8343` (phase 1 code+tests), then a docs commit with this handoff and the plan ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is NOT yet set by this step (left as `plan_reviewed`; phase 2 agent sets it) |
| `## Progress` rows remaining | 53 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/save.ts` | `SAVE_VERSION` 4, `MIGRATIONS[3]`, `saveProblem` checks `generation`/`writer`, `encodeSave` placeholders, `OTHER_WRITER_SAVE`, `WriteVerdict`, `writeVerdict` |
| `src/core/types.ts` | `SaveV4`, `SaveState = SaveV4` |
| `tests/saveV4.test.ts` | new, 20 tests (format, migration on populated fixtures, `writeVerdict` table) |
| `tests/fixtures/save-v4.json` | new frozen v4 fixture (generation 5, writer `fixture-writer`); v1-v3 untouched |
| `tests/{save,saveFile,autosave,e2eSave,legacySalonMigration,idbStore}.test.ts` | version literals to 4 / `SAVE_VERSION`, v3 fixture decodes to v4 (`migratedFrom 3`), `backup-v3` store test, "v5 is future" |
| `tests/e2e/{salon-load-health,save-backup-health,salon-art,save-migration}.spec.ts` | `writtenVersion` compares to `SAVE_VERSION`; titles say v4 |
| `context/changes/stale-tab-and-health/plan.md` | rows 1.1-1.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, with a `writeVerdict` stub that throws, v3 code) | `tests/saveV4.test.ts`: 15 of 20 failed; first assertion `AssertionError: expected 3 to be 4` (`is the current version`); then `MIGRATIONS[3] is not a function`, `expected null to be 3` (migratedFrom) |
| GREEN | `tests/saveV4.test.ts` 20/20; full `npm test` 171 files, 3098 passed |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3098 = baseline 3076 + 22 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | ran ONCE outside the sandbox: Chromium starts; the four touched specs (`save-migration`, `salon-load-health`, `save-backup-health`, `salon-art`) 14 passed. Full `--workers=4` suite NOT run here: left to the orchestrator gate (row 1.5) |
| `git diff --stat HEAD~1 -- tests/fixtures` | only `save-v4.json` added (+77); v1-v3 byte-identical |
| Deliberate break 1 | `MIGRATIONS[3]` returning `{ ...raw, version: 4 }`: 7 tests red (lift test, every `migratedFrom` fixture row, populated-v3 game, import of v3); restored, green |
| Deliberate break 2 | `writeVerdict` ignoring `writer`: `puts after its own write that is ahead` red; restored, green |
| Meta-check | both breaks prove the format and the pure rule on frozen data (fixtures, table), not the IDB transaction (phase 2) |

## 4. Next command

`/10x-tdd stale-tab-and-health phase 2`

## 5. Open

- **Rows left in phase 1**: 1.5 e2e full suite (orchestrator, `baseline + 0`); 1.6 [reviewer] `save.ts` has no browser globals, `MIGRATIONS[3]` total, older fixtures untouched.
- Phase 2 must make `createIdbSaveStore` call `writeVerdict` inside `guardedPut` (store default `writer` random per call; `base` from `read()`); `replace` uses mode `'replace'`; the e2e seam store `e2eSaveStore` (`src/testing/e2eHook.ts`) still uses `storedVersionNewer`.
- Carried from the plan review (unchanged): [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; Known risks (reload race, stale-window `replace` summary, `register-failed` + `console.warn`); DESIGN-GAPs 116-121 in phases 3, 4, 6, 7, 8, 9; e2e phases 11-12 use the request-file protocol; follow-ups listed in plan phase 10 § 2.

## 6. Autonomous decisions

- **Mixed phase gate**: phase 1 is TDD (pure format and rule) plus mechanical version-literal edits in existing tests and four e2e specs; TDD'd the pure part, edited literals inline; the phase keeps `Driver: tdd`. Would change: nothing.
- **RED via stub**: `writeVerdict` and `OTHER_WRITER_SAVE` stubbed first so the quoted RED is an assertion; the `writeVerdict` rows went red on the stub throw, the format rows on `expected 3 to be 4`.
- **Tests that used `save-v3.json` as "the current valid save"** (strict-validation, `saveProblem` agreement, broken-field cases) now use `save-v4.json`; v3 is kept where the point is migration (`migratedFrom 3`).
- **Commit message** taken as proposed; stage by path; ticks written in a second docs commit with the sha. `change.md` status left for the next phase (not touched by this step).
- **Full e2e not run** (4 touched specs only): the orchestrator runs it at the gate.
