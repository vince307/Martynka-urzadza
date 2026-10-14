# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 6 (impl) is committed (`ef09a12`): the hint number line of ADD_SUB tasks shows in `TaskScene` after a first miss; six skills opted in. Full e2e was run in this session with `--workers=4`: 71 passed (5.0 min). Phase 5's open e2e rows (5.1, 5.5) are ticked citing the orchestrator note (71 passed on `99cc307`).

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` + p2 `f852b48` + p3 `a7e3025` + p4 `88f71d7` + p5 `99cc307` + p6 `ef09a12` + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.4, 5.1-5.5 (5.1/5.5 via orchestrator note), 6.1-6.4 ticked; open: 1.5, 2.5, 3.5, 4.5, 5.6 [reviewer]; 5.7, 6.6 [visual]; 6.5 [reviewer] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/TaskScene.ts` | second `TaskPicture` (`hintPicture`) renders `view.hintPicture` in `hintPictureLayout(...).picture`; solution lines use `.lines` when there is a hint drawing and no `visual`; hidden with the task layer; snapshot `hintVisual` (kind or null), targets `hintPicture` (rect or null) |
| `src/data/curriculum/E2.ts`, `E3.ts` | `line: true` on E2.1 `add_sub_20_units`, E2.3 `add_bridge_20`, E2.5 `sub_bridge_20`, E3.2 `add_sub_20_bridge`, E3.6 `add_sub_30_nobridge`, E3.8 `add_sub_30_bridge` |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit `npm test` | baseline 2415 + 0 = 2415 passed (existing contentInvariants/hintVisual tests already cover the new data; no new unit tests); deploy and ops tests OK |
| sample E1-E6 | all exit 0; teacher read below |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| deliberate break | `max: 30 -> 100` on E3.6 with `line: true`: `tests/contentInvariants.test.ts` red (`ADD_SUB params.line must be true and needs max <= 30, got line true max 100`); restored. Meta-check: the red is the parser rule, which is what protects the opt-in |
| e2e | `npx playwright test --config=... --workers=4`: 71 passed (baseline 71 + 0). Specs that now meet the hint picture and stayed green: `task-round` (wrong-answer paths use tiles in E1; E2/E3 keypad wrong answers elsewhere), `adaptive`, `first-launch` (E3 warm-up with mistakes), `narrator` (wrong answer reads retry prompt), `parent-settings` (progress view miss), `minigames`, `daily-puzzle`. None needed an update. No e2e asserts the new picture yet (phase 11) |

## 4. Next command

`/10x-implement number-line-written-arrows phase 7` (Driver: impl)

## 5. Open

- Rows 1.5, 2.5, 3.5, 4.5, 5.6, 6.5 [reviewer]; 5.7, 6.6 [visual] (hint line geometry `TASK_LAYOUT.picture.hint.keypad` is provisional: picture 768x190 at y 530, lines at y 730; the visual gate decides; DESIGN-GAP row due in phase 9).
- Teacher read (`npm run sample -- E2 --count 6`, `E3 --count 6`): every one of the six skills prints a `hint visual:` line that matches the hint lines (jumps to the ten, then the rest; box on the result, labels never include the result). Single-jump tasks (e.g. 25 + 2, 30 - 8) have a one-line hint that states the result, as before the change. Observation: E2.1 "10 - 2" draws the axis 0-10, others 10-20; "18 - 16" jumps 18>8, 8>2 (tens first), consistent with the written hint. No new nouns, no text changed.
- Unlock thresholds: no skills were added, so none changed.

## 6. Autonomous decisions

1. Executed in this context, no subagent; commit message proposed as drafted: `feat(number-line-written-arrows): Oś-podpowiedź w TaskScene, dane ADD_SUB ≤ 30 (p6)`.
2. A second `TaskPicture` instance for the hint instead of re-using the task's one, so a task with its own drawing never loses it; the hint picture is drawn only when `view.visual` is null (validator already limits hint drawings to keypad tasks).
3. Ran e2e myself (Chromium started with the plain command); also ticked 5.1/5.5 per the orchestrator note.
