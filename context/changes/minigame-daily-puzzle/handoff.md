# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-research` step (autonomous run 2026-10-14-save-s13b-s15-s14b). Research is complete and
`change.md` is `preparing`; nothing is planned or built. The next agent must not reopen the author's decisions
(Hasło + Zakrywanka, ×2 in `balance.ts`, agent-written original LOGIC puzzles, save v2 approved). It must also keep the
kit's dice answer as a tap on the 0–12 board, not answer tiles, and keep variant rounds out of `endRound`.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 2 on the branch: `docs(minigame-daily-puzzle): change identity (autonomous run)` (`a0890f8`), `docs(minigame-daily-puzzle): research` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/minigame-daily-puzzle/research.md` | Research: save v2 shape and the `1 → 2` step, verdicts on the triggered follow-ups, how round variants plug into `TaskScene.freshRound`/`finishRound`, the day seam, Hasło/Zakrywanka mechanics, the 15 original LOGIC puzzles with a teacher read, kit copy/layout, gap rows 79–86, open questions for the plan |
| `context/changes/minigame-daily-puzzle/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/minigame-daily-puzzle/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/minigame-daily-puzzle` (observed) |
| Puzzle check: the 15 table rows of `research.md` § 5 turned into `Task`s and run through `validateTask` (`max: 100`, `nouns` + the five new nouns), `firstHint`, `solutionSteps` (throwaway `node --import tsx` script in the session temp dir, not committed) | 15/15 `ok`, first hint shown, solution closed in 2 lines (observed) |
| Key worker claims spot-checked by reading the source | `decodeSave` catch → `corrupt` and `from > SAVE_VERSION` → `future`; `replaceGate`/`deviceSaveView` key on `loadReason === 'future'`; `TaskScene` `Date.now()` calls and `main.ts` `month`; `SUMMARY_LAYOUT.stars` size 98 gap 26; kit `manifest.json` `miniGames`, `preview.js` copy; `pl.room.slots` captions; last gap row 78 |
| Local gate (lint, typecheck, unit, build, e2e) | Not run — docs-only step, no product code changed. Baseline on main per the contract (inherited, unverified): `lint OK; typecheck OK; unit OK Tests 2224 passed; build OK; e2e OK 63 passed`. |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan minigame-daily-puzzle`

## 5. Open

- Plan decisions with a recommendation in `research.md` § Open Questions: `balance.variants.everyRounds` (3), the Hasło
  task source (learner's ADD_SUB/MULT/DIV expression skills, 3 tiles), a puzzle announcement card (gap 81), the kit's
  on-demand "Podpowiedź"/"Pokaż" (left out, gap 83), dice range 0–12 for every stage.
- Save v2 (in scope per research § 1): `VariantState` block, `MIGRATIONS[1]`, `save-v2.json` + `save-v2-fresh.json`
  frozen, v1 fixtures untouched, `backup-v1` before the first post-migration write (`createAutosaver` `attempt`),
  L-S1 `migration-failed` reason, `?e2eSave=v1` substitute for the two-build e2e, O1 `future` card copy, S12-09,
  S12-14. Tests that change on purpose: the `future` case and "the v1 format did not change" in `tests/save.test.ts`.
- Out with new triggers (to record at archive): S13-06 ("next save-format change or S-17"), real two-build e2e ("v3 or
  a parent report of lost progress after an update"), two instances / S12-15, M-S1 deploy part, S12-07/08/12/13.
  S12-02/03/11 stay untriggered as long as the migrated save is written by the normal autosave.
- TaskScene ordering follow-ups M-1, M-2, M-13 are triggered: build-then-commit for the variant branch, the variant
  end (`afterRound`) committed after it succeeds, the variant comes back after a parent stage change.
- DESIGN-GAP rows 79–86 to add in `docs/design-gaps.md` (list in research § 6).
- e2e seams for the plan: `?e2eDay=YYYY-MM-DD` (marker `e2eDay`) and `?e2eVariant=word|dice|puzzle` (marker), both in
  `vite/e2eHookGuard.mjs` and absent from `dist/`; request-file protocol for Chromium.
- `[human]` row for the plan: the author reads all 15 puzzles (research § 5) as a teacher before release.
- Roadmap Open Question 2 is answered (plan § 13): mark it resolved at archive time.

## 6. Autonomous decisions

1. **Variant rounds skip `endRound` entirely** — rejected: reuse `'warmup'` (it still records mastery and history), or
   count Hasło first tries. Why: dice and puzzles are not stage skills; a 13-throw board distorts the 5-task easing rule.
   Would change if the author wants Hasło to feed mastery (then pass its results to `recordRound` only).
2. **Variant state updates when a variant finishes, not when it starts** — rejected: update at start. Why: a reload or a
   parent stage change mid-variant then simply brings it back; nothing is lost or paid twice. Would change if
   playtest shows children reloading to dodge a variant (no evidence; there is no penalty to dodge).
3. **Day = local `YYYY-MM-DD` from an injected `today()` made in `main.ts`; puzzle available when `puzzleDay !==
   today`** — rejected: compare with `>` (a clock moved back would lock the puzzle), UTC dates, a day fixed at boot.
   Would change if the author wants a strict "one per real day" (then store the last date and compare with `>`).
4. **Hasło words from `pl.room.slots` (KANAPA, DYWAN, STOLIK, LAMPA, PÓŁKA, OBRAZ), not the kit's list** — rejected:
   the kit's SOFA/OKNO/FOTEL (not the game's words or slots). Would change if the author prefers the kit list in the
   `[human]` read.
5. **Dice answer = tap on the kit's 13-field board (new `CoverBoard`), 13 throws, each to an uncovered field** —
   rejected: 3 answer tiles (`change.md` scope table guessed tiles; the kit shows the board as the input). Would change
   if the visual gate finds the 160 px board tiles too small on a 1024 tablet.
6. **15 puzzles (9 E3, 6 E4), text-only, keypad by default and tiles where the classic error is instructive** —
   rejected: drawings with `scale`/`jugs` visuals (they cannot show two loaded pans or a pour). Would change if the
   author's read asks for pictures (then a new visual kind and gap rows).
7. **Real two-build e2e left out; `?e2eSave=v1` substitute in** — rejected: a third same-origin Playwright server now.
   Why: cost vs. the unit-tested migration path; the seam proves a v2 build loads a frozen v1 save through the browser.
   Would change if the maintainer wants risk #10 fully closed in this slice.
8. **No questions asked; scope from `change.md` and the step prompt** — the step prompt fixes `/10x-plan` as the next
   command and forbids AskUserQuestion.
