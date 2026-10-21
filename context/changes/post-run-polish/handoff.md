# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-impl-review` of run 2026-10-21-post-run-polish: full-plan review APPROVED, `MERGE: CLEAR`, no fix commit. The next step is the visual gate (three [visual] rows); do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts` (shares are the contract) and keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + p1 `11f0c69`, p2 `3be7518`, p3 `8a0f76d`, p4 `ccf03af`, p5 `bb295b4`, p6 `91a1be1`, p7 `7004a50`, p8 `d7685b4`, p9 `7b5bd55`, handoff `de5a308` + this impl-review commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 3 (`grep -c '^- \[ \]' plan.md`): 2.6 [human], 3.5 [visual], 6.5 [visual] |
| Working tree | clean after the impl-review commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/reviews/impl-review.md` | full-plan review (phases 1–9): 0 critical, 0 warning, 5 observations; teacher read E1–E6; round print per stage; ends `MERGE: CLEAR — …` |
| `context/changes/post-run-polish/plan.md` | rows 2.5, 8.5 ([reviewer]) and 7.4, 8.4, 9.2 (full suite) ticked |
| `context/changes/post-run-polish/change.md` | status `impl_reviewed` |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 3736 passed (baseline 3710, +26) |
| deploy scripts, `npm run sample -- E1..E6` | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> tests/e2e/narrator.spec.ts tests/e2e/load-and-tab-guard.spec.ts` | 10 passed |
| `npx playwright test --list` | Total: 144 (baseline 143, +1) |
| full e2e `--workers=4` on `de5a308` | 144 passed (143+1) — orchestrator's observation, not re-run (no product code changed here) |
| break: `repairCap` skipped in `pickVariedSkills` | RED, 4 tests of `tests/variety.test.ts` ("expected 3 to be less than or equal to 2"); restored |
| break: `drawPrompt` draws `pl.round.heading.calculate` for every kind | RED, e2e `#11 the heading …` (`Expected: "Wstaw znak"`, `Received: "Oblicz"`); restored, re-run green (rebuilt `dist-e2e/`) |
| teacher read `npm run sample -- <S> --count 6` E1–E6 | pass (headings fit; recorded in impl-review) |
| round print, every step × 200 seeds | 0 avoidable 3-of-a-kind in every stage |
| save format | `SAVE_VERSION` 4; save/migrations/fixtures/balance/curriculum/mastery diff empty |
| ports 4397/4398 after the runs | not listening |

## 4. Next command

`visual gate` (headings on a sign task, a box-filling task and an ordinary task; "Obrazki" with a cut)

## 5. Open

- [visual] 3.5: hook build, `?e2eSkills=E1.2.compare_num_5` → "Wstaw znak"; `E1.3` missing with the box inside or `E2.4.fact_swap_20` → "Uzupełnij"; an ADD_SUB skill → "Oblicz"; 1440 and 1024 wide, no overlap (`TaskScene.drawPrompt`).
- [visual] 6.5: `?e2eArt=stallall`, settings "Obrazki" shows `pl.settings.artCut`, no "w tle" sentence, 1440 and 1024 (`createArtHealthView`).
- [human] 2.6: tablet with a Polish voice, speaker on a comparison task, "Wstaw znak" pronounced clearly.
- Observations O1–O5 in `reviews/impl-review.md` (all accepted; O1 and O3 already have follow-ups in `follow-ups/review-fixes.md`).
- DESIGN-GAP 153 (closed text) and 154 ("Wstaw znak"/"Uzupełnij") in `docs/design-gaps.md`.

## 6. Autonomous decisions

- R-1 Both review lenses done in-session instead of two subagents: the source diff is 11 files, about 150 lines. Would change: a diff large enough to crowd the context.
- R-2 Triage in place (contract rule 1): no CRITICAL or WARNING; five observations accepted. Would change: a CRITICAL, or a WARNING with a cheap fix.
- R-3 Full e2e not re-run: no product code changed in this step; the orchestrator's 144 on `de5a308` is cited as its observation, and the two changed spec files were re-run here. Would change: a fix commit in this step.
- R-4 Rows 7.4, 8.4, 9.2 ticked on the orchestrator's full-suite result plus this step's re-run of unit, gate and the changed specs; `--list` total 144 matches. Would change: a differing count.
- R-5 Round print used synthetic buckets (`skillBuckets` without mastery) and the real weights, as `tests/variety.test.ts` does; the avoidability check replays the rolled pools independently of `repairCap`. Would change: a playtest round that the replay does not model (e.g. picture-mode or art filters).
