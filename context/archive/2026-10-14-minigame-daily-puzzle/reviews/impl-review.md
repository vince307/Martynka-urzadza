<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Minigry (Hasło z wyników, Zakrywanka) i zagadka dnia za podwójne gwiazdki

- **Plan**: context/changes/minigame-daily-puzzle/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13
- **Date**: 2026-10-14
- **Verdict**: APPROVED (after the in-review fixes)
- **Findings**: 0 critical, 4 warnings (3 fixed, 1 recorded), 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Save format v2: one-way door, checked at the code level

Every path below was read in the code; none loses or overwrites a healthy save.

| Claim | Where (file, symbol) | Result |
|---|---|---|
| v1 migrates at read | `src/core/save.ts` `decodeSave` loop over `MIGRATIONS`; `MIGRATIONS[1]` spreads the input (never mutates it) and adds the starting `variants` | holds |
| the migrated save is validated | `decodeSave` → `validateSave(current)` (strict `saveProblem`, including `validVariants`) before `toSession` | holds |
| `backup-v1` is written BEFORE the first v2 write | `src/core/autosave.ts` `createAutosaver` `attempt`: `store.backup(migrated.raw, migrated.from)` then `store.write`; `src/storage/idb.ts` `createIdbSaveStore` `backup` writes `profile:default:backup-v1`, never the main key; `main.ts` passes `migrated` from `LoadOutcome.loaded.raw` | holds; deliberate break re-executed (below) |
| a failing backup blocks the write and never fails the load | `attempt` throws before `store.write`, `dirty` restored, next attempt retries the copy; `loadSave` never calls `backup` | holds (`tests/autosave.test.ts` "a failing copy writes nothing…") |
| v3 read by v2 is `future`, never overwritten | `decodeSave` `from > SAVE_VERSION` → `future`; `blockedBy: 'unreadable'` stops autosave; `replaceGate` returns `Blocked` for `loadReason === 'future'` even with `force`; `deviceSaveView` reports `blocked/future` | holds (`tests/save.test.ts` uses `SAVE_VERSION + 1`) |
| a failed migration keeps the old save | a throwing step → `{ unreadable, reason: 'migration-failed' }` → `blockedBy: 'unreadable'` → no autosave write; card `pl.saveMigrationFailed` with export | holds; forced import/reset over it allowed like `corrupt` (plan-review F7, follow-up, row 10.6) |
| a v1 export imports | `src/core/saveFile.ts` `parseImport` → `decodeSave` (migrates) → ok with starting `variants`; `importProblem` names the problem after migration | holds (`tests/saveFile.test.ts`) |
| frozen v1 fixtures byte-identical to main | `git diff --stat main..HEAD -- tests/fixtures/save-v1.json tests/fixtures/save-v1-fresh.json` | empty |
| replace (import/reset) over a migrated v1 save without a backup | `Autosaver.replace` writes directly (`tests/autosave.test.ts` "replace never copies") | judged NOT a must-fix: import and reset are the parent's explicit choice after the summary step (reset exists to discard the save), and adding the copy there would let a permanently failing backup block the parent's only way out. Kept as the recorded follow-up (F5) |

## Findings

### F1 — E5–E6 learners get the E3–E4 daily puzzle pool

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/core/puzzles.ts `puzzlePool`; tests/puzzles.test.ts (E6 gets the whole pool)
- **Detail**: Plan decision 10 and row 10.6 say "zagadki tylko E3–E4, inne etapy dostają minigrę"; the phase 5 contract ("stage <= learner stage within puzzleStages") lets E5–E6 draw all 15 puzzles (`npm run sample -- E5 --variants` prints "Zagadki E5: 15"). The puzzles are in range for E5–E6 and pay ×2 there too: a wording mismatch, not a content or safety bug.
- **Fix**: Let the author decide at row 10.6 (keep, or make `puzzlePool` return [] outside `balance.variants.puzzleStages`). Recorded in follow-ups/review-fixes.md with a trigger; the existing follow-up line was corrected.
  - Strength: no behaviour change without the author; the [human] row is already the decision point.
  - Tradeoff: E5–E6 behaviour differs from the plan text until decided.
  - Confidence: HIGH — the pool is the only place deciding it.
  - Blind spot: None significant.
- **Decision**: RECORDED (follow-up, Trigger: author's read of row 10.6)

### F2 — A word round that cannot be drawn fell back to an ordinary round

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `freshRound`
- **Detail**: Plan phase 6 § 2: `buildWordRound` → `null` means dice. `wordAvailable` only checks that pools exist, so a null build fell through to an adaptive round counted as `'round'`, which keeps the counter due; with `lastMinigame === 'dice'` the word round was chosen again every round and dice never came. Unlikely today, but it contradicts the plan.
- **Fix**: `freshRound` builds the dice board when the word build fails and dice is on (`balance.variants.minigames`), returning `kind: 'dice'` so `afterRound` records it.
- **Decision**: FIXED (fix commit)

### F3 — `localDay` test passed under UTC for a `toISOString` regression

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: tests/day.test.ts
- **Detail**: dates built from local fields in a UTC process (CI) give the same day for `toISOString().slice(0, 10)`, so the test protecting the midnight rule was vacuous in CI.
- **Fix**: the test runs under `TZ=Pacific/Kiritimati` (UTC+14, set and restored in the file). Break re-executed: `localDay` as `toISOString().slice(0, 10)` → red "expected '2026-01-05' to be '2026-01-06'"; restored; green also with `TZ=UTC` in the shell.
- **Decision**: FIXED (fix commit)

### F4 — parent-settings #14 load flake (random round with drag tasks)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/parent-settings.spec.ts (three round tests)
- **Detail**: the tests drew random E3 rounds; a block-drag or clock-set task failed under load (3× in this run, 16/16 alone).
- **Fix**: `PINNED_SKILL = 'E3.2.add_sub_20_bridge'` through `?e2eSkills` (e2e build only) in the hold-gate, stage-change and progress-preview tests; the preview test also asserts the miss is on the pinned skill (an unplayable id would fall back to a random round silently). Nothing the tests prove depends on the task mix; the E4 round after the stage change stays adaptive. Proof: `--repeat-each=4` → 16/16 passed (2.2 min); full suite 71/71.
- **Decision**: FIXED (fix commit)

### F5 — `replace` over a migrated v1 save takes no backup; a permanently failing backup blocks every write

- **Severity**: 💬 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `createAutosaver` `replace`, `attempt`
- **Detail**: see the table above; both already in follow-ups/review-fixes.md with triggers (plan-review F5).
- **Fix**: none now (judged).
- **Decision**: ACCEPTED (follow-ups)

### F6 — Dead and wrong strings, stale doc and comment

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/pl.ts `minigames.puzzleDone` / `diceCover` / `wordHint`; docs/design-gaps.md row 82; src/testing/e2eHook.ts `e2eSaveStore` doc comment
- **Detail**: three unused strings, one wrong for the puzzle (“Jeszcze jedna gwiazdka” while it pays 2); gap 82 claimed `MinigameDoneCard` also ends the puzzle (it ends on `SummaryPanel`); the `corrupt` seam comment said "a current-version save" (it is a v1 save that migrates, then fails validation).
- **Fix**: strings removed, row 82 and the comment corrected.
- **Decision**: FIXED (fix commit)

### F7 — p13c e2e break is red only 1 of 6

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/daily-puzzle.spec.ts "the next day brings the puzzle back"
- **Detail**: the `pickPuzzle`-ignores-`puzzlesDone` rule is a seeded draw in the browser; it is proven every time by two unit tests in tests/variants.test.ts, and p13d (puzzle only when `puzzleDay === null`) turns the spec's main claim red deterministically. The spec does not survive its named claim, so not CRITICAL.
- **Fix**: none.
- **Decision**: ACCEPTED

### F8 — Day of the puzzle, board size, widget geometry, src → tests import

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/TaskScene.ts `countRound`; src/ui/widgets/CoverBoard.ts, src/core/minigames/dice.ts `diceBoard`/`MAX_RESULT`/`MINUS`; src/ui/widgets/Dice.ts, LetterTiles.ts; src/testing/e2eHook.ts (imports tests/fixtures/save-v1.json)
- **Detail**: `puzzleDay` is the finish day; the board is sized from `balance` while the throws are `min(throws, max + 1)`; geometry literals in widgets; `LetterTiles` re-creates Text objects each render; the hook imports a test fixture (absent from `dist/`, checked).
- **Fix**: recorded as follow-ups F5–F8 in follow-ups/review-fixes.md with triggers.
- **Decision**: RECORDED

### F9 — Small contract drifts with no effect

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/autosave.ts `SaveStore.backup(raw, from)`; src/core/minigames/dice.ts `DiceThrow`
- **Detail**: plan said `backup(raw)`; the key is the same (`profile:default:backup-v1`). Dice pips live on `DiceThrow`, not on `Task.visual`. Both consistent through phases 3–13.
- **Fix**: none.
- **Decision**: ACCEPTED

### F10 — Teacher read

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/puzzles.ts, src/core/minigames/{word,dice}.ts, src/data/pl.ts
- **Detail**: `npm run sample -- E1|E3|E4|E5 --variants`, 0 violations. All 15 puzzles read: numeral agreement right ("3 piętra", "7 pięter", "3 wagony", "5 wagonów", "7 osób", "4 osoby", "2 litry", "3 litry", "4 śliwki" in "tyle, co 4 śliwki"), ordinals agree ("na drugim/czwartym/piątym piętrze", "czwarty od początku i szósty od końca"), verb gender right ("Winda … stanęła", "Bartek mieszka"), every answer unique, distractors close and unambiguous (17/18/19 with 18 even and 19 excluded; 2/3/8 for 5 − 3), first hints set up the method without the result. Hasło: E1 tasks within 10, E3 within 20 with bridging, E4 within 100, E5 with × and :, three tiles with near-miss and digit-swap distractors; dice hints "Policz razem oczka obu kostek." / "Odejmij oczka drugiej kostki." / "Zacznij od 6 i odejmij 4." correct; the board covers 0–12 once. Save texts (`saveFuture`, `saveMigrationFailed`, `saveMigrated`, import `fileInfo`) short, calm, no jargon. No defects.
- **Fix**: none.
- **Decision**: PASS

## Reviewer rows ticked

1.5 (`core/save.ts` pure; SIR-01 guards key on `loadReason`), 2.5 (no path overwrites v1 without the copy except the parent's explicit replace, judged above), 3.5 (save texts), 4.4 (`variants.ts`/`day.ts` pure, numbers from `balance.variants`), 5.5 (15 puzzles), 6.5 (E1/E3/E5 variants), 7.5 (`finishRound` → `finishVariant` never calls `endRound`; `freshRound` commits nothing; no numbers or Polish text in the scene), 10.5 (every follow-up has `Trigger:`; no stale "two branches"/"v1 only" comments).

## Product rules

No fail state, no timer, wrong answers never remove stars (`round.ts` unchanged); the puzzle pays `starPerTask × puzzleMultiplier` (2) for the first and second try, 0 for the retype, no clean bonus; minigames pay 1 per task, no bonus — all through `variantRules` (`src/core/variants.ts`), the only place of that arithmetic; variants never reach `endRound`/`recordRound` (mastery untouched).

MERGE: CLEAR — no critical findings; the v1 → v2 save path keeps every healthy save (migration validated, backup before the first write, `future` and `migration-failed` never written), the full local gate and 71/71 e2e are green, and the one open plan mismatch (E5–E6 puzzle pool) is a [human] decision at row 10.6.
