# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-tdd task-round-stars phase 1` of autonomous run 2026-10-12-s04-s08. Phase 1 is committed (9f57306); phases 2–11 are untouched. Do not give BONDS a fixed 4 tiles or a range starting at 1: `tileRange` is `{0, sum}` and `generateTask` trims the tile count to the range size.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs (identity, research, plan, plan review) + `9f57306` (feat p1) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 51 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generateTask.ts` | New entry point: runs the registered generator, adds `numberChoices` tiles for `'tiles'` skills with a numeric answer and no generator choices; count trimmed to range size; throws on unknown type |
| `src/core/tasks/types.ts` | `Task.tileRange?: { min; max }` |
| `src/core/tasks/generators/bonds.ts` | returns `tileRange { min: 0, max: total }` |
| `src/data/balance.ts` | New: `balance.tiles.count = 4` (later phases extend) |
| `src/data/curriculum/E1.ts` | helper `skill` default answer is now `'tiles'` (the 10 numeric E1 skills; E1 has no keypad skill) |
| `scripts/sample.ts` | calls `generateTask` with `balance.tiles.count`, prints tiles |
| `tests/generateTask.test.ts` | New, 86 tests over real stage data (see §3) |
| `context/changes/task-round-stars/plan.md` | Progress rows 1.1–1.4 ticked with 9f57306 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `generateTask` returning the bare generator task) | 2 assertion failures: `E1.3.add_sub_5: expected 'keypad' to be 'tiles'` and `TypeError: tiles is not iterable` (BONDS tiles undefined); the other 84 passed on the stub |
| GREEN | `npx vitest run tests/generateTask.test.ts` 86 passed |
| Deliberate break 1 | `generateTask` returns the task without tiles: 10 per-skill tests (all E1 numeric skills) + the BONDS test red; restored. Meta-check: the tests iterate `stages` (real data), and fail on the tile presence assertion, not on a synthetic skill |
| Deliberate break 2 | BONDS `tileRange.max = total + 1`: BONDS test red (1 failed); restored |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | Tests 527 passed (baseline 441, +86); deploy tests and `sample` E1–E6 `Naruszenia: 0` |
| `npm run build` | exit 0 |
| `npx playwright test` | 1 passed (baseline 1, +0) |

## 4. Next command

`/10x-tdd task-round-stars phase 2`

## 5. Open

- Manual row 1.5 `[reviewer]` (teacher read of E1 tiles incl. BONDS 3 tiles at sum 2) is NOT ticked; sample output looked sane (e.g. `2 = 1 + □ → 1 [1 / 2 / 0]`).
- Phase 2 leak definition (plan Phase 2 §1): numeric answer → last number of `hint[0]` equals answer; strings/arrays never.
- Earlier carried items unchanged: Known risks in plan, human rows 8.5, 10.5–10.8, `[visual]` rows 5.6, 6.4, 7.4, 8.4, DESIGN-GAPs and follow-ups written in Phase 10.
- Note: `tests/generateTask.test.ts` also asserts every `'keypad'` skill has a non-negative integer answer; `'select'`/array answers are skipped.

## 6. Autonomous decisions

1. **Tile fallback bound.** When a `'tiles'` skill has neither `tileRange` nor `boundOf`, `generateTask` uses `answer + tileCount` as max rather than throwing. Rejected: throw. Why: no such skill exists today and the test over all real skills would catch a bad range. Would change: a skill that needs a hard bound (then add its `tileRange`).
2. **E1 default answer in the helper.** Changed the `skill` helper default to `'tiles'` instead of editing 10 call sites; existing explicit `'tiles'` arguments stay. Rejected: per-skill edits. Why: minimal diff, E1 comment states the rule. Would change: an E1 skill that must use the keypad.
3. **Prompts of the Skill's questions** (exec mode, commit message, next phase) decided in place: implement here, proposed message with Polish title, stop after phase 1.
