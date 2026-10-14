---
date: 2026-10-14T19:00:13+0200
researcher: Claude (autonomous run 2026-10-14-save-s13b-s15-s14b, research step)
git_commit: a0890f8
branch: feat/minigame-daily-puzzle
repository: Martynka-urzadza
topic: "S-15 minigame-daily-puzzle: save v2, round variants, Hasło z wyników, Zakrywanka, LOGIC puzzle pool"
tags: [research, save, migrations, round, TaskScene, minigame, logic-puzzles, design-gaps]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-15 minigame-daily-puzzle

**Date**: 2026-10-14T19:00:13+0200
**Researcher**: Claude (autonomous run 2026-10-14-save-s13b-s15-s14b)
**Git Commit**: a0890f8 (branch cut from `main` at 1441161)
**Branch**: feat/minigame-daily-puzzle
**Repository**: Martynka-urzadza

All anchors are file + symbol (line numbers are deliberately omitted; the run contract forbids them in artifacts).
`docs/zrodla/` was not read. Every puzzle in § 5 is written from scratch for this slice.

## Research Question

From `change.md` (decided inputs, roadmap corrections, triggered follow-ups) and the step prompt:

1. **Save v2**: the exact new fields, the `1 → 2` step in `MIGRATIONS` and its defaults, frozen v1 fixtures still
   loading plus a frozen v2 fixture, the `backup-v1` copy, SIR-01 (`future`) for a v3 save read by v2, a failed
   migration keeping the old save (FR-021), a v1 export file imported into a v2 build (`parseImport`), and which of
   two-build e2e / S12-14 / S13-06 (and the other triggered follow-ups) is cheap and honest now.
2. **Round variants**: how often a variant replaces a round (numbers for `balance.ts`), the "day" on a tablet, what
   happens when the child leaves or quits mid-variant, how ×2 maps onto `RoundRules`/`earn`, how mastery and the
   curriculum are (not) affected, and how the unlock card and the warm-up interact.
3. **Hasło z wyników and Zakrywanka**: which tasks per stage, the word list, the dice mechanics against a 5-task
   round, the answer modes reused, no fail state.
4. **LOGIC puzzles**: 10–15 original puzzles for E3–E4 of the five types in `docs/ZADANIA.md` § 4, their data model,
   answer modes and hint shape.
5. **Design**: the expansion pack's minigame screens, reusable widgets and dialogs, exact copy versus gaps.

## Summary

- **Save v2 is needed and cheap.** No round counter or calendar day is stored anywhere (`LearnerState` in
  `src/core/types.ts` has only `weakStreak`/`easedRounds`; `history` is capped at `balance.mastery.historyLength` 200
  answers and records no variant rounds). Add one top-level block `variants` to `SaveV2`; the `1 → 2` step only adds
  its defaults. `decodeSave` already turns a throwing step into `unreadable/'corrupt'` (old save kept, writes off);
  every SIR-01 guard keys on `reason === 'future'`, so bumping `SAVE_VERSION` to 2 keeps a v3 save safe. A v1 export
  file migrates on import with no extra code (`parseImport` → `decodeSave`). The migrated save is written by the
  normal autosave, not `Autosaver.replace`, so S12-02/03/11 stay untriggered.
- **Cheap and honest now**: `MIGRATIONS[1]`, `save-v2.json` (+ `-fresh`), L-S1 (a `migration-failed` reason),
  the `profile:default:backup-v1` copy before the first post-migration write, `?e2eSave=v1` as the two-build
  substitute, visual-gate O1 (a `future` card copy), S12-09 (file date/build in the import step), S12-14 (date in the
  raw copy file name). **Not now**: S13-06 (a different feature: the parent's mistake preview), a real two-build
  e2e (needs a third same-origin server), two instances / S12-15.
- **Variants plug into `TaskScene.freshRound`** as a third kind next to warm-up and adaptive; `finishRound` skips
  `endRound` for a variant (no mastery, unlock or easing). ×2 is `RoundRules.starPerTask: 2` for the puzzle round;
  `earn` needs no change. The day is a local `YYYY-MM-DD` computed in `src/main.ts` beside `month`, with an
  `?e2eDay=` seam in the hook build.
- **Hasło z wyników**: tasks from the learner's own adaptive pool filtered to numeric tile/keypad tasks, shown as
  tiles; the word comes from the salon slot captions in `pl.room.slots` (KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA, OBRAZ —
  the kit's SOFA, FOTEL, OKNO are not the game's words). **Zakrywanka**: 13 throws on a 0–12 board, each throw drawn
  so that its result is still uncovered (no dead throw, no fail state); the child taps the result on the board (kit).
- **LOGIC pool**: 15 original puzzles (9 from E3, 6 from E4) as `src/data/puzzles.ts` entries shaped like `Task`
  (prompt, answer, optional tiles, two hint lines), validated by `validateTask` with the noun dictionary; five new
  nouns (`piętro`, `wagon`, `osoba`, `paczka`, `śliwka`).
- **Design**: the kit (`designs/martynka-expansion-v1`) fully specifies both minigame screens (HUD title, prompt,
  dice/letter boards, feedback bar, completion card, exact copy); it has **no** daily-puzzle screen, no ×2 mark and no
  variant announcement (grep of every text file in `designs/` for zagadk/dnia/×2/x2/daily/puzzle: no design hit). The
  kit's dice answer is a **tap on the 0–12 board** (no tiles), the word answer is **3 tiles**; the kit has an
  on-demand "Podpowiedź"/"Pokaż" button that the current round flow lacks. New gap rows start at **79**.

## Detailed Findings

### 1. Save v2

**Today (observed).**
- `SAVE_VERSION = 1` and `MIGRATIONS` is an empty `Readonly<Record<number, Migration>>` (`src/core/save.ts`); key N
  lifts version N to N+1.
- `decodeSave(raw, migrations)` (`src/core/save.ts`): not a record / no integer `version` → `corrupt`; `from >
  SAVE_VERSION` → **`future`**; a missing step → `unknown-version`; the steps run inside one `try`, and **a throwing
  step is caught and becomes `unreadable/'corrupt'`** with the error dropped (this is follow-up L-S1); then
  `validateSave`, then `ok` with `migratedFrom: from < SAVE_VERSION ? from : null`.
- `saveProblem`/`validateSave` hard-code `value.version !== 1`, check the known fields only and do not reject extra
  top-level keys; `encodeSave` hard-codes `version: 1` and picks fields one by one; `toSession`, `SessionSave`,
  `freshSession` list the fields explicitly. Types: `SaveV1` (`version: 1` literal) and `SaveState = SaveV1`
  (`src/core/types.ts`).
- No persisted round counter or calendar day exists: `LearnerState` (`src/core/types.ts`) has `history` entries
  `{skillId, ok, firstTry, at, example?}`, `weakStreak`, `easedRounds`; history is cut to
  `balance.mastery.historyLength` (200 answers) in `src/core/mastery.ts`. Deriving "rounds since the last variant"
  from history is approximate (entries are answers, not rounds, and variant rounds would not be in it) — this confirms
  `change.md` decision 1 (v2 needed).

**Recommended v2 shape** (one new top-level block; the learner block stays as is):

```ts
interface VariantState {
  roundsSince: number;                       // completed adaptive rounds since the last finished variant (int >= 0)
  lastMinigame: 'word' | 'dice' | null;      // alternation of the two minigames
  puzzleDay: string | null;                  // local 'YYYY-MM-DD' of the last FINISHED daily puzzle
  puzzlesDone: string[];                     // ids of finished puzzles in the current cycle (rotation without repeats)
}
interface SaveV2 extends Omit<SaveV1, 'version'> { version: 2; variants: VariantState }
```

- `MIGRATIONS[1] = (v1) => ({ ...v1, version: 2, variants: { roundsSince: 0, lastMinigame: null, puzzleDay: null,
  puzzlesDone: [] } })` — pure, no reads of other fields, so the only realistic throw is a non-object input, which the
  earlier record check already rejects.
- `saveProblem` for v2: `version === 2` plus the `variants` block (non-negative integer, enum or null, `/^\d{4}-\d{2}-\d{2}$/`
  or null, string array). Unknown puzzle ids are kept and ignored at use (the pool may shrink in a later build).
- `encodeSave` writes `version: 2` and `variants`; `SessionSave` and `freshSession` get the defaults; a new
  `REGISTRY_KEYS.variants` joins `SAVE_KEYS` (`src/data/layout.ts`) so the normal autosave listener covers it.
- **Tests that change on purpose** (from the save worker): `tests/save.test.ts` builds its `future` case with
  `version: 2` (must become `SAVE_VERSION + 1`), and its "the v1 format did not change" block asserts
  `SAVE_VERSION === 1` and a v1 round-trip (becomes "each v1 fixture decodes to the expected v2 session").
  `tests/idbStore.test.ts` and `tests/saveFile.test.ts` use a v1 value as "the current save" and need a v2 helper.
- **Fixtures**: keep `tests/fixtures/save-v1.json` and `save-v1-fresh.json` byte-for-byte (the header of
  `src/core/save.ts` and the S-11 follow-up fix this convention); add `save-v2.json` and `save-v2-fresh.json`, frozen
  the same way.

**Write-back of a migrated save.** `loadSave` (`src/core/autosave.ts`) returns `loaded` with `session` and
`migratedFrom` and never writes; `main.ts` `start` does not use `migratedFrom`; the migrated session reaches IndexedDB
through the normal autosave on the first `SAVE_KEYS` change or a `flush('now')` (round end, purchase). It does **not**
go through `Autosaver.replace`, so follow-ups S12-02, S12-03 and S12-11 (all triggered only by a migration or import
through `replace`) stay untriggered on this path. Unverified: whether Phaser's boot emits a registry change before
the listener is attached (the worker did not check boot timing); either way the write is a normal autosave.

**`backup-v1` copy** (follow-up "v2 step + backup-v1"). `src/storage/idb.ts` stores under `profile:default` in
database `martynka`, store `saves`, through `createIdbSaveStore` (`read`/`write` with the lost-connection retry
`run`). A backup is one extra `set('profile:default:backup-v1', raw)`. Cost: `LoadOutcome.loaded` must carry `raw`,
`SaveStore` gains an optional `backup(raw)` (the in-memory e2e store too), and `createAutosaver`'s `attempt` calls it
once before the first write when `migratedFrom !== null` (the same place the existing `onFirstWrite` hook runs, which
keeps "backup before overwrite" ordered). A backup failure should block that first write (otherwise the backup is
decorative). Recommendation: in scope — it is the only protection when a migration bug is found after the v2 save
was written (FR-021). No restore UI in v1; the parent's "Zachowaj kopię" path is unchanged.

**SIR-01 for a v3 save read by v2.** `replaceGate` (`src/core/autosave.ts`) returns `'Blocked'` when `blockedBy ===
'unreadable' && loadReason === 'future'`; `deviceSaveView` (`src/core/saveFile.ts`) maps `loadReason === 'future'` to
`blocked/cause 'future'` and never forceable. Both key on the reason, and the only version comparison is `from >
SAVE_VERSION` in `decodeSave`, so bumping `SAVE_VERSION` to 2 makes a v3 save `future` with no other change. A test
with `version: SAVE_VERSION + 1` proves it.

**Failed migration keeps the old save (FR-021).** A throwing step → `corrupt` → the save-failed card, the saver
created with `blockedBy: 'unreadable'` and normal writes off (`writesOff`), so the stored v1 bytes are not
overwritten. L-S1 (cheap, recommended): a separate reason `'migration-failed'` (with the step number) so the card,
the "Zapis gry" section and `parseImport` can say "nie udało się przenieść zapisu" instead of "uszkodzony"; it must
stay forceable/exportable like `corrupt` (it is not a newer save). Test with an injected throwing migration (the
"migration chain" describe in `tests/save.test.ts` already injects migrations).

**Import of a v1 export into a v2 build.** `parseImport` (`src/core/saveFile.ts`) unwraps the envelope or a bare save
and calls `decodeSave`, so a v1 file migrates with no new code; rejections map `decoded.reason` directly (a v1 build
meeting a v2 file answers `future`). `exportFileText` and `saveSummary` do not hard-code a version. Add a test:
`parseImport(exportFileText(v1 fixture))` → ok, `variants` defaults.

**Triggered follow-ups — what is cheap and honest now.**

| Follow-up (recorded in) | Verdict | Why |
|---|---|---|
| `1 → 2` step, v1 fixtures kept, v2 fixture, backup-v1 (`context/archive/2026-10-13-autosave-versioned-save/follow-ups/review-fixes.md`) | **In** | Core of the slice; costs above. |
| L-S1 migration-failed reason (`context/archive/2026-10-13-save-export-import-reset/follow-ups/review-fixes.md`) | **In** | First real step; a reason literal plus copy. |
| Two-build e2e, test-plan risk #10 (`context/foundation/test-plan.md` § risks and rollout phase 4) | **Substitute in, real one out** | `playwright.config.ts` has two servers on two origins (4398 production, 4397 hook build); a real old-build-writes / new-build-reads test needs a third server on one origin. Cheap honest substitute: `?e2eSave=v1` — one more literal in `E2E_SAVE_SEAMS`/`e2eSaveStore` (`src/testing/e2eHook.ts`) pre-filled with the frozen v1 fixture (import the JSON, not a copied literal); the existing `e2eSave` marker in `vite/e2eHookGuard.mjs` already covers it. The hook's `save` status needs a runtime-only `migratedFrom` (outside the saved state). Keep the real two-build test as a follow-up with trigger "the next format change (v3) or a parent report of lost progress after an update". |
| S12-09 file date/build in the import step (`context/archive/2026-10-14-save-reason-and-recovery/follow-ups/review-fixes.md`) | **In** | `ImportResult.file {build, exportedAt}` is parsed and dropped by `saveImportDialog.ts` `stepTwo`; ~10–20 lines + a string. A v1 file in a v2 build is exactly this case. |
| S12-14 date/build in the raw copy name (same file) | **In (tiny)** | `saveExport.ts` `RAW_FILE_NAME = pl.saveFailed.fileName` is fixed; reuse the dated pattern of `pl.saveTransfer.fileName`. |
| Visual-gate O1 `future` card copy (same file) | **In** | `saveFailedCard.ts` takes a `SaveCardCopy`; add `pl.saveFuture` ("zaktualizuj grę") picked when `reason === 'future'`; the v2 build is the first that can meet a newer save after a rollback. Copy is player-facing → teacher read. |
| S13-06 parent's mistake preview without drawn answers (`context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`) | **Out** | A different feature (`captureFirstWrong` in `src/core/round.ts`, the progress view); widening `example` changes the learner block, unrelated to variants. New trigger: "the next save-format change or S-17". |
| S12-02 / S12-03 / S12-11 | **Not triggered** | Only if the migrated save is written through `replace` or the import leaves the dialog; neither happens on the recommended path. |
| Two instances, S12-15, M-S1 deploy part, S12-07/08/12/13 | **Out** | Not caused by the format change; carry with new triggers (as `change.md` proposes). |

### 2. Round variants

**Where they plug in (observed, `src/scenes/TaskScene.ts`).** `freshRound` is the one round factory with three
branches: warm-up (`buildWarmup`, `length: balance.warmup.length`), the e2e `forcedSkills` override (hook build
only), adaptive (`buildAdaptiveRound` → `startRound(tasks, balance.round)`). `advance` calls `finishRound` when the
state turns finished; `finishRound` calls `endRound(learner, stage, roundResults(state), Date.now(), warmup ?
'warmup' : 'round', balance)`, writes the learner (`pendingUnlock`), `finishWarmup`, then `saver.flush('now')`.
"Kolejna runda" → `startNextRound` → the unlock card when `pendingUnlock !== null` (`closeUnlock` → `beginRound`) or
`beginRound` directly; `beginRound` = `freshRound`, reset, render.

**Recommendation.**
- A pure `src/core/variants.ts`: `nextRoundKind(state, {stage, today, poolFor, rules}) → 'round' | 'word' | 'dice' |
  'puzzle'` and `afterRound(state, kind, today, puzzleId?) → VariantState`. `freshRound` returns a tagged round
  (`{kind, state, …}`) so `render`/`finishRound` branch on the kind; the warm-up branch is checked first and never
  replaced.
- **Frequency (no source gives a number: ZADANIA § 5, PRD FR-024/FR-025 and plan § 6 say only "co kilka rund").**
  Recommend `balance.variants = { everyRounds: 3, puzzleMultiplier: 2, puzzleStages: ['E3','E4'], dice: { throws: 13 },
  word: { tiles: 3 } }`: after 3 finished adaptive rounds the 4th is a variant. Variant choice: the daily puzzle when
  the learner's stage has a pool and `puzzleDay !== today`; otherwise the minigame other than `lastMinigame`. Every
  number is a starting value for S-17 playtest.
- **Counter rules.** `roundsSince` increments in `finishRound` for kind `'round'` only (not warm-up); it resets, and
  `lastMinigame`/`puzzleDay`/`puzzlesDone` update, **when a variant finishes**, not when it starts — so a variant left
  by a reload, or replaced by a parent's stage change, simply comes again next round (nothing lost, nothing paid
  twice: stars are paid per answer through `syncStars`). The variant state is written with the round end
  (`flush('now')`), FR-020.
- **Leaving mid-variant.** "Do pokoju" uses `scene.switch`; the scene sleeps and `this.state` survives, so the same
  variant is redrawn on wake (observed path for ordinary rounds). Reload mid-variant: rounds are not saved (`SAVE_KEYS`
  holds stars, rooms, currentRoom, learner, settings), earned stars stay. No fail state: the child can always leave.
- **Parent stage change mid-variant (M-13).** `applyParentStage` builds a fresh round; with the rule above the
  variant comes back next round. The plan must apply M-1 ("build the new state, then commit fields") to the new
  branch and M-2 ("commit `finished` after the end-of-round work succeeds") to the variant end, because
  `afterRound` is new end-of-round work (audit descriptions in
  `context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md`).
- **Unlock card and warm-up.** The warm-up is the first round of a placement and is never a variant (and does not
  count). A pending unlock card shows before the next round regardless of its kind (it is drawn by `startNextRound`
  before `beginRound`), so a variant after an unlock is fine. Variants never produce an unlock because they skip
  `endRound`.
- **Mastery and curriculum.** `endRound` (`src/core/curriculum.ts`) calls `recordRound` for every kind including
  `'warmup'`; `'round'` additionally does `unlockReady`, `easedRounds` and `weakStreak`. A variant must **skip
  `endRound` entirely** (not reuse `'warmup'`, which still records mastery and history). Reason: dice 0–12 and
  puzzles are not skills of the stage, and a 13-throw board would distort the easing rule `weakBelow: 3` tuned for 5
  tasks. Hasło tasks come from the learner's skills (below) but stay out of mastery in v1 (keeps `change.md`
  decision 7; reversible later by passing their results to `recordRound` only).
- **×2.** `earn(balance, delta)` (`src/core/stars.ts`) accepts positive integer deltas; `syncStars` passes
  `state.starsEarned - before`. The puzzle round is `startRound([task], { ...balance.round, length: 1, starPerTask:
  balance.round.starPerTask * balance.variants.puzzleMultiplier, cleanRoundBonus: 0 })` — first and second try both
  pay 2 (`settle` pays `starPerTask` unless the outcome is `retype`), the retype after the solution pays 0 like every
  round (ZADANIA § 1). Minigames: `starPerTask: 1`, `cleanRoundBonus: 0` (the kit's completion shows `★ +13` /
  `★ +{word length}` with no bonus). `earn` needs no change.
- **Economy note.** The salon costs 96 stars in total (`src/data/rooms.ts`: 5–15 per task); a normal round pays up to
  7, a dice board up to 13, a word up to 6, a puzzle 2. One dice board per 8 rounds (every 4th round, alternating)
  adds roughly 15 % to the star rate — acceptable, flagged for S-17.
- **The day.** `src/main.ts` computes `month` once with `new Date().getMonth()` ("scenes never call Date") and an
  `?e2eMonth` seam. Recommend a `today(): string` function (local `getFullYear()/getMonth()+1/getDate()`, never
  `toISOString`, which is UTC) created in `main.ts` and kept in the registry, so a tablet left open past midnight
  sees the new day; the e2e build adds `?e2eDay=YYYY-MM-DD` (new marker `e2eDay` in `vite/e2eHookGuard.mjs`,
  proven absent from `dist/`). Rule "puzzle available when `puzzleDay !== today`" (inequality): a clock moved back or
  forward gives one extra puzzle at most per distinct date — harmless (no penalty, 2 stars), no time arithmetic, no
  DST issue. ESLint does not ban `Date` in `src/core` (`eslint.config.mjs` bans `window`, `document`, `navigator`,
  storage and speech globals); keeping `today` injected follows the convention, not a rule. Note: `TaskScene` already
  calls `Date.now()` for the rng seed and the history timestamp.
- **e2e reachability.** Three ordinary rounds before a variant would slow every spec; recommend a hook-build seam
  `?e2eVariant=word|dice|puzzle` forcing the next round kind (marker in `vite/e2eHookGuard.mjs`) plus a read-only
  `variant` field in `window.__martynkaE2E`; one spec still plays the real counter once if time allows.

### 3. Hasło z wyników ("Ukryte słowo")

- **Mechanic** (kit, `change.md` decision 2): one correct task reveals the next letter; the word length is the number
  of tasks. The kit's `wordTasks` are fixed demo tasks (`designs/martynka-expansion-v1/preview.js`: 4+3, 12−4, 6+5,
  15−6, 8+6) and the manifest says the demo is not a task engine.
- **Tasks.** The kit layout shows only "Oblicz" and a bare expression `{a} {op} {b} = ?` with 3 answer tiles, so word
  problems, drawings, drag and select tasks do not fit. Recommend drawing the tasks from the learner's own
  `buildAdaptiveRound` pool restricted to skills whose generator produces a bare numeric expression (ADD_SUB, and
  MULT/DIV from E3) and showing them as 3 tiles (`AnswerTiles`, distractors from `src/core/tasks/distractors.ts`;
  `balance.tiles.count` is 4 for normal rounds, the kit shows 3 → `balance.variants.word.tiles: 3`). This keeps the
  numbers in the stage's range for every stage E1–E6 (minigames are "od E1", ZADANIA § 5). Fallback when the
  filtered pool is too small: the stage's first playable ADD_SUB step.
- **Words.** The kit list (SOFA, OKNO, LAMPA, FOTEL, PÓŁKA) does not match the game: the salon slot captions are
  `pl.room.slots` (`src/data/pl.ts`): podłoga, ściany, zasłony, **kanapa** (not "sofa"), dywan, **stolik** (not
  "stół"), lampa, półka, kwiatek, obraz; there is no "fotel" or "okno" slot (`src/data/rooms.ts`). Recommend the
  word list as data derived from the slot captions, 4–6 letters: KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA, OBRAZ (lengths
  6, 5, 6, 5, 5, 5; 6 tiles of 132 px with gap 24 = 912 px, inside the 1240 px board). Upper-casing "ó/ł" must be
  checked with the task font (`AtkinsonHyperlegibleNext.ttf`) in the visual gate.

### 4. Zakrywanka ("Kostki")

- **Kit rules** (`style-guide.md` "Plansze kodowe", `manifest.json` `miniGames.dice`): results 0–12, `+` and `−`,
  no negative results, subtraction always larger minus smaller, 0 shown as 3−3 and 1 as 4−3, dice drawn as 150 px
  rounded squares with the six pip layouts; completion "Wszystkie pola zakryte!" with `★ +13`, so **13 throws, one
  per field**.
- **Answer mode.** In the kit the child taps the result **on the 13-tile board** (7 columns of 160, second row
  starting at column 2, a covered tile is green with a ✓ and disabled). That is not `AnswerTiles` (3–4 tiles): it
  needs a `CoverBoard` widget emitting the tapped number into the same `answer()` reducer. A tap on another uncovered
  field is a wrong answer → hint → second try → solution → retype, as in every round.
- **Throws.** No physical roll and no throw button in the kit (the dice appear thrown). Generate in core: pick a
  still-uncovered target t, then a pair: for t ≥ 2 an addition with a ∈ [max(1, t−6), min(6, t−1)], b = t − a; for
  t ≤ 5 (or always for 0 and 1) a subtraction a − b = t with 1 ≤ b ≤ a ≤ 6. Each throw hits an uncovered field, so the
  board ends after exactly 13 throws with no dead throw and no fail state. Seeded `Rng`, pure, testable (every
  board covers 0–12 exactly once). Each throw becomes a `Task` (`prompt` `a op b`, `answer` t, two hint lines from the
  kit copy) so `round.ts` runs it unchanged with `length: 13`.
- **Stages.** 0–12 is an E1 range; for E3–E4 it is easy. Keep it for every stage in v1 (`change.md` decision 6): it is
  the kit's game and a light break; the range lives in `balance.variants.dice`/data so the S-17 playtest can change
  it. ProgressDots (gap 62) are not used: the board is the progress.

### 5. LOGIC puzzle pool (E3–E4)

**Data model** (`src/data/puzzles.ts`, no generator — ZADANIA § 4 "Nie generator — dane w pliku"):

```ts
type PuzzleKind = 'floors' | 'train' | 'number' | 'scale' | 'water';
interface PuzzleDef { id: string; kind: PuzzleKind; stage: 'E3' | 'E4'; prompt: string; answer: number;
                      choices?: readonly number[]; hint: readonly [string, string]; }
```

A pure `puzzleTask(def)` turns it into a `Task` (`skillId: 'PUZZLE.<id>'`, `input: choices ? 'tiles' : 'keypad'`), so
the round reducer, `firstHint`/`solutionSteps` (`src/core/round/hints.ts`) and the narrator work unchanged. The pool
for a learner is every puzzle with `stage <= learner stage` (an E4 child gets all 15). Text-only in v1: the `scale`
visual (`src/core/tasks/visual.ts`) draws one item against weights and `jugs` draws fixed jugs, neither shows two
loaded pans or a pour, so no drawing is promised.

**Content test** (new, beside `tests/contentInvariants.test.ts`): 10–15 entries, unique ids, each kind at least
twice, `validateTask(task, { max: 100, nouns })` empty, `firstHint(task) !== null` (the first hint line does not end
with the answer), `solutionSteps` closes with the answer without an added line, prompts of 1–3 sentences, `choices`
contain the answer once.

**The 15 puzzles** (original; each written for this slice; numbers use U+2212 for minus as the generators do):

| id | kind | stage | prompt | answer | tiles | hint 1 | hint 2 |
|---|---|---|---|---|---|---|---|
| floors-up | floors | E3 | Kasia mieszka na drugim piętrze. Bartek mieszka 3 piętra wyżej niż Kasia. Na którym piętrze mieszka Bartek? | 5 | 4, 5, 6 | Zacznij od piętra Kasi i idź 3 piętra w górę. | 2 + 3 = 5. Bartek mieszka na piątym piętrze. |
| floors-chain | floors | E3 | Zosia mieszka na czwartym piętrze. Igor mieszka piętro niżej niż Zosia, a Ania piętro niżej niż Igor. Na którym piętrze mieszka Ania? | 2 | 1, 2, 3 | Zejdź od Zosi o 1 piętro do Igora, a potem o 1 piętro do Ani. | 4 − 1 = 3, 3 − 1 = 2. Ania mieszka na drugim piętrze. |
| floors-lift | floors | E4 | Winda ruszyła z parteru. Pojechała 7 pięter w górę, a potem 3 piętra w dół. Na którym piętrze stanęła? | 4 | keypad | Parter to 0. Najpierw jedź w górę, potem w dół. | 0 + 7 = 7, 7 − 3 = 4. |
| train-bear | train | E3 | Pociąg wiezie zabawki. Wagon z misiem jest czwarty od początku i szósty od końca. Ile wagonów ma pociąg? | 9 | 8, 9, 10 | Przed misiem są 3 wagony, a za nim 5 wagonów. | 3 + 1 + 5 = 9. Pociąg ma 9 wagonów. |
| train-queue | train | E4 | Janek stoi w kolejce do kasy. Jest ósmy od przodu i piąty od tyłu. Ile osób stoi w kolejce? | 12 | 11, 12, 13 | Przed Jankiem stoi 7 osób, a za nim 4 osoby. | 7 + 1 + 4 = 12. W kolejce stoi 12 osób. |
| number-tens | number | E3 | Mam 2 dziesiątki. Moja cyfra jedności jest o 3 większa niż cyfra dziesiątek. Jaką jestem liczbą? | 25 | keypad | 2 dziesiątki to 20. Ile jedności trzeba dodać? | Jedności: 2 + 3 = 5. Jestem liczbą 25. |
| number-odd | number | E3 | Jestem liczbą nieparzystą. Jestem większa od 16 i mniejsza od 20, ale nie jestem 19. Jaką jestem liczbą? | 17 | 17, 18, 19 | Liczby między 16 a 20 to 17, 18 i 19. | Nieparzyste są 17 i 19. Bez 19 zostaje 17. |
| number-times | number | E4 | Gdy pomnożysz mnie przez 5, otrzymasz 40. Jaką jestem liczbą? | 8 | keypad | Szukasz liczby: □ · 5 = 40. Pomoże dzielenie. | 40 : 5 = 8. Jestem liczbą 8. |
| number-digits | number | E4 | Jestem liczbą dwucyfrową. Suma moich cyfr to 9, a cyfra dziesiątek jest 2 razy większa od cyfry jedności. Jaką jestem liczbą? | 63 | keypad | Sprawdzaj cyfry jedności po kolei: 1, 2, 3… i podwajaj je. | Jedności 3, dziesiątki 6, a 6 + 3 = 9. Jestem liczbą 63. |
| scale-parcels | scale | E3 | Na jednej szalce leżą 2 jednakowe paczki, a na drugiej odważnik 10 kg. Waga jest w równowadze. Ile kilogramów waży jedna paczka? | 5 | keypad | W równowadze obie szalki ważą tyle samo: 2 paczki ważą razem 10 kg. | 10 : 2 = 5. Jedna paczka waży 5 kg. |
| scale-fruit | scale | E3 | Jedno jabłko waży tyle, co 2 śliwki. Jedna gruszka waży tyle, co 2 jabłka. Ile śliwek waży tyle, co jedna gruszka? | 4 | 2, 3, 4 | Zamień gruszkę na 2 jabłka, a każde jabłko na śliwki. | 2 + 2 = 4. Gruszka waży tyle, co 4 śliwki. |
| scale-pumpkin | scale | E4 | Na lewej szalce leży dynia i odważnik 2 kg, a na prawej odważniki 5 kg i 3 kg. Waga jest w równowadze. Ile kilogramów waży dynia? | 6 | keypad | Prawa szalka waży 5 kg + 3 kg. Lewa waży tyle samo. | 5 + 3 = 8, 8 − 2 = 6. Dynia waży 6 kg. |
| water-pour | water | E3 | Duży dzbanek mieści 5 litrów, a mały 3 litry. Napełniasz duży i przelewasz z niego wodę do małego, aż mały będzie pełny. Ile litrów wody zostanie w dużym dzbanku? | 2 | 2, 3, 8 | Z dużego dzbanka ubyło tyle wody, ile zmieścił mały. | 5 − 3 = 2. W dużym dzbanku zostaną 2 litry. |
| water-bucket | water | E3 | Mały dzbanek mieści 2 litry. Ile razy trzeba go napełnić i wylać do wiadra, żeby w wiadrze było 8 litrów? | 4 | keypad | Za każdym razem w wiadrze przybywają 2 litry. Licz dwójkami aż do 8. | 2, 4, 6, 8: to 4 razy. 8 : 2 = 4. |
| water-empty | water | E4 | Duży dzbanek mieści 7 litrów, a mały 4 litry. Napełniasz duży, przelewasz z niego wodę do małego aż do pełna, a potem wylewasz wodę z małego. Ile litrów zostało w dużym dzbanku? | 3 | keypad | Mały zabrał z dużego tyle wody, ile mieści. | 7 − 4 = 3. W dużym dzbanku zostały 3 litry. |

Counts: 15 puzzles, 9 for E3 and 6 for E4; kinds floors 3, train 2, number 4, scale 3, water 3.

**Mechanical check (run in this step, throwaway script in the session temp dir, not committed):** the 15 rows of the table above, parsed and turned into `Task` objects, give `validateTask(task, { max: 100, nouns: nouns + the five new nouns })` = no violation, `firstHint(task) !== null` and `solutionSteps` of exactly 2 lines (closed) for all 15.

**Teacher read (done in this step, as a Polish primary-school teacher; still needs the author's `[human]` read).**
- Every answer is unique: `number-odd` (between 16 and 20 the odd ones are 17 and 19, 19 excluded), `number-digits`
  (tens = 2 × ones and sum 9 → ones 3), `train-bear` (4th from the front → 3 before; 6th from the end → 5 after),
  `train-queue` (7 before, 4 after), `water-empty` (7 − 4 = 3 left in the big jug; emptying the small one does not
  change it — the last clause is the deliberate distractor).
- Ranges: E3 answers ≤ 25 (ZADANIA § 2: E3 numbers to 30, `·`/`:` ≤ 30 and halves); E4 answers ≤ 63, `· 5` and `: 5`
  are E4 content (ZADANIA § 2 "·5, ·10, :5, :10 do 100"); `number-digits` uses "2 razy większa", E3–E4 vocabulary.
- Numeral agreement: 3 piętra, 7 pięter, 1 piętro; 3 wagony, 5 wagonów, 9 wagonów; 7 osób, 4 osoby, 12 osób;
  2 dziesiątki; 2 paczki; 2 śliwki, 4 śliwki, 2 jabłka; 5 litrów, 3 litry, 2 litry, 8 litrów, 7 litrów, 4 litry,
  3 litry. Ordinals are written as words ("na drugim piętrze", "czwarty od początku") so no digit-plus-dot forms
  appear. New nouns for `src/data/nouns.ts`: `piętro` [piętro, piętra, pięter], `wagon` [wagon, wagony, wagonów],
  `osoba` [osoba, osoby, osób], `paczka` [paczka, paczki, paczek], `śliwka` [śliwka, śliwki, śliwek]; `jabłko`,
  `dziesiątka`, `litr` already exist.
- Grammar: feminine agreement with "liczba" ("Jestem większa", "Jestem liczbą nieparzystą"); the verbs match the
  names' gender ("Kasia mieszka", "Janek stoi"/"Jest ósmy"); "waży tyle, co" with the comma as in school texts.
- Hints: hint 1 names the school method and does not end with the answer (checked against `leaksAnswer` in
  `src/core/round/hints.ts`: last numbers 3, 1, 0, 5, 4, 20, 19, 40, 3, 10, 2, 3, none, 8, none ≠ the answers);
  hint 2 is the full solution ending with the answer, so `solutionSteps` adds no extra line.
- Tiles are used where the classic wrong answer is instructive (10 wagons from 4 + 6, 13 people from 8 + 5, 8 litres
  from 5 + 3, 19 for the odd-number trap); the rest use the keypad, the E3–E4 default.

### 6. Design source and copy

- **Kit screens** (`designs/martynka-expansion-v1/screenshots/`): `dice-idle`, `dice-second-try`, `dice-solution`,
  `dice-correct`, `dice-complete`, `word-idle`, `word-first-letter`, `word-hint`, `word-second-try`,
  `word-complete`, `tablet-dice-1024`, `tablet-word-1024` (plus `room-chooser`, `overview`). Layout in 1920×1080
  (from `expansion.css`/`screen.css`): notebook 180/204 1560×788; prompt top 252, 64 px; dice row top 346, dice
  150 px, operator 96 px; dice result grid top 568, 7 columns of 160, gap 20, tiles 136 high, 80 px numbers; letter
  tiles top 364, 132×138, gap 24, 88 px, hidden letter "·"; word equation top 532, 104 px; word answers top 704,
  3 tiles 312×138, gap 26; feedback bar top ~880, button ≥ 96 high; completion card 440/330, 1040 wide, h2 88 px,
  buttons 108 high. Colours from the kit palette (`manifest.json` `palette`).
- **Exact kit copy** (`preview.js` `feedback`, `success`, `hud`): HUD titles "Kostki · 0–12", "Ukryte słowo"
  ("Brawo!" on completion); prompts "Zakryj wynik", "Oblicz"; hint lines "Policz razem oczka obu kostek.",
  "Odejmij oczka drugiej kostki.", "Zacznij od {a} i dodaj {b}.", "Zacznij od {a} i odejmij {b}."; solution
  "{a} {op} {b} = {answer} · Wybierz {answer}."; correct "Brawo! Jeszcze jedna gwiazdka." + "Dalej"; completion
  "Brawo!", "Wszystkie pola zakryte!" or the word, "★ +N", "Kolejna runda", "Do pokoju"; buttons "Podpowiedź",
  "Pokaż", "Spróbuj".
- **Existing keys to reuse** (`src/data/pl.ts`): `round.calculate` 'Oblicz', `round.correct`, `round.next` 'Dalej',
  `round.tryAgain` 'Spróbuj jeszcze raz', `round.nextStep`, `round.gotIt`, `round.resultLine`, `summary.nextRound`
  'Kolejna runda', `summary.toRoom` 'Do pokoju', `summary.earned(n)`. Missing (new keys): HUD titles, "Zakryj wynik",
  the four hint lines, "Wszystkie pola zakryte!", "Brawo! Jeszcze jedna gwiazdka.", the word list, every puzzle
  string (in `src/data/puzzles.ts`).
- **Reusable widgets** (`src/ui/widgets/`): `drawNotebook`, `AnswerTiles` (3-tile word answers), `FeedbackBar`,
  `SolutionSteps`, `Keypad` (puzzles), `StarCounter`/`drawStar`, `SpeakerButton`, `RoomSwitchButton`, `PageButton`,
  `UnlockCard` (pattern for a puzzle/variant card), `SummaryPanel` (not for minigames: its star row is 124 px per star,
  13 stars ≈ 1612 px > the 1560 px notebook, and the kit's completion card differs). New widgets: `Dice`,
  `CoverBoard`, `LetterTiles`, `MinigameDoneCard`. `src/ui/dom/` holds parent/system dialogs only — not for child
  screens. `UIScene`/`HUD_LAYOUT` has **no title text** today; the kit's HUD title is new UI that the kit specifies.
- **Kit behaviour that differs from the current round** (recorded as gaps, not silently changed): the kit has an
  on-demand "Podpowiedź" button in the idle state and "Pokaż" to jump to the solution; `round.ts` shows the hint only
  after a miss and the solution after the second miss, with `SolutionSteps` and a retype. The kit preview also adds a
  star after "Pokaż", while `round.ts` and ZADANIA § 1 pay no star for a retype. Recommendation: keep the one state
  machine (`round.ts`) and its star rule in v1; gap rows record the difference.
- **DESIGN-GAP rows to add from 79** (`docs/design-gaps.md`, columns `| # | Slice | Gap | Provisional behaviour |
  Code |`): (79) no daily-puzzle screen — the ordinary task screen with the HUD title "Zagadka dnia"; (80) no ×2 mark —
  the HUD title or the correct bar says the stars are doubled, the counter shows +2; (81) no variant announcement — no
  extra card for minigames (the HUD title changes), the puzzle starts with an `UnlockCard`-style card only if the plan
  wants one; (82) no puzzle summary — `SummaryPanel` with one task and `earned` 2; (83) kit's on-demand "Podpowiedź"
  /"Pokaż"/"Spróbuj" not built — the round's hint-after-miss flow; (84) star after "Pokaż" in the kit preview — no
  star for a retype; (85) words of 6 letters and Ó/Ł in letter tiles — checked in the visual gate; (86) the kit's
  room buttons "Kostki"/"Ukryte słowo" (`room-chooser`) — not built: variants come only instead of a round (FR-024).

## Code References

- `src/core/save.ts` — `SAVE_VERSION`, `MIGRATIONS`, `Migration`, `decodeSave`, `saveProblem`, `validateSave`,
  `encodeSave`, `toSession`, `freshSession`, `SessionSave`
- `src/core/types.ts` — `SaveV1`, `SaveState`, `LearnerState`
- `src/core/autosave.ts` — `loadSave`, `createAutosaver` (`attempt`, `writesOff`, `onFirstWrite`), `replaceGate`,
  `Autosaver.replace`, `status`
- `src/core/saveFile.ts` — `parseImport`, `exportFileText`, `saveSummary`, `deviceSaveView`, `ImportRejection`
- `src/storage/idb.ts` — `createIdbSaveStore`, `SAVE_KEY_PREFIX`
- `src/testing/e2eHook.ts` — `e2eMonth`, `E2E_SAVE_SEAMS`, `e2eSaveStore`; `vite/e2eHookGuard.mjs` — `E2E_HOOK_MARKERS`
- `src/main.ts` — `month`, `start`, `createGame`
- `src/scenes/TaskScene.ts` — `create`, `freshRound`, `beginRound`, `advance`, `finishRound`, `finishWarmup`,
  `startNextRound`, `closeUnlock`, `applyParentStage`, `syncStars`
- `src/core/round.ts` — `RoundRules`, `startRound`, `answer`, `settle`, `next`; `src/core/round/hints.ts` —
  `firstHint`, `solutionSteps`, `leaksAnswer`; `src/core/round/summary.ts` — `summaryView`
- `src/core/curriculum.ts` — `endRound`, `buildAdaptiveRound`; `src/core/mastery.ts` — `recordRound`
- `src/core/stars.ts` — `earn`
- `src/core/tasks/types.ts` — `Task`; `src/core/tasks/validate.ts` — `validateTask`; `src/core/tasks/visual.ts` —
  `TaskVisual`
- `src/data/balance.ts` — `balance.round`, `balance.tiles`, `balance.mastery.historyLength`
- `src/data/layout.ts` — `REGISTRY_KEYS`, `SAVE_KEYS`, `SUMMARY_LAYOUT`, `HUD_LAYOUT`
- `src/data/pl.ts` — `round.*`, `summary.*`, `room.slots`; `src/data/rooms.ts` — `SALON`; `src/data/nouns.ts` — `nouns`
- `designs/martynka-expansion-v1/` — `manifest.json` `miniGames`, `style-guide.md` "Plansze kodowe", `preview.js`
  `feedback`/`success`, `expansion.css`

## Architecture Insights

- The round reducer is length-agnostic and rule-parameterised (`RoundRules` as an argument), so all three variants
  are "a list of `Task` + rules"; only the boards are new widgets. This keeps one hint/solution/star rule for the whole
  game.
- The variant schedule is the only new persistent state; it belongs in core as a pure reducer with the day injected,
  mirroring `month` and `longPress`.
- Save safety already keys on reasons (`future`, `unreadable`, `unavailable`), not on version numbers, so a version
  bump does not weaken SIR-01/SIR-02.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-autosave-versioned-save/` — v1 format, `MIGRATIONS` chain, the "first save-format change
  (v2)" follow-ups (step, fixtures, backup-v1, two-build e2e, two instances). Supported: the chain and fixtures exist as
  described.
- `context/archive/2026-10-13-save-export-import-reset/` — L-S1 (throwing step → `corrupt`, error lost). Supported by
  `decodeSave`'s `catch`.
- `context/archive/2026-10-14-save-reason-and-recovery/` — SIR-01 (`future` never overwritten), S12-xx follow-ups,
  visual-gate O1. Supported: `replaceGate`/`deviceSaveView` key on `reason === 'future'`.
- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/` — S13-06 (parent preview without drawn answers), trigger "S-15
  save format v2". Verdict: trigger fires, but the fix is a different feature → re-trigger.
- `context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md` — M-1, M-2, M-13
  (TaskScene ordering), triggered by this slice.

## Related Research

- `context/changes/minigame-daily-puzzle/change.md` (identity, decided inputs, triggered follow-ups).
- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/research.md`, `context/archive/2026-10-13-autosave-versioned-save/`
  (prior save/round research).

## Open Questions (for `/10x-plan`; each has a recommendation above)

1. `balance.variants.everyRounds` = 3 (no source number) — confirm or change; S-17 playtest tunes it.
2. Hasło task source: the learner's ADD_SUB/MULT/DIV expression skills (recommended) vs fixed kit-like tasks.
3. Whether the puzzle gets an announcement card (gap 81) and whether the HUD title alone is enough for minigames.
4. The kit's on-demand "Podpowiedź"/"Pokaż" (gap 83): kept out in v1 by recommendation; reversal = the author asks
   for it in the `[human]` read.
5. Dice range for E3–E4 (decision 6): 0–12 for all stages in v1; reversal = the teacher read finds it too easy.
6. `[human]` row: the author reads all 15 puzzles before release (contract § S-15).
