# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 3` step. Phases 1 (66c6989), 2 (739d10c) and 3 (d3c2f4b) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and only the reversals listed in §5 may change existing tests.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phase 1 = 66c6989, phase 2 = 739d10c, phase 3 = d3c2f4b (`feat(save-truth): unavailable starts counter (p3)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 68 (`grep -c '^- \[ \]' plan.md`); 3.1–3.5 ticked, 3.6 [reviewer], 3.7 [visual], 3.8 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/storage/startCounter.ts` | new: `createStartCounter(storage)` with `read`/`bump`/`reset` over `localStorage` key `martynka:unavailableStarts`; every access in try/catch, a failure reads 0 and `bump` then returns 1 |
| `src/core/autosave.ts` | `AutosaveStatus.unavailableStarts` and `AutosaverOptions.unavailableStarts` (runtime only); `replaceGate` unavailable branch needs `!timeout && force && unavailableStarts >= balance.save.forceAfterStarts` (core now imports `data/balance`, as other core files do) |
| `src/core/saveFile.ts` | `deviceSaveView` cause `unavailable-first` for a non-timeout refused read that is not yet forceable |
| `src/data/balance.ts`, `src/data/pl.ts`, `docs/design-gaps.md` | `save.forceAfterStarts: 2`; `saveTransfer.deviceUnavailableFirst`; gap row 126 |
| `src/ui/dom/saveSummaryView.ts` | `blockedText` maps the new cause |
| `src/main.ts` | after the final `outcome`: bump on `unavailable` that is not a timeout, reset on `loaded`/`fresh`, pass `unavailableStarts` to the autosaver |
| tests | `tests/startCounter.test.ts` (new), `tests/autosave.test.ts`, `tests/saveFile.test.ts`, `tests/saveHealth.test.ts` (status helper), `tests/e2e/save-transfer-blocked.spec.ts` |

## 3. Verification

| command | result |
|---|---|
| RED (stub `startCounter` returning -1, gate not yet changed) | 6 failures, all assertions: `tests/startCounter.test.ts` "counts consecutive bumps…": `AssertionError: expected -1 to be +0`; `tests/autosave.test.ts` "replaceGate covers every combination": `{"blockedBy":"unavailable",…,"unavailableStarts":0,"force":true}: expected 'ok' to be 'Blocked'`; "unavailable needs force AND a second consecutive start…": `expected undefined to be 1`; `tests/saveFile.test.ts` unavailable-first case: `expected { kind: 'blocked', …(2) } to deeply equal …` |
| Deliberately reversed existing tests | `autosave.test.ts` "unavailable needs force…" (renamed, gets a count: 1 → `Blocked` with force, 2 → `ok`), its "failed forced write" case (count 2), and the `replaceGate covers every combination` oracle (new `unavailableStarts` dimension); `saveFile.test.ts` `st()` helper defaults to count 2 so the old forceable cases keep their meaning, lockstep test loops over counts 1 and 2; e2e `save-transfer-blocked.spec.ts` #2 (first start shows `deviceUnavailableFirst`, no `force` button) and SIR-02 (loads the seam twice before forcing) |
| GREEN | `npm test` 3430 passed (branch baseline after p2: 3426, +4) |
| `npm run lint` / `typecheck` | OK |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), both edited `save-transfer-blocked.spec.ts` tests green |
| `tests/saveKeys.test.ts` | green unchanged (the counter key is not in `SAVE_KEYS`/registry) |
| Deliberate break | (a) `replaceGate` without the `unavailableStarts` condition: 3 tests red (new gate case, combination oracle, unavailable-first view); (b) `bump` returning 2 when the write throws: the throwing-storage test red (`expected 2 to be 1`); both restored. Meta-check: proves the rule and the module; the two-load path is proven only by the e2e spec |

## 4. Next command

`/10x-tdd save-truth phase 4`

## 5. Open

- Rows 3.6 [reviewer], 3.7 [visual] (import dialog on the first and second `unavailable` start at 1440 and 1024×768) and 3.8 [human] (accept second-start rule and wording of gap 126) are not ticked. Also open from phase 2: 2.5 [reviewer], 2.6 [visual].
- Phase 4 rule: no code path deletes or overwrites a `backup-v<N>` key (plan "Critical Implementation Details").
- Phases 5, 10, 11 keep their listed reversals; the review fixes F1–F6 (phases 4–9) apply; plan.md is the source.
- Follow-ups: phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. No mixed-phase question: the whole phase was TDD (Driver stays `tdd`); `main.ts` wiring and the `blockedText` mapping were done inline after RED.
2. `createStartCounter(storage)` factory (like `createSoundPrefStore`) instead of bare `bump()`/`reset()` functions, so tests inject a fake storage. Would change: a wish for module-level functions.
3. A `timeout` read neither bumps nor resets the counter (it is never forceable and says nothing about a refusing store). Would change: wanting timeouts to count.
4. `unavailableStarts` is optional in the gate status (default 0) so `Pick<AutosaveStatus,…>` callers compile; the gate then treats an absent count as the first start.
5. `deviceSaveView` cause `unavailable-first` is derived from `replaceGate(status, true)` not being `ok`, so the dialogs keep one rule.
6. e2e `child-flow-guards` did not flake this run. Commit message and next-phase prompts decided in place; the run stops after this phase.
