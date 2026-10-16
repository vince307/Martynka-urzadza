# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 2` step. Phases 1 (66c6989) and 2 (739d10c) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and only the reversals listed in §5 may change existing tests.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phase 1 = 66c6989, phase 2 = 739d10c (`feat(save-truth): replace gate for saves that cannot be read (p2)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 73 (`grep -c '^- \[ \]' plan.md`); 2.1–2.4 ticked, 2.5 [reviewer] and 2.6 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `keepsOldSave(loadReason, loadFrom)`; `replaceGate` takes optional `loadFrom` and blocks `migration-failed`, `unknown-version` and migrated `corrupt` (`loadFrom < SAVE_VERSION`) without force; `AutosaveStatus.loadFrom` and `AutosaverOptions.loadFrom` (runtime only); `replace` logs `Busy` and `InvalidSave` (with `saveProblem`) refusals |
| `src/core/saveFile.ts` | `deviceSaveView`: those three map to `{kind:'blocked', cause:'unreadable', forceable:true}`; plain `corrupt` stays `{kind:'unreadable'}` |
| `src/ui/dom/saveSummaryView.ts` | `blockedText` has the `unreadable` cause, reusing `pl.saveTransfer.deviceUnreadable` (no new pl string) |
| `src/main.ts` | passes `loadFrom: outcome.from` to the autosaver |
| `tests/autosave.test.ts`, `tests/saveFile.test.ts`, `tests/saveHealth.test.ts` | reversed and new gate cases (see §3), `status()` helper has `loadFrom: null` |
| `context/changes/save-truth/plan.md` | rows 2.1–2.4 ticked with 739d10c |

## 3. Verification

| command | result |
|---|---|
| RED (before the change, no stub needed: no new symbols) | 9 failures, all assertions, e.g. `tests/autosave.test.ts` "a unknown-version save (from undefined) is refused without force and replaced with it": `AssertionError: expected { ok: true } to deeply equal { ok: false, error: 'Blocked' }`; `tests/saveFile.test.ts`: `expected { kind: 'unreadable' } to deeply equal { kind: 'blocked', …(2) }`; `replace logs every refusal`: `expected false to be true` |
| Deliberately reversed existing tests | `autosave.test.ts` "a %s save is still replaced (the way out)" (split: plain corrupt stays free), "a migration-failed load is replaceable like corrupt…" and the "replaceGate covers every combination" oracle (same reversal, gained a `loadFrom` dimension); `saveFile.test.ts` "an unreadable (%s) save is named, never summarised…" (split). The first and last are named by the plan; the middle two are the same rule in other tests |
| GREEN | 3426 passed after the change |
| `npm run lint` / `typecheck` | OK |
| `npm test` | 3426 passed (branch baseline after p1: 3421, +5); deploy scripts and `sample` E1–E6 OK; `npm run build` prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 126 passed + 1 failure, `child-flow-guards.spec.ts` #2 SV2-10 (puzzle not paid twice the same day); rerun alone: 2 passed. Not in the known-flake list; it is outside the changed code (puzzle/day), so recorded as a load flake. `save-transfer-blocked.spec.ts` green in the full run |
| Deliberate break | `replaceGate` unreadable branch back to `return 'ok'`: 5 tests red (the three refusal cases, the combination oracle, the migration-failed gate case); restored. Meta-check: proves the one gate used by `replace`; `deviceSaveView.forceable` calls the same gate with force, so it cannot see this break, and the dialog wiring is only proven by the e2e spec (plain corrupt keeps step one) |

## 4. Next command

`/10x-tdd save-truth phase 3`

## 5. Open

- Rows 2.5 [reviewer] and 2.6 [visual] (reset dialog over a `migration-failed` save at 1440 and 1024×768) are not ticked. Dialog code was not changed beyond the new `unreadable` cause text: the force step reuses the existing `forceable` branch and `forcedWarning`.
- Phase 3 deliberately reverses the "unavailable needs force…" test in `tests/autosave.test.ts` (gets a count); it adds `AutosaveStatus.unavailableStarts` next to the new `loadFrom`, and `replaceGate`'s status type already takes an optional field, so extend it the same way.
- Phases 5, 10, 11 keep their listed reversals; the review fixes F1–F6 (phases 4–9) apply; plan.md is the source.
- Follow-ups: phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. No mixed-phase question: the whole phase was TDD (Driver stays `tdd`); `main.ts` wiring (`loadFrom`) and the `blockedText` cause were done inline after RED.
2. `keepsOldSave` is exported from `autosave.ts` and used by both `replaceGate` and `deviceSaveView`, so there is one rule. Rejected: a copy in `saveFile.ts`. Would change: a layering rule against `saveFile` importing it.
3. `loadFrom` in the gate status is optional (`loadFrom?: number | null`) so existing callers and `Pick<AutosaveStatus,…>` objects keep compiling. Would change: wanting it mandatory.
4. Refusal logs for `Busy` and `InvalidSave` put the error in the message (`autosave: replace refused (Busy)`) so tests and the log read alike. Would change: a structured log field wish.
5. The extra reversed test and oracle (not named in the plan) were updated, not left red; recorded here as the same rule.
6. e2e `child-flow-guards` #2 failed once under load and passed alone; recorded, not treated as a regression. Commit message and next-phase prompts decided in place; the run stops after this phase.
