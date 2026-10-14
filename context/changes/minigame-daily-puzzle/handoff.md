# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the implementation-review step: verdict APPROVED, `MERGE: CLEAR` (reviews/impl-review.md), fixes in `06ba5cf`, `change.md` is `impl_reviewed`. Next is the visual gate; the save format v2 is a one-way door, so the [human] row 1.6 must be accepted before the merge.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | docs + phases 1-13 + handoffs, review fix `06ba5cf`, this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`), all [visual]/[human]: 1.6, 3.6, 5.6, 7.6, 8.4, 8.5, 9.4, 9.5, 10.6 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/minigame-daily-puzzle/reviews/impl-review.md` | full review, save v2 code-level table, teacher read, `MERGE: CLEAR` |
| `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md` | review follow-ups F1, F5-F8 with `Trigger:`; puzzle-pool line corrected |
| `context/changes/minigame-daily-puzzle/plan.md` | [reviewer] rows 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 10.5 ticked |
| `context/changes/minigame-daily-puzzle/change.md` | status `impl_reviewed` |
| `src/scenes/TaskScene.ts` (`freshRound`) | a word round that cannot be drawn falls to dice (fix) |
| `tests/day.test.ts` | runs under `TZ=Pacific/Kiritimati` (fix) |
| `tests/e2e/parent-settings.spec.ts` | `PINNED_SKILL` via `?e2eSkills` in three tests (flake fix) |
| `src/data/pl.ts` (`minigames`), `docs/design-gaps.md` row 82, `src/testing/e2eHook.ts` (seam comment) | dead strings removed, doc and comment corrected |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK (before and after the fixes) |
| unit (`npm test` + deploy tests + `sample` E1-E6) | 2322 passed = baseline 2224 + 98; deploy/ops scripts OK; samples 0 violations |
| build | `e2e hook: absent (2 chunks checked)`; `e2eDay`/`e2eVariant`/`1760000001000` absent from `dist/_app/*.js` |
| e2e full, `--workers=4` (after the fixes) | 71 passed = baseline 63 + 8 (5.8 min); ports 4397/4398 free afterwards |
| parent-settings `--repeat-each=4` | 16/16 passed (2.2 min) |
| Break: backup moved after write (`attempt`) | 2 tests red in tests/autosave.test.ts (ops `['write','backup','write']`; a write despite a failing copy); restored |
| Break (TDD phase 4 RED): `puzzleDay !== today` → `>` | tests/variants.test.ts "offers the daily puzzle once per local day…" red (`'word'` vs `'puzzle'`); restored; meta: the test uses an earlier day, so it separates `!==` from `>` |
| Break: `localDay` = `toISOString().slice(0,10)` | tests/day.test.ts red under the pinned zone; restored; green with `TZ=UTC` too |
| v1 fixtures | `git diff --stat main..HEAD -- tests/fixtures/save-v1*.json` empty |
| Teacher read | `sample -- E1/E3/E4/E5 --variants`: 15 puzzles, Hasło rounds, dice boards read; no defects (impl-review F10) |

## 4. Next command

`visual gate`

## 5. Open

- Visual rows: 3.6, 7.6, 8.4, 9.4 (screens listed in plan.md `## Progress`).
- Human checklist: 1.6 (save v2 one-way door, accept before the merge), 5.6 (author reads the 15 puzzles), 8.5 (Hasło rule and words), 9.5 (finger taps on 160 × 136 fields), 10.6 (decisions against PRD/ZADANIA/kit; also decide F1: E5-E6 now get the E3-E4 puzzle pool via `puzzlePool` in `src/core/puzzles.ts`).
- Follow-ups: `follow-ups/review-fixes.md` (replace without backup and permanent backup failure in `src/core/autosave.ts` `replace`/`attempt`; `countRound` day; `CoverBoard` size vs `diceBoard`; widget geometry; hook importing the v1 fixture).
- Design gaps 79-87 in `docs/design-gaps.md` (row 82 corrected).

## 6. Autonomous decisions

1. `Autosaver.replace` over a migrated v1 save stays without the backup. Rejected: copying in `replace` (a permanently failing copy would then block the parent's reset, the only way out). Why: import/reset is the parent's explicit choice after the summary step. Would change: a parent report of lost progress after an update, or a v3 format change.
2. F1 (E5-E6 get the E3-E4 puzzles) recorded, not changed. Rejected: making `puzzlePool` empty outside `puzzleStages` now (a behaviour change the author has not asked for; the puzzles are in range). Would change: the author's answer at row 10.6.
3. Flake fix pins all three round tests of parent-settings to `E3.2.add_sub_20_bridge`, not only the preview test: tests 1 and 2 also answer a random first task. Would change: a claim of those tests that depends on the task mix.
4. p13c (red 1 of 6) accepted: the rule is proven by unit tests every time and p13d proves the spec's claim. Would change: a spec claim that only p13c covers.
5. Verdict APPROVED with `MERGE: CLEAR` although Plan Adherence is WARNING: the only open mismatch is a documented [human] decision.
