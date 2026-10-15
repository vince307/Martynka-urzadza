# Handoff — `text-measure-time-types` (slice S-14c)

Written by the `/10x-plan-review` step of run `2026-10-15-fix-s14c-s14d`. The plan is reviewed (VERDICT: PROCEED) and fixed in
place; the slice is ready for phase 1 (`Driver: tdd`). The next agent must not get wrong: no INEQUALITY skill enters the data
before phase 2, and phase 2 must NOT add snapshot field names to `vite/e2eHookGuard.mjs` (the snapshot ships in production; the
build would fail — plan-review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | 4 on top of `e2f7caa`: change identity, research, plan, `docs(text-measure-time-types): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 65 (all; `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (four files staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/reviews/plan-review.md` | the review: 2 CRITICAL, 6 WARNING, 2 OBSERVATION, code-verified checks (INEQUALITY reachability, E6 pins/oracle, review step, follow-ups), `VERDICT: PROCEED` |
| `context/changes/text-measure-time-types/plan.md` | fixed in place: hook/guard sentence (F1), phase 11 (a) via unlock card + new break p11a (F2), `markedTile` read from `AnswerTiles` (F3), phase 7 ≥ 50 % share + phase 11 up to 3 rounds (F4), validator path (F5), Known risks for phase 4 size and e2e randomness (F6, F4), `MassParams` union (F7), review `minCurrent` in `buildAdaptiveRound` + `currentGroups` fallback (F8), phase 9 follow-ups (O10); Progress 9.1 and 11.2 texts updated to match |
| `context/changes/text-measure-time-types/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/text-measure-time-types/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/text-measure-time-types` |
| phase titles `## Phase N` ↔ Progress `### Phase N` | `diff` identical (11); 65 `- [ ]` rows; every phase has `Driver:` (1,3–8 tdd; 2,9 impl; 10–11 e2e) |
| `grep -l hintVisual dist/_app/*.js` | hit in `index-*.js` → snapshot fields ship in production (basis of F1) |
| E6 oracle recomputed in node | n = 10 → ceil 1,3,5,7,9 → `[2,3,5,7,9,10]`; n = 11 → `[2,4,6,8,10,11]` (phase 8 break goes red) |
| code reads | `isCorrect` (`src/core/round.ts`), `TaskScene.render`/`snapshot`/`submit`, `AnswerTiles.markCorrect`/`markHint`, `answerWrong`/`answerRight`, `WORD_TYPES`, `generateTask`, `hints.ts` `leaksAnswer`/`solutionSteps`, `curriculum.ts` start/floor/buckets/unlock/`buildAdaptiveRound`, `pick.ts`, `artFilter.ts`, `progress.ts`, `placement.ts`, `checkE2EHook`, `mass.ts` `MassParams` |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code touched (baseline on main e2f7caa: lint OK, typecheck OK, 2479 tests, build OK, e2e 82 — inherited, unverified) |

## 4. Next command

`/10x-tdd text-measure-time-types` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` rows (post-run checklist): 4.8 (tablet voice reads `spokenTime` „8 15”), 9.6 (decisions against ZADANIA literal text and threshold rises; listed in plan phase 9).
- Known risks in `plan.md` `## Known risks`: phase 4 size (in-phase split recipe p4a/p4b), phase 11 e2e randomness (limit 3 rounds, phase 7 share ≥ 50 %), two right tiles for 6-year-olds, long prompts at 1024 px.
- DESIGN-GAP planned: row 98 (several right tiles, `TaskScene` marking) in phase 2.
- Conditional: `capacity_half_l_e5` drops to follow-up `Trigger: S-17` if variety invariants fail (plan decision 5).
- Follow-ups to write in phase 9 (`follow-ups/review-fixes.md`): set-the-clock E5–E6, 200/500 zł, WRITTEN missing digits + F9, ARROW_TABLE multi-number, LOGIC in E6.11, timetable table, review title in HUD, mass comparisons stay with the scale, INEQUALITY mistake example in the parent preview.
- Phase 1 title says „dystraktorach” but `src/core/tasks/distractors.ts` needs no change (O9).
- E2E phases 10–11 use the request-file protocol; phase 11 reaches E6.11 by importing a v2 save at `unlockedStep.E6 = 10` and unlocking through one round.

## 6. Autonomous decisions

1. **Verdict PROCEED, not RETHINK.** Why: the approach holds against the code (`isCorrect` honours `check`; review flag + `stepPlayable` keeps save v2 and S-15 untouched; oracle math checks out). Would change: a phase discovering that `TaskScene` cannot keep the submitted value across `render` without core state (then the round state carries it — still no save change).
2. **F2 fixed with Fix A (unlock card) over a progress-panel assertion.** Rejected: reading the settings panel's „krok N z M” (needs the 2 s gear hold + adult gate again after import). Why: the unlock card is the product signal, matches screenshot 8.7, and the break `stepPlayable` without `review` turns it red. Would change: the unlock round proving too slow/flaky → assert the progress panel instead.
3. **F6 accepted as a Known risk, phase 4 not split now.** Rejected: renumbering to 12 phases. Why: ≤ 3 generators rule holds; renumbering ripples through Progress, handoff and drivers. Would change: phase 4 agent hitting the context limit → use the recipe (two commits in the phase).
4. **Product decisions (INEQUALITY 2 right tiles, MIX step-first ~14 % E5, no LOGIC, text timetable, whole-złoty PRICE) not overturned.** Why: none is clearly wrong against ZADANIA/PRD and all sit in `[human]` 9.6. Would change: the author's read in 9.6.
5. **O9 left unfixed** (phase title mentions distractors). Why: renaming touches Progress titles for no behavioural gain. Would change: an implementer misreading it as a required change.
