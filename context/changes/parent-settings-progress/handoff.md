# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 4 step (`/10x-tdd` phase 4, autonomous run 2026-10-12-s04-s08). Phase 4 added `RoundState.firstWrong`, `roundResults` and the optional mistake example on history entries, test-first. Phases 1-4 of 11 are committed; e2e for b34c1ee is the orchestrator's gate (Chromium not launchable here). Star rules and mastery rules are unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2`, `965c602`, `d355ca0`, `33a40d3`, `d72768a` (p1), `6616124`, `7087b16` (p2), `8f53d98` (p3), `b34c1ee` (p4), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 40 (phases 1-4 fully ticked) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `MistakeExample { prompt, given, answer }`; `LearnerState.history` entry gets optional `example` |
| `src/core/round.ts` | `RoundState.firstWrong` (null per task, set only in `first` on a wrong number/string); `roundResults(state): SkillResult[]` (example only for `second`/`retype` with a captured value) |
| `src/core/mastery.ts` | `SkillResult.example?`; `recordRound` copies it only when `outcome !== 'first'`; history cap unchanged (200) |
| `src/scenes/TaskScene.ts` | `finishRound` uses `roundResults(this.state)` instead of its inline map (mapping moved to core) |
| `tests/round.test.ts`, `tests/mastery.test.ts` | +10 and +4 tests |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| RED (stub `roundResults` returning `[]`, no `firstWrong`) | `AssertionError: expected undefined to deeply equal [ null, null, null, null, null ]`, `expected [] to have a length of 5`, mastery example `expected [ ...(2) ] to deeply equal [ ...(2) ]`; 11 red, then green |
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 59 files, 924 passed (branch baseline 910, +14); existing tests unedited |
| `npm run build` | OK, `e2e hook: absent` |
| `grep -rn "console\." src` | no hits (privacy: examples stay in memory) |
| Deliberate break | `firstWrong` overwritten in the `second` branch + `recordRound` storing the example for `first`: 2 tests red (second wrong does not overwrite; first-try entry has no example); restored |
| Meta-check | oracles are plan decision 3 (example = first try, only on a first-try miss); the round test uses real generator tasks |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate` (`npx playwright test` died with MachPortRendezvous Permission denied); orchestrator ran 15/15 on 8f53d98 |

## 4. Next command

/10x-tdd parent-settings-progress phase 5

## 5. Open

- Phase 4 full-gate row 4.3 is open only for e2e (orchestrator run on b34c1ee).
- The example is not yet persisted or shown: it lives in `learner.history` in the registry (memory only) until phases 5 and 8; the e2e hook `snapshot` exposes `learner` only in the e2e build (phase 6 checks this).
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e). Row 8.5: "Zatwierdź"/"Anuluj" visible without scrolling at 1024x768.
- DESIGN-GAPs 25-28 and follow-ups as planned for phase 9 (including the S-12 export privacy note: the export will contain the child's prompts and answers).
- Every `Trigger: S-08` follow-up is in scope (list in reviews/plan-review.md Grounding).

## 6. Autonomous decisions

1. The scene's inline outcome mapping in `TaskScene.finishRound` was replaced by `roundResults` (plan phase 4 says the mapping moves to core); a one-line scene change done inline in this tdd phase.
2. `firstWrong` ignores non-number/non-string input (arrays from multi-answer tasks), per the plan's wording; such tasks get no example.
3. `recordRound` guards `outcome !== 'first'` itself (defence in depth), so a first-try entry never carries an example.
4. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
