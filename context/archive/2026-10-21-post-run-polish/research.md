---
date: 2026-10-21T15:13:12+0200
researcher: Claude (autonomous run 2026-10-21-post-run-polish, /10x-research step)
git_commit: e095009
branch: feat/post-run-polish
repository: Martynka-urzadza
topic: "post-run-polish: heading rule, round variety cap (F3), Obrazki cut lines (N-1, H-2), skill id on drawing errors (N-4)"
tags: [research, round, narration, variety, artHealth, generateTask, assertDrawable]
status: complete
last_updated: 2026-10-21
last_updated_by: Claude (autonomous run, /10x-research)
---

# Research: post-run-polish

**Date**: 2026-10-21T15:13:12+0200 · **Git Commit**: e095009 · **Branch**: feat/post-run-polish · **Repository**: Martynka-urzadza

Anchors are file + symbol (run contract: never line numbers). Throwaway survey scripts were run with
`node --import tsx` from `scripts/_*_tmp.ts` and deleted before committing; their numbers are quoted with the exact
draw set they cover.

## Research Question

From `change.md` (corrections, D-1..D-8, open unknowns) and the step prompt:
1. Heading: where `isExpression` and the heading are decided, which tests/e2e pin "Oblicz", what one pure core rule
   (heading kind per task) looks like, how `TaskScene` and `spokenTask` both use it; teacher check of "Wstaw znak" /
   "Uzupełnij" against `docs/ZADANIA.md` and the existing `speak` questions.
2. F3: a seeded repro of the cap failing in `pickVariedSkills`; how to cap regardless of draw order while keeping one
   `rng.next()` per draw and the bucket shares (existing share tests are the oracle).
3. N-1/H-2: `artHealthLines` inputs, tests that pin the background line and the cut count, how to count pictures only
   (`cutByTable`).
4. N-4: what `coinLayout` and `columnMarks` assert; the cheapest rng-free build-time check inside `generateTask`.

## Summary

- **Heading.** Two call sites decide it today, both on `isExpression` (`src/core/round/prompt.ts`): the screen in
  `TaskScene.drawPrompt` (prompt branch: draws `pl.round.calculate` unless `kind === 'word'`) and the speaker in
  `spokenTask` (`src/core/narration/spoken.ts`, tests `isExpression(task.speak ?? task.prompt)`). A third use,
  `TaskScene.fitPromptToSteps`, uses `isExpression` for layout only (not the heading) and must stay as is. The survey
  (20 draws per skill, E1–E6) gives 15 type·mode·shape rows with an expression prompt; a rule on **answer type + box
  position** classifies all of them correctly (table below). No e2e asserts the heading text; unit pins are
  `tests/spoken.test.ts` (3 "Oblicz." expectations), `tests/narrator.test.ts` (literal strings, unaffected) and
  `tests/layout.test.ts` `describe('isExpression')` (unaffected if `isExpression` stays).
- **F3.** Over every playable step of E1–E6 × seeds 1..200 (12 600 rounds), `pickVariedSkills` returns **159** rounds
  with a type > 2 that the rolled pools could have avoided (e.g. `E2.1` seed 1:
  current PLACE_VALUE, current ADD_SUB, current PLACE_VALUE, previous ADD_SUB, current PLACE_VALUE). A prototype that
  keeps the exact rng calls and then does an **rng-free repair** (backtracking over the types of each draw's rolled
  pool, preferring the drawn type) left 0 avoidable rounds, changed 0 buckets and left the rng in the same state
  (checked by the next `rng.next()` of both copies on all 12 600 rounds). The 2 625 rounds still above 2 in that run
  are forced by the rolled pools (no assignment exists).
- **N-1/H-2.** `artHealthLines` (`src/core/artHealth.ts`) takes `cut: number` and `background?: boolean`; `UIScene.openSettings`
  passes `bootLoad.cut.length` and `hiddenMs > 0`. `bootLoad.cutByTable` (written by `BootScene` via `cutByTable`)
  already splits `task | room | ui | sound | font`. Pins to change: `tests/artHealthLines.test.ts` (3 `background`
  cases), `tests/artHealthText.test.ts` `describe('pl.settings.artCutBackground')`, and e2e
  `tests/e2e/load-and-tab-guard.spec.ts` "#15 H-1 …" (asserts `artCutBackground` visible and `artCut` absent).
- **N-4.** Both `coinLayout` throws and the `columnMarks` throw are unreachable from today's data but unguarded at
  generation; `faceDraw`'s throw is a `never` guard behind `parseFace`, and `faceLabel` never runs in a scene. The
  cheapest check: two new cases in `assertDrawable` (`src/core/tasks/visual.ts`), `money` with `pay` →
  `v.pay.tray.length <= TASK_LAYOUT.coinDrag.maxKinds`, and `column` → `columnMarks(v, 'all')`. Both are rng-free;
  `src/core` already imports `src/data/layout` (`src/core/roomHit.ts`, `src/core/round/drawingFit.ts`), so no limit
  has to move to `balance`.

## Detailed Findings

### 1. Heading rule

**Where it is decided today.**
- `isExpression` (`src/core/round/prompt.ts`): a prompt with a digit or `□` made only of digits, whitespace,
  `+ − · : ( ) □ = ?`. `\s` in a JS regex covers U+00A0, so grouped large numbers still match.
- Screen: `TaskScene.drawPrompt` → `if (isExpression(task.prompt))` pushes a `pl.round.calculate` text (skipped when
  `wordRound`) and calls `drawExpression`; otherwise a `□` sentence goes to `drawSentence`, plain text to a wrapped text.
- Speaker: `spokenTask(task, words, calculate)` prefixes `${calculate}. ` when `isExpression(task.speak ?? task.prompt)`.
  `narrationOf` calls `spokenTask` in phases `first`, `done` and in `second` when there is no hint.
  `TaskScene.currentNarration` passes `calculate: pl.round.calculate`; `scripts/sample.ts` prints
  `czyta: ${spokenTask(task, pl.speech, pl.round.calculate)}`.
- Layout only: `TaskScene.fitPromptToSteps` returns early for `isExpression(task.prompt)`; unaffected by a heading change.
- Observed side note: in a word round (`kind === 'word'`) the screen draws no heading but `narrationOf` has no `kind`,
  so the speaker still says "Oblicz." there. Not in scope; noted for the plan (it can pass `none` for a word round if
  the rule takes an option, otherwise leave it as a follow-up).

**Survey (expression prompts only; 20 draws per skill of every step of E1–E6, seeds `s:<skill>:<i>`).**

| type · mode | prompt shape | answer | `speak` is a question | example | proposed kind |
|---|---|---|---|---|---|
| ADD_SUB · tiles/keypad | no `□` | number | no | `5 − 4` | calculate |
| CHAIN · tiles | no `□` | number | no | `4 + 3 − 2` | calculate |
| MULT, DIV, ORDER_OPS · keypad | no `□` | number | no | `2 · 10`, `1 + 9 · 9` | calculate |
| COMPARE_NUM · tiles | `□` inside | string `< > =` | yes (`compareSpeak`) | `3 □ 5` | sign |
| COMPARE_EXPR · tiles | `□` inside | string | yes (`compareExprSpeak`) | `8 + 1 □ 2 + 7` | sign |
| MISSING_OP · tiles | `□` inside | string `+ −` | yes (`missingOpSpeak`) | `5 □ 2 = 3` | sign |
| MISSING · tiles/keypad | `□` inside | number | yes (`pl.tasks.missing`) | `4 + □ = 5`, `13 − □ = 4` | fill |
| MISSING · tiles/keypad | single `□` after the last `=` | number | yes | `2 − 1 = □`, `7 + 6 = □` | calculate (see below) |
| FACT_FAMILY · keypad (`fact_swap_20`) | `□` inside | number | no | `4 + 1 = 1 + □` | fill |
| PLACE_VALUE · keypad (decompose) | `□` inside | number | no (or NBSP-free copy via `withSpeech`) | `37 = 30 + □` | fill |

Rule that reproduces the table (pure, `src/core/round/`, e.g. `headingOf(task): 'calculate' | 'sign' | 'fill' | null`):
`!isExpression(task.prompt)` → null; `typeof task.answer === 'string'` → sign; prompt has `□` and is not exactly
"… = □" (one box, last token after the last `=`) → fill; else calculate. Answer type is the reliable signal: the three
sign generators (`generateCompareNum`, `generateCompareExpr`, `generateMissingOp`) set `answer` to a sign string and
no other expression-prompt task in the survey has a string answer.

**"… = □" choice.** The prompt.ts module comment already calls "17 − 8 = □" a calculation, and the MISSING result slot
is exactly ADD_SUB/MULT with a box; "Oblicz" fits it. Recommend calculate for that shape; "Uzupełnij" would also be
correct Polish, so this is a real plan choice (would change: the teacher read preferring one heading per generator).

**Teacher check of the wording.**
- "Wstaw znak": `docs/ZADANIA.md` names MISSING_OP "**wstaw znak**"; COMPARE_NUM "znaki <, >, =", COMPARE_EXPR
  "porównaj wyniki działań". "Wstaw znak" fits all three (it is the instruction, the box is the place). Supported.
- "Uzupełnij": already the game's own instruction for box-filling prompts in `src/data/pl.ts`
  (`pl.tasks.bonds` "Uzupełnij domek liczby …", `sequence` "Uzupełnij ciąg:", `arrowGraph`, `arrowTable`);
  `docs/ZADANIA.md` MISSING is "okienko w dowolnym miejscu", PUZZLE_GRID "Uzupełnij pole". Supported as consistent
  wording; it remains agent wording → DESIGN-GAP 154.

**Speaker vs the `speak` questions.** Today the four types with a question (`compareSpeak` "Jaki znak pasuje w
okienku? …", `compareExprSpeak` "Porównaj wyniki. Jaki znak …", `missingOpSpeak` "Jakiego znaku działania brakuje w
okienku? …", MISSING `${pl.tasks.missing} ${prompt}` "Jaka liczba pasuje w okienku? …") never get "Oblicz." because
the `speak` text is not an expression. PA-1 requires the narrator to read the same heading. Options:
- (a) narrator = `${heading}. ${spokenText(task.prompt)}` whenever a heading applies (ignores `speak` for those tasks):
  "Wstaw znak. trzy okienko pięć". `speak` then is dead data for the four generators and can be dropped with
  `compareSpeak`/`compareExprSpeak`/`missingOpSpeak`/`missing` (string-only change, no rng).
- (b) heading + the existing question: "Wstaw znak. Jaki znak pasuje w okienku? trzy okienko pięć" — redundant but
  child-friendly; no generator change.
- PLACE_VALUE's `withSpeech` copy only strips NBSP; `spokenText` already handles grouped numbers inside a calculation
  (`NUMBER`/`parseNumber`, test "writes a long number as digits without the no-break space"), so (a) loses nothing
  there either. Recommend (b) for COMPARE_EXPR only if the teacher read wants "Porównaj wyniki" kept; otherwise (a).
  Either way the sample diff is limited to `czyta:` lines (D-3).

**Pins to update.** `tests/spoken.test.ts` (`command` helper and the `narrationOf` describe pass
`pl.round.calculate`; three expectations "Oblicz. …" on ADD_SUB prompts stay valid under the rule if the signature
changes to a heading-words object); `tests/spoken.test.ts` "writes a long number … `Jaki znak pasuje w okienku?`" uses a
literal string, unaffected; `tests/narrator.test.ts` literal strings, unaffected; e2e `tests/e2e/narrator.spec.ts`
"#narrator the speaker reads …" compares the spoken text to the hook's `narration` and checks symbols are spelled out
(both hold under the new rule); no file under `tests/e2e/` contains "Oblicz" or `calculate` (grep, this branch).
The e2e hook does not expose the heading; a unit test on the pure rule is the oracle.

### 2. F3 — cap in draw order

`pickVariedSkills` (`src/core/round/variety.ts`) per draw: one `rng.next()` for the bucket, one `rng.pick(groups)` on
a review step, one `rng.pick(open | pool)`; `open` = pool skills whose type is under `maxPerType`, judged on the draws
so far. Called only by `variedRound` ← `buildAdaptiveRound` (`src/core/curriculum.ts`).

**Repro (scratch script, every `playableSteps` step of E1–E6 × seeds 1..200, weights as in `tests/variety.test.ts`):**
159 of 12 600 rounds have a type above 2 although an assignment within the rolled pools exists. Per step: E1.10 4,
E2.1 4, E2.3 11, E2.5 16, E2.6 4, E2.9 14, E3.2 1, E3.4 1, E3.6 4, E3.8 10, E4.2 4, E4.3 3, E4.5 13, E4.8 12, E5.1 1,
E5.2 28, E5.5 1, E5.6 12, E5.8 2, E5.9 2, E5.11 2, E5.12 1, E6.2 4, E6.6 4, E6.9 1. Seeded repros for the plan's red
test: `E2.1` seed 1 and seed 21 (current PV, current AS, current PV, previous AS, current PV → 3 × PLACE_VALUE);
`E1.10` seed 107 (earlier COUNT, earlier BONDS, current COUNT, earlier COMPARE_QTY, current COUNT → 3 × COUNT).

**Why lookahead is impossible in place.** Rolling all buckets first would consume `next()` values in a different
interleaving, so the bucket of draw *i* per seed would change and oracle (a) of
`tests/variety.test.ts` ("the bucket of each draw is the one pickRoundSkills rolls for the same seed") would fail.

**Approach that keeps the oracle.** Draw exactly as today (same calls, same order), remember each draw's rolled pool;
if a type ends above `maxPerType`, search an assignment of types to draws (each draw's type from its own pool, at most
`maxPerType` each, preferring the drawn type) and, for a draw whose type changes, take a skill of the new type from
the same pool without rng (e.g. the first, or the drawn index modulo the candidates). No assignment → keep the greedy
result (the forced case PA-2 allows). Prototype numbers over the same 12 600 rounds: 0 avoidable rounds left, 0 draws
in a different bucket, rng state identical afterwards; 2 625 rounds remain above 2, all with no assignment.
Oracles that keep holding: (a) buckets per seed; (e) the skill stays inside its rolled pool/group; (b) "a draw at a
type already seen twice means every skill of its pool was at 2" — after a successful repair no type exceeds 2, so (b)
is vacuous; for forced rounds the greedy result is unchanged. `spreadTypes` and the warm-up `pickVariedFromStage` are
untouched. The module comment's promise ("exactly the rng calls of `pickRoundSkills`") stays true.
Risk: the repair's rng-free choice inside a type is deterministic, so prompts may repeat more often; `distinctTasks`
in `buildAdaptiveRound` already redraws repeated prompts (`balance.round.uniqueRetries`).
Rounds in the game are seeded by `Date.now()` (`TaskScene`, `createRng(Date.now() >>> 0)`); no e2e pins round
contents by seed (`?e2eSkills` bypasses the draw), so changed skills per seed affect only unit tests.

### 3. N-1 and H-2 — "Obrazki"

- `ArtHealthLinesInput` has `cut: number` and `background?: boolean`; the `cut` line is
  `{ kind: 'cut'; count; background?: true }`; `createArtHealthView` (`src/ui/dom/artHealthView.ts`, `textOf`) maps it to
  `pl.settings.artCutBackground` or `pl.settings.artCut`. Neither text shows the count; the count matters for whether
  the line appears at all (`cut > 0`) and for `cutSaysIt` (the cause/advice lines are left out when the main cause is
  `cut` and `cut > 0`).
- H-2 effect, observed path: a start where only sounds or the font were cut makes `cut > 0`, so "Część obrazków nie
  zdążyła się wczytać…" appears with no picture missing. Counting `cutByTable.task + room + ui` removes it. With the
  picture count, `cutSaysIt` stays consistent: cause `cut` comes from a missing picture key, which is in one of the
  three picture tables.
- `bootLoad` is read untyped in `UIScene.openSettings` (`as { cut: readonly string[] }`); the record shape is described
  in `REGISTRY_KEYS.bootLoad`'s comment in `src/data/layout.ts` and typed in `src/testing/e2eHook.ts`
  (`bootLoadSnapshot`, with `cutByTable`) and `tests/e2e/support/hook.ts` (`bootLoad?` **without** `cutByTable`).
  A small pure helper in `core/artHealth.ts` (picture cut count from a `cutByTable` record, 0 when absent) keeps the
  scene free of the rule and gives a unit oracle.
- N-1 removal touches: `ArtHealthLinesInput.background`, the `cut` line's `background` field, the `background` branch
  in `artHealthLines`, `textOf`'s `case 'cut'`, `pl.settings.artCutBackground`, the `background:` argument in
  `UIScene.openSettings`, and DESIGN-GAP row 153 (`docs/design-gaps.md`). `hiddenMs` stays in the `bootLoad` record,
  the console line in `BootScene` and the e2e hook.
- Pins: `tests/artHealthLines.test.ts` — "marks the cut line as a background cut…", "keeps today's cut line when the
  load was never hidden", "adds no cut line for a hidden load that cut nothing" (all pass `background`);
  `tests/artHealthText.test.ts` `describe('pl.settings.artCutBackground')`; e2e `load-and-tab-guard.spec.ts`
  "#15 H-1 a tab hidden during the load does not cut it; … the panel says the game was in the background" (its last two
  assertions flip to `artCut` visible; the title changes). e2e "#14 B-4 a cut start says some pictures did not finish"
  asserts `artCut` visible after `stallall` (pictures are cut there too, so it holds). `tests/artHealth.test.ts`
  `describe('cutByTable')` pins the split (unchanged).
- L-8 (DOM test of `createArtHealthView`) fires because `textOf` changes; `vitest.config.mts` sets no environment
  (node) and no test under `tests/` declares `jsdom`/`happy-dom`, so a DOM test would need a new dev dependency —
  keep L-8 a follow-up and test the pure line list instead.
- An e2e for "only sounds cut → no cut line" would need `stallall` plus routes that hang only `assets/sounds/**`;
  sounds load last (`bootQueue`), so it is plausible but timing-sensitive; the pure helper test is the cheaper oracle.

### 4. N-4 — skill id on drawing errors

- `generateTask` (`src/core/tasks/generateTask.ts`) wraps generator + `assertDrawable` + `numberChoices` in one `try`,
  rethrowing via `skillFailure` (message `Skill <id>: …`, name kept, `skillId`); `errorCode` (`src/core/save.ts`)
  appends `/<skillId>`. `assertDrawable` uses no rng; adding cases that pass on today's data leaves `npm run sample`
  output byte-identical (no rng call, no field change).
- `coinLayout` (`src/core/round/dragLayout.ts`): throws when `kinds.length > spec.maxKinds`, and lazily in `coin(i)`
  when `i` is past `spec.art.dropCenters`. Called in `TaskScene` (field init with `[]`, and per task with
  `task0.visual.pay.tray`). Today `parseMoneyPayParams` and `validateVisual` bound the tray by `ART_LIMITS.trayKinds`
  (4, `src/data/measures.ts`) and `TASK_LAYOUT.coinDrag.maxKinds` is 4 — equal, but **no test ties them**
  (grep of `tests/`). The wallet index is bounded by `balance.coinDrag.maxTotal` (`trayDrag` rules, `moneyPay`
  parser, `walletCheck`), and `tests/coinLayout.test.ts` pins `dropCenters.length === balance.coinDrag.maxTotal`.
  Cheapest per-task check: `case 'money'` with `pay` → `v.pay.tray.length <= TASK_LAYOUT.coinDrag.maxKinds`
  (or call `coinLayout(TASK_LAYOUT.coinDrag, v.pay.tray)`, which runs the same throw; `core/tasks` → `core/round`
  imports exist already, e.g. `generators/clock.ts` imports `round/pictureLayout`). The wallet-place condition is a
  data invariant, not per task; it is already pinned.
- `columnMarks` (`src/core/tasks/written.ts`): throws `RangeError` when a carry would go past `visual.columns`; runs
  only in `TaskScene` (`columnState`, with `marksShown()` = none|first|all). `'first'` filters the `'all'` result, so
  `columnMarks(v, 'all')` not throwing covers every phase. `columnSteps` (its borrow throw) already runs inside the
  WRITTEN generator. `written.ts` imports only a type from `visual.ts`, so importing `columnMarks` into `visual.ts`
  makes no runtime cycle. Check: `case 'column': columnMarks(v, 'all')`.
- `faceDraw` (`src/ui/widgets/faceDraw.ts`): its throw is the `never` default of `drawShape`'s `switch (figure)`;
  `drawFace` takes a typed `Face` from `parseFace` (which accepts only known figure/colour/size ids), `CoordGrid`
  passes typed `FigureId`s. Unreachable from data; no runtime check needed.
- `faceLabel` (`src/core/tasks/faces.ts`, TypeError on a non-face code): callers are `generators/pattern.ts`
  (generation, inside `generateTask`'s `try`) and `describeVisual` (used by `scripts/sample.ts` only). No scene calls
  it, so its errors already carry the skill id in the game.

## Code References

- `src/core/round/prompt.ts` `isExpression` — expression shape test.
- `src/scenes/TaskScene.ts` `drawPrompt`, `currentNarration`, `fitPromptToSteps` — heading draw, narration options, layout-only use.
- `src/core/narration/spoken.ts` `spokenTask`, `narrationOf`, `NarrationOptions.calculate`.
- `src/core/tasks/generators/{compareNum,compareExpr,missingOp,missing}.ts` — `speak` questions; `factFamily.ts` swap, `placeValue.ts` decompose/`withSpeech`.
- `src/data/pl.ts` `round.calculate`, `tasks.compareSpeak`, `compareExprSpeak`, `missingOpSpeak`, `missing`, `bonds`, `sequence`; `settings.artCut`, `artCutBackground`.
- `src/core/round/variety.ts` `pickVariedSkills`, `variedRound`, `spreadTypes`, `pickVariedFromStage`; `src/core/curriculum.ts` `buildAdaptiveRound`.
- `tests/variety.test.ts` — share/replay/permutation oracles (a)–(e).
- `src/core/artHealth.ts` `artHealthLines`, `ArtHealthLinesInput`, `ArtHealthLine`, `cutByTable`; `src/scenes/UIScene.ts` `openSettings`; `src/ui/dom/artHealthView.ts` `textOf`, `createArtHealthView`; `src/scenes/BootScene.ts` (bootLoad record).
- `src/core/tasks/generateTask.ts` `generateTask`, `skillFailure`; `src/core/tasks/visual.ts` `assertDrawable`; `src/core/round/dragLayout.ts` `coinLayout`; `src/core/tasks/written.ts` `columnMarks`, `columnSteps`; `src/data/layout.ts` `TASK_LAYOUT.coinDrag`; `src/data/measures.ts` `ART_LIMITS.trayKinds`.

## Architecture Insights

- Narration and screen each re-derive presentation from the task; a shared pure rule in `core/round` returning a kind
  (words from `pl`) matches the project pattern (`modeWidgets`, `dragMode`, `canonicalInput`).
- `assertDrawable` is the established place for rng-free "fails at generation with the skill id" checks; extending it
  keeps `TaskScene` free of try/catch (PA-5).
- Variety and shares are separated: the bucket roll is the share contract; skill choice inside a pool is free as long
  as it uses no extra rng.

## Historical Context (from prior changes)

- `context/archive/2026-10-20-playtest-fixes-f01-f03/follow-ups/review-fixes.md` "(impl-review F3) Cap applied in draw
  order" — supported: the repro reproduces it (E2 steps among the 159 rounds); its note "drawing current first changes
  the skills drawn per seed" is supported and is why the repair approach is recommended instead.
- Audit `context/audits/observability/2026-10-20_2151-…` N-1/H-2/N-4: H-2 claim supported; N-1 cause (hidden time no
  longer cuts after H-1) supported by `bootLimitDue`/`hiddenMsAt` in `src/core/bootLimits.ts` counting visible time;
  N-4 claim partial — `faceDraw` is unreachable from data and `columnSteps` is already covered (as change.md corrected).

## Related Research

Not applicable (no earlier research.md on these areas was needed beyond the archive follow-ups above).

## Open Questions

- Heading for "… = □" (calculate recommended vs fill) and option (a)/(b) for the speaker — plan choice under the teacher read.
- Whether the narrator should drop the heading in a word round (today it says "Oblicz." there while the screen does not) — plan decides in or follow-up.
- None blocking the plan beyond the two choices above.
