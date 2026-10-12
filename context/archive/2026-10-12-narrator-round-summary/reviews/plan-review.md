<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Lektor poleceń i podsumowanie rundy z „Kolejna runda” i „Do pokoju”

- **Plan**: context/changes/narrator-round-summary/plan.md
- **Mode**: Deep
- **Date**: 2026-10-12
- **Verdict**: SOUND after triage (REVISE before: 0 critical, 7 warnings, 2 observations)
- **Findings**: 0 critical, 7 warnings, 2 observations

Autonomous run 2026-10-12-s04-s08: there is no human to triage. Each finding was decided in place (contract rule 1):
every WARNING with an obvious fix was applied to plan.md, and the two OBSERVATIONs went to `## Known risks`.
`context/foundation/lessons.md` does not exist, so no lessons apply.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F5) |
| Blind Spots | WARNING (F1, F4) |
| Plan Completeness | WARNING (F2, F3, F6, F7) |

## Grounding

- **Paths: 13/13 found.** `src/core/round.ts`, `src/core/round/view.ts`, `src/scenes/{TaskScene,UIScene}.ts`, `src/main.ts`, `src/ui/widgets/StarCounter.ts`, `src/data/{balance,layout}.ts`, `docs/design-gaps.md`, `tests/{layout,romanGen,calendar}.test.ts`, `scripts/sample.ts`.
- **Symbols: 12/12 found.** `roundView`/`barOf` (`roundEnd`, `switchVisible: false`), `TaskScene.advance`/`sessionStars`/`snapshot().counter`, `StarCounter.value`, `installE2EHook`, `checkE2EHook`/`E2E_HOOK_MARKER`, `ROUND_SPEC`, `numberToWords`/`MAX_NUMBER_WORD` (it throws `RangeError` above 1000), `formatNumber`/`NUMBER_SOURCE`/`parseNumber`, `isExpression`, `generateMissing` `speak`, `validateTask` `texts`, `TASK_LAYOUT.starCounter` (left 1622, so the speaker's left = 1494 ✓).
- **Brief and plan agree.** Note that `HUD_LAYOUT` does not exist yet. Phase 5 creates it or puts the speaker in `TASK_LAYOUT`, and the plan allows either.
- **Progress and phases are consistent.** There are 12 `## Phase` bodies and 12 `### Phase` Progress blocks. The 55 rows still match the criteria 1:1 after the fixes. Every phase body has `Driver:` and `Driver why:`.
- **Drivers are correct.**
  - Phases 1–4 are `tdd`: pure logic that does not exist yet.
  - Phases 5–10 are `impl`: widgets, scene glue, the hook, and docs plus the seam sweep. Phase 10 holds the seam-sweep row (10.4).
  - Phases 11–12 are `e2e`, come after the seam sweep, and test features built in phases 5–9. Phase 11 cites risk #11. Phase 12 has no risk id and records that, as the contract allows.
- **Phaser claims, checked by a subagent in `node_modules/phaser` 4.2.1:**
  - CONFIRMED: `InputManager.updateInputPlugins` stops at lower scenes only when `capture` (the top scene hit an interactive object) or `_tempSkip` is set.
  - CONFIRMED: `SceneManager.switch` = sleep, then wake or start. Sleeping scenes get no input, and `create` is not re-run on wake.
  - CONFIRMED: draw order = config array order, which `switch` never changes.
  - CONFIRMED: touch `pointerdown` fires in `touchstart` and `pointerup` in `touchend`.
  - NEW: listeners on `game.events` still fire while their scene sleeps (feeds F4).
  - NEW: `no-restricted-globals` for `src/core/**` does not list `speechSynthesis` (F5).
  - NEW: an import of `installE2EHook` that is never called is tree-shaken out (F6).

## Orchestrator focus points

- **(a) Can the spoken text give away the answer?**
  - The risks come from the synthesizer reading Roman numerals (ROMAN when reading a numeral, CALENDAR `romanMonth`). The plan handles both by spelling the letters in phase 1. The other paths were checked:
    - MISSING: `□` → „okienko”.
    - COMPARE_NUM, COMPARE_EXPR, MISSING_OP: a question plus „okienko”.
    - ROMAN when writing a numeral: the prompt is digits and the answer is Roman, so nothing leaks.
    - WORD: digits in sentences.
    - FACT_FAMILY: the visible prompt already shows the operands.
    - NUMBER_WORDS: see F9.
    - Hint and solution narration reads only what the bar shows.
  - **There was no automated check across all types, only for ROMAN and `romanMonth` in phase 1** (F1). Phase 2 now adds that invariant.
- **(b) `numberToWords` above 1000.**
  - `numberToWords` throws for values above 1000. The plan turns only numbers ≤ 1000 in calculations into words and leaves larger ones as digits. Those occur in E5/E6, for example COMPARE_NUM up to 1 000 000 and ROUNDING up to 10 000.
  - Polish synthesizers read digit strings in the nominative correctly, and calculations use nominative cardinals. That is right.
  - The real trap is tokenization. „12 345” uses an NBSP, which counts as `\s`, so splitting on whitespace would make the narrator read „dwanaście trzysta czterdzieści pięć”. The "no NBSP" invariant does not catch that (F2, fixed).
- **(c) Build guard and e2e hook.**
  - The guard (`vite/e2eHookGuard.mjs` `checkE2EHook`) scans every chunk for `__martynkaE2E`, so it stays correct when the hook reads three scenes. The public scene methods the hook uses (`snapshot`, `targets`, the new `counterText`, `resumeTarget`) contain no marker, like the `TaskScene.snapshot` already in production.
  - The deliberate break in phase 8 was not a real break (F6, fixed).
  - Phase 12 widens `testMatch` correctly. `page.addInitScript` runs before `main.ts`, so the stub lands before `createNarrator` reads `window.speechSynthesis`.
- **(d) Phases 1–5 keep the S-04 round end.** Confirmed.
  - `switchVisible` is read only by `tests/roundView.test.ts`, which phase 4 updates. No scene renders it until phase 9.
  - `roundEnd` stays in `barOf` and `FeedbackBar` until phase 6.
  - `tests/e2e/task-round.spec.ts` stops at `finished` and at the registry `counter`, and never taps the round-end „Dalej”. So 6.3 also stays green after the bar is gone.
  - In phase 5, `UIScene` input does not take taps away from the tiles, confirmed in Phaser (F8 records the one way it could).
- **(e) Returning from the room.**
  - The kit's `preview.js` sets `roomReturn=screen` on `room` and `screen=roomReturn` on `resume`, so the plan follows the kit.
  - FR-010 says nothing about the return. FR-011 („przełącznik … widoczny … w pokoju”) is met by „Wróć do notesu”.
  - The plan overrides `change.md` decision 3, and the `[human]` row 10.7 names that. No reason to overturn it.
  - The HUD switch had to disappear in the room, which became F4.
- **Follow-ups with `Trigger: S-05`** (`context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md`):

  | Follow-up | Outcome |
  |---|---|
  | HUD switch | included (phase 9, can be cut) |
  | drawn counter | included (phase 8 `counterText`, phase 11) |
  | `pl.title` | deferred to S-06, convincingly: the summary uses `round.correct`, not the title |
  | solution-step dots | deferred to the next `SolutionSteps` change, justified: S-05 does not touch `SolutionSteps` |

  Phase 10 carries the deferred ones forward.

## Findings

### F1 — No automated check that the spoken text never gives away the answer

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 2 — §3 Sample i testy
- **Detail**:
  - Phase 1 checks "does not give away the result" only for ROMAN and `romanMonth`, against a hand-picked list of forms. The phase 2 invariant only checks that symbols and NBSP are gone.
  - A new `speak` in a later slice, or a template that prints a Roman numeral (calendar, word problem), would pass. The synthesizer reads „IX” as „dziewięć”. So would a comparison prompt whose question names the sign („mniejsze”).
- **Fix**: phase 2 adds the invariant „mowa nie zdradza wyniku” over every E1–E6 skill × seed. Its two rules:
  1. `spokenText(speak ?? prompt)` has no standalone Roman-numeral token.
  2. If no spoken form of the answer is a token in the visible prompt, none is a token in the spoken text. The spoken forms are: digits without NBSP, `numberToWords` ≤ 1000, a text answer in lower case, and the `pl.speech` word for a sign answer.

  The deliberate break gained a case (ROMAN without spelling) in the body and in Progress 2.2.
  - Strength: covers every generator, now and later.
  - Tradeoff: the token matching has to handle the sign words.
  - Confidence: HIGH, because the stages and `generateTask` already drive `contentInvariants.test.ts`.
  - Blind spot: answers the synthesizer gives away through its own reading of digits. NUMBER_WORDS (F9) is the only such case, and it does not go beyond the visible prompt.
- **Decision**: FIXED (applied to plan.md Phase 2)

### F2 — Grouped numbers (NBSP) could be split into wrong words

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — §2 Reguły
- **Detail**: `formatNumber` writes „12 345” with an NBSP, and NBSP matches `\s`. Tokenizing a calculation segment on whitespace gives „dwanaście” + „trzysta czterdzieści pięć”, and the „bez NBSP” invariant still passes. This affects E5/E6: COMPARE_NUM up to 1 000 000 and ROUNDING up to 10 000.
- **Fix**: the contract now names `NUMBER_SOURCE` and `parseNumber` as the way to extract numbers, and NBSP is removed only between digits (its only source is `formatNumber`). New test cases: „12 345 □ 12 354”, „Zaokrąglij 12 345 …”, 1000 → „tysiąc”, 1001 → digits. The deliberate break covers splitting on `\s`.
- **Decision**: FIXED

### F3 — Splitting sentences on `: ` cuts division in half

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — §2 Reguły
- **Detail**: The plan splits segments on `: `, but „12 : 3 = □” (`DIVIDE` = `:` with spaces) also contains `: `. The calculation would become „12 ” and „3 = □”, so „podzielić przez” is lost and the second half is no longer a whole calculation.
- **Fix**: split only on a colon attached to a word (`/(?<=\p{L}):\s/u`), with test cases „12 : 3 = □” and FACT_FAMILY „… Sprawdź: 4 · 3 = □”.
- **Decision**: FIXED

### F4 — The HUD „Do pokoju” stays visible in the room, and a tap reaches a sleeping scene

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 9, Phase 11
- **Detail**:
  - `TaskScene` sets `REGISTRY_KEYS.roomSwitch` from `switchVisible`. It is `true` in `done`, and nothing clears it on `scene.switch`, because the sleeping `TaskScene` does not render. The button would show in the room.
  - Phaser `Systems.sleep` does not detach listeners on `game.events`, so the `toRoom` handler would run while `TaskScene` sleeps.
- **Fix**:
  - Phase 9: clear `roomSwitch` (next to `narration`) before the switch and restore it on `wake`. The `toRoom` handler checks `this.sys.isSleeping()`.
  - Phase 11: the room test asserts `targets.roomSwitch === null` in the room. It stays in the same test, so the e2e delta stays +1.
- **Decision**: FIXED

### F5 — The ESLint boundary does not keep `speechSynthesis` out of `src/core`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 3 — criterion 3.3
- **Detail**:
  - The plan claims „bez zmian granic ESLint … `src/core/narration/**` bez globali”.
  - In fact `no-restricted-globals` for `src/core/**` lists only `window`, `document`, `navigator` and `localStorage`. `no-undef` is off for TS, and `tsconfig` has the `DOM` lib.
  - So a core file could call `speechSynthesis.speak` with no error, and the boundary the plan relies on would be fiction for exactly this slice.
- **Fix**: phase 3 adds `speechSynthesis` and `SpeechSynthesisUtterance` to the core list in `eslint.config.mjs`, plus a case in `tests/lint-boundaries.test.ts`. The gate command does not change. Progress 3.3 was reworded.
- **Decision**: FIXED

### F6 — The phase 8 deliberate break would stay green

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 8 — criterion 8.3
- **Detail**:
  - The planned break, „import `e2eHook` z `UIScene` bez warunku”, would not fail the build. `e2eHook.ts` has no module-level effects and `package.json` has no `sideEffects`, so Rollup and terser drop the export with its marker. The guard stays green, and the break proves nothing.
  - A scene importing the hook would also create an import cycle (`e2eHook` → `TaskScene`).
- **Fix**: the break is now `installE2EHook(game)` called in `main.ts` outside `if (__E2E_HOOK__)`. The meta-check says why a bare import is not a break. Progress 8.3 was updated.
- **Decision**: FIXED

### F7 — The teacher read for the generators leaves out E2, E4 and E6

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — 1.5; Phase 2/5 (contract of `narrationOf`)
- **Detail**:
  - Row 1.5 read only E1, E3 and E5. COMPARE_NUM, COMPARE_EXPR and MISSING_OP are also in E2, E4 and E6 (E6: comparisons up to 1 000 000). CLAUDE.md requires reading every task of the changed steps.
  - Separately, phase 5 said `narration` = `spokenText` of `narrationOf(...)`, while phase 2 gives `narrationOf` the words. That means a possible double conversion.
- **Fix**:
  - 1.5 now reads `sample -- E1 … E6 --count 6`, with the list of stages per type.
  - The contract says `narrationOf` returns the final spoken text, and phase 5 calls only that.
- **Decision**: FIXED

### F8 — A full-screen hit zone in `UIScene` would block the task

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 / Known risks
- **Detail**: Phaser blocks the lower scenes when any interactive object in `UIScene` is hit (`InputPlugin.update`, `total > 0`). Plain HUD buttons are safe. An interactive background or zone would take every tap away from the tiles.
- **Fix**: recorded in `## Known risks`. Spec #11 catches it from phase 5 on.
- **Decision**: RECORDED

### F9 — NUMBER_WORDS digits → words: the synthesizer pronounces what the answer sounds like

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: „Jak zapisać słownie liczbę 23?” is read as „… dwadzieścia trzy”. This gives nothing beyond the visible prompt, because the exercise is writing the number in words, not knowing the number. The F1 invariant passes it because the spoken text keeps the digits.
- **Fix**: recorded in `## Known risks`. Teacher read 2.5 decides whether it stays.
- **Decision**: RECORDED

## Triage summary

- Fixed: F1, F2, F3, F4, F5, F6, F7 (7)
- Recorded: F8, F9 (2)
- Verdict after fixes: REVISE → SOUND

VERDICT: PROCEED — the approach holds (speech content in `core`, the narrator over an injected synthesizer, the summary as a layer in `TaskScene`, `scene.switch` to the room). All seven warnings were narrow contract or test gaps and are fixed in plan.md. Phases 1–5 keep the S-04 round end, and the build guard stays sound.
