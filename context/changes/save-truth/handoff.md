# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 6` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2), 5 (3714f3c) and 6 (fc0f7f7) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-5 as before, phase 6 = fc0f7f7 (`feat(save-truth): "Zapis gry" mówi prawdę między uruchomieniami (p6)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 58 (`grep -c '^- \[ \]' plan.md`); 6.1-6.3 ticked, 6.4 [reviewer] and 6.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `AutosaveStatus` gained runtime-only `backupRecord`, `backupFailures`, `lastWriteError`, `lateWrite` ('landed'/'failed'/null), `fatalError`; `AutosaverOptions.backupRecord`; `withTimeLimit(work, timers, ms, onLate?)` attaches the observer only inside the timer callback (after the limit fired), result unchanged; the write goes through `limited(store.write, onLate)`, a good write clears `lateWrite`; `block(reason, error?)` keeps the name only for the first `fatal` block |
| `src/core/saveHealth.ts` | `migrationOf`: session that migrated (`migratedFrom !== null`) -> `pending` until `migrationWrittenAt`, then kept / lost / `uncertain` (skipped copy with a timeout error) / null while the copy is retried; other launches read `backupRecord`; `failing` carries `slow` (last failure timeout and `lateWrite !== 'failed'`); fatal code = `fatalError ?? lastError`; `earlierFailures` = `failures - backupFailures`, error from `lastWriteError` |
| `src/ui/dom/saveHealthView.ts`, `src/data/pl.ts` | `saveFailingTimeout` (gap 129), `saveMigrated.uncertain` (127), `saveMigrated.pending` (128) — the plan called them `settings.migration.*`; they live beside the existing `saveMigrated` |
| `src/main.ts` | reads `store.backupRecord()` before `createGame` (loaded/fresh only, bounded by `writeTimeoutMs`, a failure is just no line); the error boundary passes `errorName(error)` to `block('fatal', …)` |
| `docs/design-gaps.md` | rows 127-129 |
| tests | `tests/autosave.test.ts` describe "what the status keeps for the parent view (save-truth p6 …)" (5 tests); `tests/saveHealth.test.ts` describe "saveHealthView across launches (save-truth p6)" (4 tests) and the reversed/rewritten ones; `tests/saveTransferCopy.test.ts` pins the three strings |

## 3. Verification

| command | result |
|---|---|
| RED (production code untouched, new tests in place) | 11 failures, all assertions: `expected [] to deeply equal [ 'landed' ]` (onLate observer), `expected undefined to deeply equal { from: 2, result: 'lost', … }` (`backupRecord`), `expected null to deeply equal { Object (from, copy, ...) }` (record / pending lines), `expected { kind: 'off', cause: 'fatal', … } to match object { cause: 'fatal', code: 'TypeError' }`, `expected { kind: 'ok', lastWriteAt: null, … } to match object { kind: 'ok', earlierFailures: null }` |
| Deliberately reversed existing tests | named: "no migration line before the first write, even when the save was moved from v1 at the start" (now the `pending` line, plan 6 §2) and "a fatal block carries lastError as code, or null" (rewritten to `fatalError`, plan §4). Fixture-only consequence: the two "after a write the line says …" tests got `migrationWrittenAt: 5` because `migrationOf` now keys off it |
| GREEN | `npm test` 3456 passed (branch baseline after p5: 3447, +9) |
| `npm run lint` / `typecheck` | OK |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), no failures, no flakes. A first full run reported "Running 125 tests / 125 passed" (2 specs did not run in it, cause not found, likely overlap with my `--list` calls); the full rerun after killing stray servers on 4397/4398 ran all 127 and passed |
| `SAVE_VERSION`, fixtures | 4; `git diff --stat tests/fixtures` empty |
| Deliberate break | (a) `migrationOf` ignores the stored record: 1 red (`a later launch tells the fate of the old copy from the stored record`); (b) `withTimeLimit` observer attached at creation instead of after the limit: 1 red (`withTimeLimit tells an observer …`); both restored. A first attempt at (b) (rejecting inside the already-settled race) stayed green, so it proved nothing and was replaced. Meta-check: proves the view and the observer over fake timers, not that a real late IndexedDB write lands |

## 4. Next command

`/10x-tdd save-truth phase 7`

## 5. Open

- Row 6.4 [reviewer] and 6.5 [visual] not ticked. Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6, 5.4.
- The e2e specs for the new lines (`backuphang`, `backupfail`, `writehang` panel text) are not part of this phase; the existing specs pass unchanged. Phase 15 covers the browser path.
- `readBackups` at panel open is phase 9; here the record alone drives `uncertain`.
- `lateWrite: 'landed'` does not reset `consecutiveFailures` (the next good write does); only the sentence changes.
- Phases 10, 11 keep their listed reversals; plan.md is the source. Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. No mixed-phase question: whole phase TDD, Driver stays `tdd`; no redirect. RED observed with the tests first.
2. The strings sit in `pl.settings.saveMigrated` and `pl.settings.saveFailingTimeout`, not the plan's `settings.migration.*`, to keep one place for the migration line. Would change: a reviewer asking for the plan's names.
3. `pending` keys off `migrationWrittenAt === null` (plan wording) rather than `writes`; hence the fixture edit named in §3.
4. A copy still being retried after the first write yields no migration line (null), as before, so nothing is claimed early.
5. To satisfy V1 two runtime fields were added beyond the plan's list (`backupFailures`, `lastWriteError`); they are not in `encodeSave` or `SAVE_KEYS`.
6. The record is read before `createGame` so no state change can precede the saver; commit message and next-phase prompts decided in place; the run stops after this phase.
