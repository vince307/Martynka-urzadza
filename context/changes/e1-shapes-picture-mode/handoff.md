# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-implement` phase 4 of run `2026-10-15-fix-s14c-s14d`. Phase 4 is committed and green except e2e (not runnable here). COMPARE_QTY, ORDINAL and picture CHOOSE_OP are now in the curriculum (E1.1, E1.2, E1.3) and drawn: `IconRow` (row with a flag) and the motion arrow in `IconGroups`.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phase 1 `a230f1a`, phase 2 `b9b16d5`, phase 3 `670e988`, phase 4 code `c6c6600`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress | rows 4.1-4.4 ticked with the phase 4 sha; 3.4 ticked citing the orchestrator note (86 passed on `670e988`); 4.5 e2e (orchestrator), 4.6 `[reviewer]`, 4.7 `[visual]`, 3.5, 1.5, 2.7 `[reviewer]`, 2.8 `[visual]` open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/IconRow.ts` (new) | row of different icons, gold flag on a teal pole on the left; pooled `ArtImage`s (`ART_LIMITS.rowIcons`) |
| `src/ui/widgets/IconGroups.ts` | optional `motion`: a 120 px strip left of the stacked groups; `come` solid arrow up to the first group, `go` dashed arrow down away (shape, not colour) |
| `src/ui/widgets/artLayout.ts` | `rowLayout` (pure); `src/data/layout.ts` `TASK_LAYOUT.iconRow`, `iconMotion` |
| `src/ui/widgets/TaskPicture.ts` | `row` case draws (the phase 3 throw is gone); `visualShape` of a `row` is `long` (notebook's full width) |
| `src/data/curriculum/E1.ts` | E1.1 `compare_qty_10` (max 10, more/less, equalShare 0.25), E1.2 `ordinal_5`, `count_5` `min: 2` (O4), E1.3 `choose_op_picture_5` |
| `docs/design-gaps.md` | row 102 (row with flag, motion arrow) |
| tests | `tests/curriculum.test.ts` (COMPARE_QTY, ORDINAL to `GROUP_1`), `tests/count.test.ts` (E1.2.count_5 data skill never draws one icon; the 1..5 tiles test uses its own min-1 skill), `tests/artLayout.test.ts` (`rowLayout`), `tests/visual.test.ts` (row shape `long`) |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2756 passed (branch baseline 2740, +16); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` x6; E1 shows compare_qty_10, ordinal_5, choose_op_picture_5 and count_5 never 1 icon |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium MachPortRendezvous Permission denied, plain `--workers=4`); expected 86 + 0. Phase 3 row 3.4 ticked from the orchestrator note (86 passed on `670e988`, 5.7 min) |
| Break | `E1.2.count_5` back to `min: 1` -> `tests/count.test.ts` `E1.2.count_5 (S-14d O4)`: `AssertionError: expected 1 to be 2`; restored. Meta-check: the same test also asserts `visual.groups` totals >= 2 per draw, so it reads the drawing, not only the param |
| Thresholds | no test pinned the E1.2/E1.3 skill counts (E1.2 now 3, E1.3 now 5 skills; unlock `ceil(0.5 n)` = 2 and 3); the whole suite stayed green after the data change |
| Teacher read (`sample -- E1 --count 6`, E1.1-E1.3) | COMPARE_QTY: "Gdzie jest więcej kłębków/lamp?", genitive plural right, "Tyle samo" for 1+1, hints count then name the tile. ORDINAL: "Na którym miejscu od lewej jest kwiatek?", first hints give no place. CHOOSE_OP picture: "Na stole były 2 poduszki. Dołożono 1." / "Zabrano 1.", three distinct operations, hint "Przybyło, więc dodajemy." first. Word CHOOSE_OP stories: no "złotych" in purchases. No defect found |

E2E specs that may now draw the new tasks: only those that play an E1 round without forcing skills, i.e. via `passWelcomeAsParent`/child path on E1: `tests/e2e/first-launch.spec.ts`, `tests/e2e/minigames.spec.ts`, and `parent-settings.spec.ts` where it starts on E1 without `?e2eSkills`. `passWelcome` starts on E3, so `task-round`, `narrator`, `room-*`, `save-*` cannot draw them. `answerRight` taps the tile whose value equals `state.answer` (string tiles for COMPARE_QTY and CHOOSE_OP, number tiles for ORDINAL), which already works for these.

## 4. Next command

`/10x-tdd e1-shapes-picture-mode phase 5` (Phase 5, `Driver: tdd`)

## 5. Open

- 4.5 e2e: orchestrator runs `npx playwright test --workers=4` (expect 86 passed); 4.6 `[reviewer]`, 4.7 `[visual]` (1440x900 and 1024x768: COMPARE_QTY first try and "tyle samo", ORDINAL with hint, CHOOSE_OP `come` and `go`, COUNT E1.2); the earlier manual rows 1.5, 2.7, 2.8, 3.5 stay open.
- Visual risk to check first: the motion arrow strip (120 px) shrinks the icon area; ordinal row of 10 icons only possible with `max: 10` (the data uses 5).
- Phase 5 (round filter for picture mode) now has picture-heavy E1 steps to filter.

## 6. Autonomous decisions

1. Phase run in this context, no subagent; commit message and next-phase prompts decided in place, stopped after phase 4.
2. The row uses shape `long` (full notebook width) rather than `wide`; the phase 3 test line that expected `wide` was updated to `long`. Would change: the visual gate shows the row too small.
3. Motion arrow lives in the strip left of the groups: `come` solid up, `go` dashed down. Rejected: arrow between groups (they are stacked with little room). Would change: the visual gate.
4. E1.1 compare_qty uses `equalShare 0.25`, `max 10`; E1.3 picture skill `max 5` (parser limit 10).
5. `tests/count.test.ts` "ends" test got its own min-1 skill because the data skill no longer draws 1.
