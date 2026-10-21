# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by the `/10x-new` step of run 2026-10-21-post-run-polish: the change folder exists with a verified source-claim
table, a survey of which tasks get "Oblicz", the triggered follow-ups and the maintainer's pre-agreed decisions. The one
thing the next agent must not get wrong: today the *speaker* already asks the right question for the comparison tasks
(`speak` lines) — only the screen heading is wrong — so the fix is one heading rule shared by `TaskScene` and
`spokenTask`, and N-4 must leave `npm run sample` output identical (no rng change).

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | 1 on top of `ba3a7c4` (this step: `docs(post-run-polish): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (scratch survey script removed before committing) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/change.md` | change identity: sources, save-format statement (v4, no change expected), source claim / repo now / correction table, "Oblicz" survey per type and answer mode, kit/copy/panel sections bound (profile § 6), triggered follow-ups, decisions PA-1..PA-8 and D-1..D-8 |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/post-run-polish` |
| scratch survey (a throwaway `node --import tsx` script over every skill of E1–E6, 20 draws each, `isExpression(task.prompt)` and `spokenTask`) | 13 type·mode rows get the heading; COMPARE_NUM, COMPARE_EXPR, MISSING_OP, MISSING have `speak` questions (screen ≠ speaker); script deleted, not committed |
| lint / typecheck / unit / build / e2e | not run — docs-only step (step prompt: no builds, e2e or servers); baseline on main inherited, unverified: unit 3710, e2e 143 |

No deliberate break (docs step).

## 4. Next command

`/10x-research post-run-polish`

## 5. Open

- Research must list every test/e2e that pins the changed texts: `tests/artHealthText.test.ts` (`pl.settings.artCutBackground`
  describe), `tests/e2e/load-and-tab-guard.spec.ts` "#15 H-1" (expects `artCutBackground` in the panel), narration tests of
  `spokenTask`/`narrationOf`, `tests/variety.test.ts`, any test asserting `pl.round.calculate` on screen.
- Research checks: where `faceLabel` (`src/core/tasks/faces.ts`) runs (generation vs scene); whether `src/core/tasks/visual.ts`
  may read `TASK_LAYOUT.coinDrag` (`maxKinds`, `art.dropCenters`) or the limits must move to `balance`; whether
  `columnMarks(v, 'all')` at generation is rng-free and side-effect free (it is pure today).
- DESIGN-GAP: next free row **154** (fill-the-box heading wording, D-1); row **153** to be rewritten (N-1, PA-3).
- Follow-ups to re-record in `context/changes/post-run-polish/follow-ups/review-fixes.md` (out of scope): audit N-2, N-3,
  N-5, N-6 (2026-10-20_2151); M-1/M-2/M-13/H-3/H-4 (narrator trigger fires); `modeWidgets` single switch in
  `TaskScene.render`; G-2/G-3/B-4/B-5 (`artHealth` trigger fires); "Obrazki" `Kod:` line not muted; L-8 unless the plan
  adds the DOM test.
- Teacher read (`npm run sample -- <stage> --count 6`, E1–E6) belongs in the impl-review for the heading copy.

## 6. Autonomous decisions

All recorded in `change.md` `## Autonomous decisions`:
- PA-1..PA-8: pre-agreed by the maintainer 2026-10-21 (scope.md), copied verbatim in substance.
- D-1 three heading kinds ("Oblicz" / "Wstaw znak" incl. MISSING_OP / a fill-the-box heading, candidate "Uzupełnij",
  DESIGN-GAP 154). Would change: teacher read or maintainer wording.
- D-2 one pure heading rule in `src/core/round/` for screen and speaker. Would change: a misclassified type.
- D-3 sample output: only `czyta:` lines may change; N-4 leaves it identical.
- D-4 F3 keeps one `rng.next()` per draw (shares per seed); fix inside `pickVariedSkills` only. Would change: pinned e2e on round seeds.
- D-5 N-1: delete the background line and key, rewrite gap 153 (the audit's "half the limit" alternative rejected by PA-3).
- D-6 H-2: cut = task + room + ui; font keeps its existing "Obrazki" line (it has no own section — correction), no sound cut line.
- D-7 N-4: build-time checks for `money.pay` and `column` in `generateTask`; `faceDraw` throw is a `never` guard, no runtime change.
- D-8 next step `/10x-research` rather than `/10x-plan`.
