# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by the `/10x-research` step of run 2026-10-21-post-run-polish: `research.md` answers all four areas with
symbol anchors and scratch-script numbers. The one thing the next agent must not get wrong: F3 cannot roll buckets
first (it breaks oracle (a) of `tests/variety.test.ts`); the fix is an rng-free repair after the unchanged draw, and
the heading rule keys on the answer type (string = sign) plus the box position, not on the skill type.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | 2 on top of `ba3a7c4` (`docs(post-run-polish): change identity (autonomous run)`, this step `docs(post-run-polish): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (scratch scripts `scripts/_*_tmp.ts` deleted before committing) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/research.md` | research: heading rule (survey table, proposed `headingOf` rule, wording check, speaker options), F3 repro + repair approach with prototype numbers, N-1/H-2 inputs and pins, N-4 checks for `assertDrawable` |
| `context/changes/post-run-polish/change.md` | frontmatter only: `status: preparing`, `updated` (metadata guard) |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/post-run-polish` |
| heading survey (`node --import tsx`, 20 draws per skill of E1–E6, `isExpression(prompt)`) | 15 type·mode·shape rows; sign tasks = string answers (COMPARE_NUM, COMPARE_EXPR, MISSING_OP); fill = `□` inside (MISSING, FACT_FAMILY swap, PLACE_VALUE decompose); MISSING "… = □" separate row |
| F3 repro (every playable step × seeds 1..200 = 12 600 rounds) | 159 avoidable rounds with a type > 2 (e.g. `E2.1` seed 1, `E1.10` seed 107) |
| F3 repair prototype (same rng calls, then rng-free backtracking repair) | 0 avoidable left, 0 bucket changes, rng state identical; 2 625 rounds forced (no assignment) |
| lint / typecheck / unit / build / e2e | not run — research step (step prompt: no builds, e2e or servers); baseline inherited, unverified: unit 3710, e2e 143 |

No deliberate break (research step).

## 4. Next command

`/10x-plan post-run-polish`

## 5. Open

- Plan choices (research.md "Open Questions"): heading for "… = □" (MISSING result slot; calculate recommended) and the
  speaker form — (a) heading + spoken prompt, dropping the four `speak` questions, or (b) heading + existing question.
- Word round: the narrator says "Oblicz." while the screen shows no heading (`narrationOf` has no round kind) — plan
  decides in scope or follow-up.
- Pins to rewrite: `tests/spoken.test.ts` (`calculate` arg), `tests/artHealthLines.test.ts` (3 `background` cases),
  `tests/artHealthText.test.ts` `describe('pl.settings.artCutBackground')`, e2e `tests/e2e/load-and-tab-guard.spec.ts`
  "#15 H-1 …" (assertions and title); `tests/variety.test.ts` gets the seeded F3 red tests.
- N-4: no test ties `ART_LIMITS.trayKinds` to `TASK_LAYOUT.coinDrag.maxKinds`; plan adds the `assertDrawable` cases
  (`money.pay`, `column`) and an invariant test.
- L-8 DOM test: vitest runs without a DOM environment (`vitest.config.mts`), so it stays a follow-up.
- DESIGN-GAP: next free row **154** (fill heading), row **153** rewritten (N-1).
- Follow-ups to re-record (unchanged from the previous handoff): audit N-2, N-3, N-5, N-6; M-1/M-2/M-13/H-3/H-4;
  `modeWidgets` single switch in `TaskScene.render`; G-2/G-3/B-4/B-5; "Obrazki" `Kod:` line not muted; L-8.
- Teacher read (`npm run sample -- <stage> --count 6`, E1–E6) in the impl-review for the heading copy.

## 6. Autonomous decisions

- R-1 Research done locally, no sub-agents: the change.md survey had already located every area; the remaining
  questions needed runnable scratch scripts (survey, repro, prototype). Would change: an area found outside the named files.
- R-2 F3 recommendation: draw unchanged, then rng-free repair; rejected rolling buckets first (breaks oracle (a) and
  the per-seed shares). Would change: the maintainer accepting different buckets per seed.
- R-3 Heading rule keys on `typeof task.answer === 'string'` and `□` position; rejected a per-type list (drifts with
  new types). Would change: a future expression task with a string answer that is not a sign.
- R-4 N-4 check placement: `assertDrawable` with `TASK_LAYOUT.coinDrag.maxKinds` read from `src/data/layout.ts`
  (core already imports it in `roomHit.ts`, `drawingFit.ts`); limits stay where they are (refines change.md D-7's
  "or move to balance"). Would change: an ESLint boundary rule against it (none found).
- R-5 H-2 count via a pure helper over `bootLoad.cutByTable` (task + room + ui). Would change: nothing pre-agreed (PA-4).
