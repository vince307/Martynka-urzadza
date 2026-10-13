# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 5 step (`/10x-tdd` phase 5, autonomous run 2026-10-12-s04-s08). Phase 5 added the pure `progressView` (current step "krok N z M" over playable steps, 3 weakest skills of the current stage with mistake examples, empty state) and exported `currentStep`, test-first. Phases 1-5 of 11 are committed; e2e for 6238cb6 is the orchestrator's gate (Chromium not launchable here; the orchestrator ran 15/15 on b34c1ee).

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2`, `965c602`, `d355ca0`, `33a40d3`, `d72768a` (p1), `6616124`, `7087b16` (p2), `8f53d98` (p3), `b34c1ee` (p4), `6238cb6` (p5), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 36 (phases 1-5 fully ticked) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/progress.ts` | `progressView(stage, adaptation, { mastery: { max }, view: { weakestCount, examplesPerSkill } }): ProgressView` = `{ step: { index, total, title }, weakest: { skillId, title, mastery, max, examples[{prompt, given, answer}] }[] }`; examples formatted (`formatNumber`, array joined by ", ", `\n` to space) |
| `src/core/curriculum.ts` | `currentStepOf` replaced by exported `currentStep(stage, unlockedStep)`; `skillBuckets` and `unlockReady` use it |
| `tests/progress.test.ts` | 23 tests on hand-built E3 histories |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| RED (stub returning step 0/0 and `weakest: []`) | `AssertionError: expected [] to deeply equal [ 'E3.1.word_20' ]`, `expected +0 to be 1`, `expected { index: +0, total: +0, title: '' } to deeply equal { index: 8, total: 8, ... }`; 19 red, then green |
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 947 passed (branch baseline 924, +23); existing tests unedited |
| `npm run build` | OK, `e2e hook: absent` |
| Deliberate break | candidate filter `!h.ok` instead of `!h.firstTry`: "a second-try answer is a first-try miss" red; candidates also taken from other stages: "ignores history of another stage" red; both restored |
| Meta-check | oracles are FR-015 / decision 5 (current stage only, first-try miss, mastery asc, misses desc, newer first, program order), written by hand; the 5-candidate test cuts to 3 |
| `grep -n "const currentStepOf" src/core/curriculum.ts` | empty |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate` (`npx playwright test` died with MachPortRendezvous Permission denied, 10 did not run) |

## 4. Next command

/10x-implement parent-settings-progress phase 6

## 5. Open

- Phase 4 full-gate row 4.3 and phase 5 row 5.4 are open only for e2e (orchestrator run on the p5 commit; the phase 4 one is covered by the 15/15 on b34c1ee, cite run-log).
- `progressView` is not yet called by any scene; UIScene computes it in phase 8 from the learner in the registry. Examples are shown as stored (prompt only newlines normalised).
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e). Row 8.5: "Zatwierdź"/"Anuluj" visible without scrolling at 1024x768.
- DESIGN-GAPs 25-28 and follow-ups as planned for phase 9 (including the S-12 export privacy note).
- Every `Trigger: S-08` follow-up is in scope (list in reviews/plan-review.md Grounding).

## 6. Autonomous decisions

1. `currentStep` takes `(stage, unlockedStep)` as the plan's intent says (the old private helper took the step list); it throws `RangeError` for a stage with no playable steps, like `skillBuckets` did, so the duplicate check there was removed.
2. "Newer miss" = the latest `at` among the skill's first-try misses; examples are ordered by `at` descending, ties by history position (later first).
3. `weakest[i].title` is the step title of the skill (decision 4); two skills of one step share a title.
4. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
