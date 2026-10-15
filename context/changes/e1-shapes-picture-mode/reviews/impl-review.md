<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: E1 z obrazkami — figury, szlaczki, porównywanie liczebności, „który z kolei”, CHOOSE_OP z obrazkiem i płacenie monetami

- **Plan**: context/changes/e1-shapes-picture-mode/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-15
- **Verdict**: APPROVED (NEEDS ATTENTION before triage: 4 warnings, all fixed in this step)
- **Findings**: 0 critical, 4 warnings, 4 observations

Method: two read-only subagents (plan drift; safety, quality and patterns), every suite re-run in this step, the teacher read of
E1.1, E1.2, E1.3, E1.11 and E2.2 (`npm run sample -- E1 --count 6`, `-- E2 --count 6`), one deliberate break re-executed.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (after F1; small drifts in F5) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (after F1-F4) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F6, observations only) |
| Success Criteria | PASS |

## Suites (observed in this step, baseline main 10d6fe7: unit 2672, e2e 86)

| Gate | Before fixes (HEAD 7943e6d) | After fixes |
|---|---|---|
| lint / typecheck | OK / OK | OK / OK |
| unit `npm test` | 2832 passed = 2672 + 160 | 2834 passed = 2672 + 162 (+2 review tests) |
| deploy scripts, `sample` E1-E6 | OK, all exit 0 | OK, all exit 0 |
| build | `e2e hook: absent (2 chunks checked)` | same |
| e2e `--workers=4` | not re-run on HEAD (orchestrator: 93 passed on 75861ab) | **93 passed (6.5 min) = 86 + 7** |

Deliberate break re-executed: the wallet reset removed from `TaskScene.submit` (`e2e-break-review.patch`) → `money-pay.spec`
"too many coins" red: `expect(missed.wallet).toEqual([])`, received `[500, 100, 100, 100, 100, 100]`; restored. Meta-check: the
assertion reads the scene's wallet through the hook after a real wrong touch payment, so it proves the scene reset, not the
helper.

## Code-level checks requested by the run

- Face codes never shown/spoken raw: `solutionSteps` (faceText), `spokenTask` via `solutionSteps`, `describeVisual` (faceLabel),
  `roundResults`/`exampleAnswer` for the parent preview — MATCH. `captureFirstWrong` stores numbers/strings only.
- SHAPES never pairs a rectangle target with a square: `clash()` in `shapes.ts` for `name`, `all` and `odd` by figure;
  `tests/shapesSquare.test.ts` — MATCH; teacher read found none.
- MONEY_PAY `number[]` + `check`: `isCorrect` uses `check` first; `walletCheck` (tray nominals, sum, `maxTotal`, exact length for
  `fewest`); `validateTask`, `canonicalInput` coins branch, `leaksAnswer` false for arrays; S-15 word minigame takes only
  `WORD_TYPES` (ADD_SUB/MULT/DIV) — MATCH. Mistake example: wallets never stored (follow-up kept).
- Picture mode: E1 only, `pictureMode` from age/month band/`easedRounds`; `save.ts`, `src/core/types.ts`, `tests/fixtures/`,
  `src/core/variants.ts` unchanged; save v2; E1 ORACLE `[2, 4, 6, 8, 10, 11]`; skill counts E1.1=4, E1.2=3, E1.3=5, E1.11=6,
  E2.2=4 match the threshold table.
- trayDrag refactor (phase 6) vs block drag: `blockDrag.ts` (28 lines) keeps every public name; only S13-09 changed
  behaviour (a same-finger `down` while carrying drops and re-grabs), documented in `trayDrag.ts`; old `tests/blockDrag.test.ts`
  assertions untouched; `drawn-tasks.spec` green in the full run.
- Phase 3 RED: the picture CHOOSE_OP first test failed with the parser `TypeError` ("kinds must be … got ['picture']"). Judged
  acceptable: the parser rejecting an unknown kind IS the unimplemented contract (not an import error), the sibling test was red
  on an assertion, and breaks 1-2 of the same phase turned the picture oracle red on assertions.

## Teacher read (E1.1, E1.2, E1.3, E1.11, E2.2; 6 draws per skill)

Picture-first and narrator-read throughout (every prompt has `czyta:`; tiles are figures, icons, numbers or 3 short words).
SHAPES: "Dotknij kwadratu/koła/prostokąta", "wszystkich kół/trójkątów" (genitive right); intruder unambiguous in all draws; hints
teach the feature ("Kwadrat ma 4 równe boki i 4 rogi"), the deciding feature only in the last line. PATTERN: one possible next
item, hint "Szlaczek się powtarza." then the period. COMPARE_QTY: "więcej kłębków/lamp/gruszek", counts "1 czajniczek, 4 kłębki,
7 lamp" agree. ORDINAL: hint "znacznik" unclear for a 6-year-old → F4. CHOOSE_OP picture: "Na stole było 1 kwiatek" → F3. MONEY_PAY:
"Zapłać 7 zł", spoken "dwa złote / pięć złotych / dwanaście złotych" agree, first hint method only, the sum in the last line; a
10 zł target said "jedna moneta" → F2; banknote only in E2.2 confirmed.

## Findings

### F1 — A wrong payment stayed in the wallet (scene reset missing)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `submit`
- **Detail**: `submit` resets the keypad, digit boxes, select, block mat and clock after a miss, but not `coinState`. The plan
  (Critical Implementation Details, „Scena”) lists „reset po złej odpowiedzi” among the per-`dragKind` branches. The wrong
  wallet stayed through second try, solution and retype; the child was not stuck (a tap on a wallet coin takes it out, also at
  `maxTotal`), but had to tap out up to 10 coins, the solution showed the wrong coins beside it, and the generic e2e
  `answerWrong` → `answerRight` on a coin task (unpinned E1/E2 rounds, retype) failed because `payCoins` assumes an empty wallet.
  Product decision: a wrong payment is emptied, like a wrong build on the block mat and wrong digits (“so the right ones are not
  given away”); the child pays again from the tray; taking a single coin out by touch during an attempt still works.
- **Fix**: `this.coinState = { mat: emptyWallet(), carrying: null }` next to the block/clock resets in `submit`; `payCoins`
  (`tests/e2e/support/hook.ts`) asserts an empty wallet before paying (readable error instead of a mismatch); `money-pay.spec`
  "too many coins" asserts `wallet` is `[]` after each miss and in retype (tap-out loops removed; removal by tap stays covered by
  "a cancelled drag … a tap on a wallet coin takes it out").
  - Strength: matches the scene's reset rule for every other answer mode; makes the helpers exhaustive for any phase.
  - Tradeoff: a child who was one coin off must lay the whole payment again (2-4 coins in E1).
  - Confidence: HIGH — plan text and neighbouring resets agree; break re-executed red.
  - Blind spot: a playtest may prefer keeping the wallet to fix it (then: keep wallet + make `payCoins` empty it first).
- **Decision**: FIXED

### F2 — "Wystarczy jedna moneta: 10 zł." for a banknote

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/moneyPay.ts `generateMoneyPay`; src/data/pl.ts `tasks.moneyPayOneLine`
- **Detail**: E2.2 tray has `note-10zl`; a 10 zł target gives a one-piece wallet and the last hint called the note a coin.
- **Fix**: `moneyPayOneLine(amount, note)` → "Wystarczy jeden banknot: 10 zł."; test `a one-piece payment names a note as a note`
  in `tests/moneyPay.test.ts` (red first: received "Wystarczy jedna moneta: 10 zł.").
- **Decision**: FIXED

### F3 — "Na stole było 1 kwiatek" (verb agreement with 1)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/chooseOp.ts `generateChooseOp` (picture branch)
- **Detail**: with a first group of 1 the story used "było" ("było 1 kwiatek"); correct Polish needs the noun's gender
  (był/była/było), which `nouns.ts` does not hold. The phase-3 teacher read checked 2-4/5+ only.
- **Fix**: the picture story starts at 2 things (`a < 2` → redraw); test `picture: the table starts with at least 2 things` in
  `tests/chooseOp.test.ts` (red first: `Na stole było 1 kłębek`). Content invariants stay green.
- **Decision**: FIXED

### F4 — ORDINAL hint "znacznik" unclear for a 6-year-old

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `tasks.ordinalFromMarkHint`
- **Detail**: orchestrator OBS confirmed: "Liczymy od znacznika po lewej stronie." — the mark drawn by `IconRow` is a gold flag
  on a teal pole (design-gaps row 102).
- **Fix**: "Zacznij liczyć od chorągiewki po lewej stronie."
- **Decision**: FIXED

### F5 — Small drifts from the plan text

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/wordTemplates.ts `WordTemplate.needsPrice`, `contextsFor`; src/data/curriculum/E1.ts `E1.1.compare_qty_10`, `E1.1.pattern`; src/core/coins.ts `fewestCoins`; src/scenes/TaskScene.ts `feedDrag`, `submit`, `clockTask`
- **Detail**: a template flag `needsPrice` was added (plan: "bez nowego pola", content not save — harmless); `equalShare` 0.25
  (plan ~20 %); PATTERN skill has no `ABC` period (parser allows it); `fewestCoins` is DP rather than greedy (better);
  `feedDrag`/`submit` remain if-chains (render and `okTarget` are exhaustive `never` switches).
- **Fix**: none needed; recorded.
- **Decision**: ACCEPTED

### F6 — Duplicated small helpers

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `MONEY.find(m => m.id === id)?.grosze` in src/core/coins.ts, generators/moneyPay.ts, tasks/validate.ts, tasks/visual.ts, generators/money.ts; src/ui/widgets/PatternRow.ts private `dashedRect` vs src/ui/widgets/dashedRect.ts
- **Fix**: follow-up (one `grosze(id)` export; shared `dashedRect` with scale).
- **Decision**: FOLLOW-UP

### F7 — Wallet edge cases without feedback

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/trayDrag.ts `stepTrayDrag` (`put` at `maxTotal`); src/ui/widgets/CoinWallet.ts `paint` (`lastIndexOf` for the lifted coin)
- **Detail**: a drop on a full wallet is a silent no-op (nothing stuck: a tap removes a coin); lifting an earlier coin of a
  kind leaves the gap in the last cell of that kind (value unaffected).
- **Fix**: follow-ups (gentle cue on a full wallet; hide the touched cell).
- **Decision**: FOLLOW-UP

### F8 — Inherited/minor content and robustness notes

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/data/pl.ts `tasks.chooseOpHint`, `tasks.moneyPayPrompt`; src/core/tasks/generators/shapes.ts `all`
- **Detail**: CHOOSE_OP first hint "Przybyło, więc dodajemy." names the operation (inherited from the text kinds, unchanged by
  this slice); "Użyj jak najmniej monet." also covers the 10 zł note in E2.2 (child-acceptable); SHAPES `all` falls through its
  `MAX_ATTEMPTS` loop silently instead of throwing (cannot exhaust with today's data: pool ≥ 16 for ≤ 4 needed).
- **Fix**: follow-ups with triggers.
- **Decision**: FOLLOW-UP

## Manual rows

[reviewer] rows ticked by this review: 1.5, 2.7, 3.5, 4.6, 7.5, 8.6 (teacher read, after F2-F4), 5.5 (no `Settings`/`SavedLearner`
field, `variants.ts` and easing weights unchanged, row 21 honest), 6.5 (`blockDrag.ts` thin instance, S13-09 comment in
`trayDrag.ts`), 9.5 (every follow-up has `Trigger:`, no stale two-branch comments, `drawShape` shared by `CoordGrid`).
Left open: [visual] 2.8, 4.7, 8.7; [human] 9.6, 9.7.

MERGE: CLEAR — no critical finding; the wallet question is resolved (emptied after a wrong payment, proved red/green in e2e), three content warnings fixed with red-first tests, unit 2672 + 162 and e2e 86 + 7 all green on the fixed tree.
