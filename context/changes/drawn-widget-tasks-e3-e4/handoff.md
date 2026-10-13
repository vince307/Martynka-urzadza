# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-implement` phase 7 (commit 8f73f98): the `select` mode (E1.6, E3.7) is playable, e2e helpers answer it, the `?e2eSkills` seam exists in the hook build only.
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + p5 `9b7da6e` + p6 `7824b24` + p7 `8f73f98` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4 [reviewer]; 4.4 [visual], 4.5 [reviewer], 4.6 [human]; 5.3 [reviewer]; 6.7 [reviewer], 6.8 [visual], 6.9 [human]; 7.1 and 7.2 (e2e part, orchestrator), 7.5 [reviewer], 7.6 [visual]; phases 8-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/select.ts`, `tests/select.test.ts` | `toggleSelected(selected, value, choices)` (result in tile order; the plan's two-argument signature got `choices` for that), `selectionAnswer`; tests also cover `taskKey` |
| `src/core/round/unique.ts` | exported `taskKey`: prompt + drawing, plus the tiles for `select` tasks (all select tasks share one prompt, so the old key made rounds with two of them "duplicates" and broke the uniqueness tests); `curriculumPick`/`warmup` tests use it |
| `src/ui/widgets/SelectTiles.ts`, `src/data/layout.ts` (`TASK_LAYOUT.select`, `PLACEHOLDER_COLORS.selected/selectedBorder`) | six 200 px tiles at y 600, check mark drawn in code, "OK" is an `ActionButton` (`pl.round.okKey`) at y 800; solution lines stop above the row; `FeedbackBar.update` takes `'select'` |
| `src/scenes/TaskScene.ts` | `select` branch in `render`/`hideTaskLayer`/`drawPrompt`/`answerSpot` (star flies from OK), cleared after a wrong set; `throw` stays for `drag` only; snapshot `selected`, `choices` for select; targets `selectTiles`, `selectOk`; forced round in `freshRound` under `if (__E2E_HOOK__)` |
| `src/testing/e2eHook.ts`, `src/main.ts`, `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts`, `tests/e2eSkills.test.ts` | `e2eSkills(search)`, `forcedSkills(stage, ids, length)` (null unless every id is a playable skill of the stage), marker `e2eSkills`, registry key `REGISTRY_KEYS.forcedSkills = 'forcedSkills'` |
| `src/core/round/pick.ts`, `tests/pick.test.ts`, oracles in `tests/warmup.test.ts`, `tests/curriculumPick.test.ts` | `playable` accepts `select`; pick test now "never returns drag" + E1.6/E3.7 are in the pool |
| `tests/e2e/support/hook.ts`, `tests/e2e/parent-settings.spec.ts` | `Snapshot.selected`, `Targets.selectTiles/selectOk`; `answerRight`/`answerWrong` for `select` (wrong = one marked tile outside the answer set, any tile order; return type widened); the parent-settings spec answers a `select` first task right instead of missing it (a set has no example in the preview, core keeps only number/string as `given`) |
| `docs/design-gaps.md` | row 54 (multi-select screen, revision of row 7) |
| `context/changes/drawn-widget-tasks-e3-e4/e2e-request-p7.md` | commands for the orchestrator |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1427 passed (branch baseline 1412, +15) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)`; `grep -rl e2eSkills dist` empty; E2E_HOOK build `present`, marker in `dist-e2e` (ignored dir) (observed); deploy tests OK |
| `npm run sample -- E1..E6` | 0 violations each (observed) |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium: MachPortRendezvousServer Permission denied, 3 plain tries); 7.1/7.2 e2e part left unticked; see `e2e-request-p7.md` (expected 37 + 0, plus a one-off `task-round` with `e2eSkills: 'E3.7.select_even_30'`) |
| Deliberate break 1 | `toggleSelected` only adds -> `tests/select.test.ts` "unmarks a marked tile" red (`expected [ 20, 8 ] to deeply equal [ 8 ]`); restored |
| Deliberate break 2 | unguarded `e2eSkills(window.location.search)` in `main.ts` -> `npm run build` fails "e2e hook leaked into the production bundle (e2eSkills in ...)"; restored. Meta-check of the key name: renaming the registry key value to `'e2eSkills'` did NOT leak either (the key is used only inside `__E2E_HOOK__` branches, terser drops it), so the distinct name `forcedSkills` is defence in depth, not what keeps the guard honest; the guard test `lists every marker` and the `it.each` over markers pin the list |
| Teacher read | `npm run sample -- E1 --count 6` (E1.6) and `-- E3 --count 6` (E3.7): prompt "Zaznacz wszystkie liczby parzyste.", hint "Liczby parzyste kończą się na 0, 2, 4, 6 albo 8." states the rule, not the set; 2-4 even among six distinct tiles, odd distractors; no text changed in this phase. `answerWrong` marks one non-answer tile and OK, independent of tile order |

## 4. Next command

`/10x-tdd drawn-widget-tasks-e3-e4 phase 8`

## 5. Open

- [reviewer] 7.5 (teacher read recorded above); [visual] 7.6 and 4.4, 6.8 need screenshots (select before/two marked/after a wrong set/in solution steps/retype, 1440x900 and 1024x768; the OK button at y 800 sits 16 px above the bar - check it); [human] 4.6, 6.9; rows 1.5, 2.5, 3.4, 4.5, 5.3, 6.7 [reviewer].
- Orchestrator: e2e for 7.1/7.2 (`e2e-request-p7.md`).
- `TaskScene.render` still throws for `drag` (removed in phase 9); `playable` still excludes it.
- ARTIFACT GAP: none. DESIGN-GAP 54 added.

## 6. Autonomous decisions

1. `toggleSelected` takes `choices` as a third argument so the result is in tile order (plan listed two arguments). Rejected: keeping tap order and sorting at the call site (the widget would then repaint from an order that differs from the tiles).
2. New `taskKey` in `unique.ts` includes the tiles only for `select` tasks. Rejected: including `choices` for all modes (random distractors would make equal prompts "different"); changing the test keys only (the round builder would still keep duplicate select tasks).
3. OK button reuses `ActionButton` (bar-sized, 96 px) instead of a new keypad-like widget; layout numbers in `TASK_LAYOUT.select` (tiles 200 px wide so six fit the 1560 px notebook; the 254 px single-answer width would not).
4. A first task of mode `select` in `parent-settings.spec.ts` is answered right (not missed) because core keeps no example for a set; this keeps the spec deterministic. Reverses if `MistakeExample.given` ever accepts arrays (needs a save version).
5. 7.1 and 7.2 left open for the e2e part; 7.3 and 7.4 ticked from observed output. The break named in the plan (marker removed + registry key named `e2eSkills`) was run as the build leak test above because the plan's premise (a leak) does not occur; recorded honestly in §3.
