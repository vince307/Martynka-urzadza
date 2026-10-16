# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 1` step. Phase 1 (decode truth) is committed as 66c6989 and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, `tests/fixtures/` only gained a new file), and the deliberate reversals listed in §5 are the only tests allowed to change.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | 5 on the branch; phase 1 = 66c6989 (`feat(save-truth): decode truth (p1)`), plus `docs(save-truth): handoff p1` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 77 (`grep -c '^- \[ \]' plan.md`); 1.1–1.5 ticked, 1.6 [reviewer] and 1.7 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/save.ts` | `DecodeResult` corrupt variant carries `from` and `problem`; `decodeSave` fills them (`saveProblem` after the migration loop, `exception:<Name>` in the catch) |
| `src/core/autosave.ts` | `LoadOutcome.unreadable` carries optional `from`/`problem`/`step`; `loadSave` copies them; the `InvalidSave` message names `saveProblem` |
| `src/core/saveHealth.ts` | `cardCopyFor(kind, reason, error, from)` gives `migrationFailed` for corrupt with `from < SAVE_VERSION`; new `unreadableCode` |
| `src/main.ts` | card `Kod:` uses `unreadableCode`; card copy gets `from`; the start warn names the code |
| `src/testing/e2eHook.ts` | `e2eSaveStore` seam `corrupt` is now `{ version: SAVE_VERSION, stars: 'many' }` |
| `tests/save.test.ts`, `tests/e2eSave.test.ts`, `tests/legacySalonMigration.test.ts`, `tests/saveHealth.test.ts`, `tests/autosave.test.ts` | corrupt cases now carry `from`/`problem`; new cases: v4 bad stars, throwing getter, `cardCopyFor` with `from`, `unreadableCode`, `loadSave` corrupt, v1 old-salon fixture to v4 |
| `tests/fixtures/save-v1-legacy-salon.json` | new frozen v1 save with the old salon (tasksDone 6) |
| `context/changes/save-truth/plan.md` | rows 1.1–1.5 ticked with 66c6989 |
| `context/changes/save-truth/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| RED (before the change, stub `unreadableCode`) | 38 failures in the 5 files, all assertions, e.g. `tests/save.test.ts` "corrupt: null": `AssertionError: expected { kind: 'unreadable', …(1) } to deeply equal { kind: 'unreadable', …(3) }`; `tests/saveHealth.test.ts` cardCopyFor: `expected 'failed' to be 'migrationFailed'` |
| GREEN | targeted suites green after the change |
| `npm run lint` / `npm run typecheck` | OK (one `no-unsafe-assignment` in my test fixed with a cast) |
| `npm test` | 3421 passed (baseline 3416, +5) |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 126 passed + 1 known flake (final-art-loading #15), which passed alone (2 passed); baseline 127, so 127 + 0; `save-restart` and `save-transfer-blocked` green with the new `corrupt` seam |
| `git diff --stat tests/fixtures` | no edit of an existing fixture; one new file |
| Deliberate break 1 | `problem` forced to null after the loop: 19 tests red (bad stars/variants cases, e2eSave corrupt); restored. Meta-check: proves the decode report only, not the card rendering (rows 1.7 and phase 15) |
| Deliberate break 2 | removed the `from < SAVE_VERSION` branch in `cardCopyFor`: its C-2r case red; restored |

## 4. Next command

`/10x-tdd save-truth phase 2`

## 5. Open

- Rows 1.6 [reviewer] and 1.7 [visual] (card `Kod: corrupt/stars` at 1440 and 1024×768) are not ticked.
- Phase 2 deliberately reverses: `tests/autosave.test.ts` "a %s save is still replaced (the way out)" and `tests/saveFile.test.ts` "an unreadable (%s) save is named, never summarised (overwriting stays allowed)"; the other reversals of the earlier handoff stand (phases 3, 5, 10, 11).
- The plan's review fixes F1–F6 (phases 4–9) are unchanged and still apply; plan.md is the source.
- `LoadOutcome.unreadable` uses optional `from`/`problem`/`step` so the `future` case keeps its exact shape; phase 2's gate can read `loadReason` and `from` from the status.
- Follow-ups: phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Mixed phase question: none arose; the whole phase was TDD, the seam change in `e2eHook.ts` and `main.ts` wiring were done inline after RED (Driver stays `tdd`).
2. Shape-check failures (`!isRecord`, bad version) report `from: null, problem: null`, so the card code is plain `corrupt`. Rejected: `problem: 'version'`. Why: plan says null at the shape check. Would change: a wish for a field name there.
3. Kept the `future` and `unknown-version` outcomes unchanged (no `from`), so existing exact `toEqual` tests stay. Would change: a later phase needing `from` for those.
4. `cardCopyFor` takes `from` as a fourth optional parameter instead of changing the existing signature. Would change: a caller needing an object argument.
5. e2e #15 flaked once and passed alone, per the contract rule; recorded, not treated as a regression.
6. Commit message and next-phase prompts decided in place: the planned set was committed and the run stops after this phase.
