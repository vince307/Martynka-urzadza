# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 9 (commit `cda16d1`): the last impl phase. Docs (design gaps 59-66, follow-ups, CLAUDE.md, profile § 10), the seam sweep of phases 1-8 and four content fixes from the orchestrator's teacher read. Phase 10 (e2e) is next; the e2e of this phase was NOT run here (Chromium cannot start).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | p1 `46aff1d`, p2 `d4f4470` + `ab0dc05`, p3 `b6a947d`, p4 `ba4e0da`, p5 `89e5ea0`, p6 `44c4f19`, p7 `5cdf740`, p8 `fe8e025`, p9 `cda16d1`, this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (the implement epilogue is for the last impl/e2e phase, phase 10) |
| `## Progress` rows | 8.6 e2e ticked from the orchestrator note; 9.2-9.4 ticked; 9.1 open for the e2e part (orchestrator) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `docs/design-gaps.md` | rows 59-66 (money table, scale in balance only, jugs, MULT_GROUPS frames, keypad without minus/comma, thermometer scale -30..+30 in E3-E5, tall drawing beside the keypad, stand-in box); each has a `DESIGN-GAP n` comment in the widget or generator |
| `context/changes/art-tasks-all-stages/follow-ups/review-fixes.md` | follow-ups with `Trigger:` lines (S-14b/c/d, S-16, conditions) |
| `CLAUDE.md` | Current state sentence for S-14, `npm run art` in Commands, "Not yet present" corrected |
| `context/foundation/autonomous-run.md` | § 10 "Paths asserted on purpose although absent" = none; `updated: 2026-10-14`; `.env` does not mirror the list (checked) |
| `src/data/curriculum/E3.ts`, `src/core/tasks/generators/temperature.ts`, `src/data/pl.ts` | E3.11 `temperature_read_30` now `low: 0` (0..30, step 5); `textChoices` takes the range and offers the opposite sign only when it is inside it; E4.7 hints "Dwa/Cztery takie dzbanki to razem jeden litr."; `temperatureChangeHint(degrees, warmer)` = "Ociepliło się o N stopni." / "Ochłodziło się o N stopni." |
| `tests/temperature.test.ts`, `tests/capacity.test.ts` | new `negative temperatures wait for E6` (E3-E5 temperature skills from the data: no value below zero in drawing, tiles, hints, prompt), updated last-hint and howMany first-hint expectations |
| `src/core/tasks/types.ts` | comment on `visual` lists all kinds |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1847 passed (branch baseline 1844, +3: the E3-E5 temperature checks) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` ... `E6` | "Naruszenia: 0" each; `--count 6` re-read for E3.11, E4.7, E6.1 after the fixes |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS (252 paths) |
| RED (fix 1) | `E3.11.temperature_read_30 seed=1 draw=0 ...: expected -15 to be greater than or equal to 0` |
| Deliberate break | `CLAUDE.md` pointed at `src/ui/widgets/ArtImg.ts`: validator `missing: 1`, FAIL; restored, PASS. Meta-check: the validator reads the path from the sentence, so it proves path checking, not wording |
| e2e | not runnable in this session — orchestrator gate (plain `npx playwright test --config=...` once: chromium-hook tests failed at launch, 20 not run). Expected `42 passed + 0`; E3.11 data changed, so `adaptive`/`first-launch` are the ones to watch (E3 only as previous-stage pool of E4) |
| Teacher read | E3.11: tiles "0/5/10/15/20/25/30 °C", always four, none negative, hints without "Poniżej zera"; E4.7: "Dwa takie dzbanki to razem jeden litr. / 2 · 2 = 4 / To razem 4 dzbanki."; E6.1: "Ociepliło się o 6 stopni.", "Ochłodziło się o 20 stopni." (numerals 4 stopnie, 26 stopni agree) |
| Seam sweep | `add.image` only inside `ArtImage` (the five widgets use it); no placeholder left in `TaskPicture` (stand-in is in `ArtImage`, row 66); `TaskPicture.hide()` hides all nine widgets, `TaskScene.hideTaskLayer` calls `picture.hide()`; `measures.ts` is the source for generators, validator and `describeVisual`; `types.ts` comment updated; the `pictureLayout.ts` comment about `select`/`drag` is still accurate (no select or drag skill carries a drawing), left |

## 4. Next command

`/10x-e2e art-tasks-all-stages phase 10` (phase 10, Driver: e2e)

## 5. Open

- Row 9.1 e2e part and everything tagged `[reviewer]` 9.5, `[visual]` 9.6, `[human]` 9.7-9.9 (9.7 now also covers: E3.11 no longer reads negative temperatures, the letter of ZADANIA says -30..+30 for E3).
- Earlier open: 6.3 (tall-layout break, phase 10), 7.6, 7.7, 1.5, 2.8, 2.9 `[human]`, 3.5, 4.5, 5.7, 5.8, 5.9, 6.6, 6.7, 8.7-8.9.
- The e2e hook `art` seam is NOT in `src/testing/e2eHook.ts` yet (CLAUDE.md does not claim it); phase 10 adds it with the marker in `vite/e2eHookGuard.mjs`.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. E3.11 `temperature_read_30` changed to `low: 0` (orchestrator fix 1), against the letter of ZADANIA (E3 "-30..+30 °C"): negative temperatures belong to E6.1. Rejected: keeping -30 and only filtering distractors (a negative answer would still appear in tiles and the hint "Poniżej zera"). The id keeps its name (`_30` is the top of the scale; mastery keyed by id, the skill is new in this slice). The thermometer frame still draws marks below zero (gap 64, follow-up). Would change: the maintainer wants negative readings in grade 3.
2. `textChoices` got the range and `c ± 3·step` candidates so that 0 °C in 0..30 still gets four tiles.
3. E5.5 `capacity_quarter_l`: kept as is. The orchestrator's premise (only 1 l and ½ l jugs drawn) does not hold: the params list all three jugs and the sample shows rows like `2 × ½ l, 8 × ¼ l` and `2 × 1 l, 4 × ¼ l`; `tests/capacity.test.ts` already requires more than 100 of 1000 draws with ¼ l jugs. No rename. Would change: a teacher read finding the ¼ l rows too rare.
4. Hint wording: E4.7 "Dwa takie dzbanki to razem jeden litr." (and "Cztery takie ..."), consistent with E5.5 "Dwa dzbanki po pół litra to razem litr."; E6.1 last hint says what happened (warmer or colder) with the numeral agreeing.
5. Design-gap rows 59-66 numbered after row 58; each carries a `DESIGN-GAP n` comment at the top of its file (widgets, `money.ts`, `pictureLayout.ts`).
6. Profile § 10: the absent-paths row set to "none"; no other path needs asserting. `.env` has no copy of the list.
7. 9.1 left unticked only for its e2e part; e2e is the orchestrator's (see §3).
