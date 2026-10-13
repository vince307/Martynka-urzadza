# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-tdd phase 2` step of run `2026-10-13-s12-s14`. Phase 2 is committed (sha in `git log`, subject `test(save-export-import-reset): … (p2)`); rows 1.4 (orchestrator e2e) and 2.1-2.3 ticked. The next agent must not get wrong: `parseImport` always goes through `decodeSave`; `validateSave` is now `saveProblem(v) === null`; `rawExportText` stays until phase 6.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phase 1 `2e435cf`, phase 2 commit, plus handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` or `plan_reviewed` (not edited by this step) |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/saveFile.ts` | new: `SAVE_FILE_APP`, `exportFileText`, `parseImport`, `saveSummary`, types `ExportInput`, `ImportResult`, `ImportRejection`, `SaveSummary` |
| `src/core/save.ts` | `saveProblem` (first bad top-level key); `validateSave` now `saveProblem(v) === null` |
| `src/data/balance.ts` | `balance.save.importMaxBytes = 1_000_000` |
| `tests/saveFile.test.ts` | new, 36 tests |
| `context/changes/save-export-import-reset/plan.md` | Progress 1.4, 2.1-2.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs: `parseImport` always `not-json`, `saveProblem` null, `saveSummary` stars -1) | 31 failed, e.g. `AssertionError: expected { kind: 'rejected', …(2) } to deeply equal { kind: 'ok', …(2) }`; `AssertionError: expected null to be 'version'` |
| GREEN | `npm test`: 1224 passed (branch baseline 1188, +36) |
| lint / typecheck / deploy tests / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)`. One lint error (`no-base-to-string` in a test) fixed |
| `git diff --stat tests/fixtures` | empty |
| e2e `npx playwright test` | NOT RUN OK: Chromium cannot start here (tests failed to launch, 16 did not run). The orchestrator must run e2e; phase 2 changes no UI or `main.ts` |
| Break B1: `parseImport` skips `decodeSave` | red (7 tests: envelope, bare, future, ...); restored |
| Break B2: no size limit | red: "text longer than the limit is too-big"; restored |
| Break B3: `saveProblem` without the `stars` check | red: "negative stars is corrupt and names the field" plus 4 earlier save tests; restored |
| Meta-check | B3 is also caught by older `validateSave` tests, because `validateSave` shares the code now; the `saveProblem`-specific proof is the "names stars" / agreement tests. B1/B2 target the plan's rule (parsable is not valid; limit before parse) |

## 4. Next command

`/10x-tdd save-export-import-reset phase 3`

## 5. Open

- Orchestrator: run `npx playwright test` (33 expected) on the phase 2 commit; no UI changed.
- 2.4 `[reviewer]` row not mine.
- `exportFileText` throws only for a non-serialisable `save` kind (cannot happen for a `SaveState`).
- Carried: DESIGN-GAP rows 46-51, e2e request-file protocol for phases 4-7, human checklist, follow-ups in phase 6.

## 6. Autonomous decisions

- TDD gate: `saveFile.ts`, `saveProblem`, `importMaxBytes` absent and testable; driver stays `tdd`. Not mixed: `balance.ts` constant added inline with the GREEN step.
- Stubs first so RED is an assertion failure.
- `saveProblem` returns `'version'` for a non-record (first key checked); `validateSave` delegates to it.
- Bare-save acceptance requires no `app` key and numeric `version`; an `app` of another game is `not-ours`.
- Manual gate, commit message, next-phase question decided in place; planned set only, stopped after the phase.
