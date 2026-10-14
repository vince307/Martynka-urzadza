# Handoff — `number-line-written-arrows` (slice S-14b)

Written by the `/10x-plan` step: `plan.md` (11 phases, `## Progress` 62 rows) and `plan-brief.md` exist; no code yet. The
next agent must not miss the ordering rule: `digits` enters the `AnswerMode` union in phase 1 but `playable` admits it only
in phase 8, together with the e2e helpers, and every mode consumer becomes a `switch` with a `never` branch (core in
phase 1, `TaskScene`/`FeedbackBar` in phase 7, `tests/e2e/support/hook.ts` in phase 8).

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, cut from `main` at `882cd93` (after S-15) |
| Commits | 3 on top of `882cd93`: change identity, research, `docs(number-line-written-arrows): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 62 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the five files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/number-line-written-arrows/plan.md` | Implementation plan: phases 1–4 tdd (mode guard + `digitBoxes` reducer; `column`/`numberLine` + WRITTEN; `arrows` + ARROW_TABLE + SEQUENCE line + MULT_GROUPS `jumps`; `Task.hintVisual` for ADD_SUB), 5–9 impl (`NumberLine`+`ArrowGraph` with E2.6/E2.7/E3.9 data; hint line in `TaskScene` with six ADD_SUB skills; `WrittenColumn` + `Keypad.onKey` + scene `digits` branch; e2e helpers + `playable` admits `digits` + WRITTEN data + O5; seam sweep), 10–11 e2e (#11 `written-column.spec.ts`, `number-line.spec.ts`); unlock-threshold table; `## Autonomous decisions` 1–12 |
| `context/changes/number-line-written-arrows/plan-brief.md` | Two-page brief |
| `context/changes/number-line-written-arrows/change.md` | Frontmatter `status: planned` (body untouched) |
| `context/foundation/roadmap.md` | S-14b status `proposed` → `planning` (At a glance row and item body) |
| `context/changes/number-line-written-arrows/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/number-line-written-arrows` (observed) |
| Plan structure check (python over `plan.md`) | 11 phases, each with `Driver:` + `Driver why:` as the first lines; Success Criteria ↔ Progress rows 1:1 (5,5,5,5,7,6,5,8,6,5,5) |
| Anchors re-read in this step | `playable` (`src/core/round/pick.ts`), `canonicalInput`, `pictureLayout`/`answerSpans`, `roundView`, `ARITHMETIC_LINE`/`KEYPAD_HINT_MAX`/`LONG_KEYPAD_HINTS` (`tests/contentInvariants.test.ts`), `tests/solvableInMode.test.ts` (iterates all skills with a generator, not only playable), `TASK_LAYOUT.picture`, `E2E_HOOK_MARKERS`, `ROUND_SPEC`, E2.6/E2.7/E3.9/E5.2/E6.7 skills — observed |
| `metadata-guard.mjs inspect` / `mark-planned` | `changed: true` |
| Gate (lint, typecheck, unit, build, e2e) | not run — docs-only step; baseline on main inherited from the contract (`882cd93`: unit 2326, e2e 71), unverified here |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan-review number-line-written-arrows`

## 5. Open

- `[human]` rows (post-run checklist): **8.8** carry/borrow notation in the column comes from general knowledge, not a repo
  source (`columnMarks` in `src/core/tasks/written.ts`, widget `WrittenColumn`); **9.6** decisions against ZADANIA/PRD literal
  text (ARROW_TABLE without "·3"/chain, WRITTEN without "missing digits", carry drawn by the game, hint line without E1 and
  > 30, SEQUENCE line only in E2.7, E5.2 with carry) and higher unlock thresholds on live saves (E2.6 1→2, E3.9 2→3, E5.2 1→2,
  E6.7 1→2).
- `[visual]` rows 5.7, 6.6, 8.7 (1440×900 and 1024×768); `[reviewer]` teacher reads 2.5, 3.5, 5.6, 6.5, 8.6.
- Provisional layout numbers to confirm at the visual gate: `TASK_LAYOUT.picture.digits` (column 440 × 508 + lines beside),
  `TASK_LAYOUT.picture.hint.keypad` (line 768 × 190 under the expression, lines 768 × 118).
- Phase 6 must check existing e2e specs playing E3 rounds with a miss (`task-round`, `adaptive`, `narrator`) — the hook keeps
  `targets.picture` for `task.visual` and adds `targets.hintPicture`.
- DESIGN-GAP rows from 88 (`docs/design-gaps.md`) added by phases 1, 5, 6, 7; swept in phase 9.
- Follow-ups (phase 9, `context/changes/number-line-written-arrows/follow-ups/review-fixes.md`): WRITTEN "missing digits" →
  `S-14c or the next change to WRITTEN`; ARROW_TABLE ·n/chain/multi-blank → `S-14c or a multi-number reducer`; E1/tiles hint
  line and > 30 → `S-14d (E1 picture mode) or a layout band above the tiles`; `place_read_12` → `S-14d`; `capacity_half_l_e5` →
  `S-14c`; `ArtPool`/S14-09/S14-10 → `the next widget built on ArtImage`; O6/O2 kept for other drawings.

## 6. Autonomous decisions

1. **No `AskUserQuestion`; complexity HIGH, every open question answered from research/change.md** (contract rule 1). Rejected:
   asking. Would change: nothing in this run.
2. **`digits` mode with a number answer, boxes = columns of the wider operand, result constrained** (research Summary 1, 3).
   Rejected: array answer, focused `keypad`, boxes = answer length. Would change: a teacher read requiring 100 as an E5 result.
3. **Exhaustiveness guard = `ANSWER_MODES` + `never` switches in core/UI/e2e helpers + `tests/answerModes.test.ts`** (step
   prompt). Rejected: a test over modes alone (cannot see scene branches). Would change: nothing.
4. **Single `Task.hintVisual` drawing (not a hint/solution pair), landing never labelled; only keypad ADD_SUB ≤ 30 (no E1).**
   Rejected: research's `{hint, solution}` pair (identical once the landing stays unlabelled); E1 tiles (no free band between
   `expressionWide` and the tiles). Would change: S-14d E1 picture mode or a screenshot showing room above the tiles.
5. **Carry/borrow drawn by the game; E5.2 carry allowed, E6.7 required; ARROW_TABLE one blank, `+`/`−`, ≤ 20; MULT_GROUPS `jumps`
   answered by expression tiles** (research recommendations). Against ZADANIA literal text → `[human]` 9.6; notation →
   `[human]` 8.8. Would change: the teacher read or the author.
6. **11 phases** from the ≤ 2-new-UI-components rule (`NumberLine`+`ArrowGraph`, hint line reuses `NumberLine`, `WrittenColumn`
   alone with the keypad/scene work); `playable` flip isolated in phase 8 with the helpers. Would change: a phase over budget →
   split phase 8 (data vs helpers) keeping helpers ≤ `playable`.
7. **Plan language Polish with English identifiers**, like the archived S-13b plan (format example). Would change: nothing.
8. **Roadmap status edit committed with the plan** (step prompt), and `plan-brief.md` written (skill Step 4.5).
9. **Commit message**: `docs(number-line-written-arrows): plan` (step prompt).
