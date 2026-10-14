# Handoff — `number-line-written-arrows` (slice S-14b)

Written by the `/10x-research` step: `research.md` answers the change's unknowns (new `digits` answer mode, WRITTEN,
ARROW_TABLE, number line as drawing and as ADD_SUB hint picture, unlock thresholds, S-15 rounds). No code yet. The
next agent must not miss two traps: an ADD_SUB task with a new `hintVisual` field still passes the word minigame's
`drawTask` filter (it checks `task.visual` only), and no consumer of the answer mode is exhaustive, so `digits`
falls silently into tiles/keypad branches unless every consumer gets an explicit branch.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, cut from `main` at `882cd93` (after S-15) |
| Commits | 2 on top of `882cd93`: `docs(number-line-written-arrows): change identity (autonomous run)`, `docs(number-line-written-arrows): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/number-line-written-arrows/research.md` | Research: Summary 1–9, findings A–F (answer-mode chain, WRITTEN, ARROW_TABLE, number line + hint picture, design/copy, unlock/save), code references, historical context, open questions with recommendations |
| `context/changes/number-line-written-arrows/change.md` | Frontmatter only: `status: new → preparing`, `updated` 2026-10-14 (body untouched) |
| `context/changes/number-line-written-arrows/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/number-line-written-arrows` (observed) |
| Decisive anchors re-read in the main context | `isCorrect` (`src/core/round.ts`), `MistakeExample` (`src/core/types.ts`), `TASK_LAYOUT.picture`/`.keypad` (`src/data/layout.ts`), E3.9 skills (`src/data/curriculum/E3.ts`), `unlockThreshold` + `balance.curriculum.unlockShare`, `drawTask` (`src/core/minigames/word.ts`), `addSubHint`, `firstHint`, `skill`/`addSub` helpers in `E1.ts`–`E6.ts`, `capacityHalfFact`/`capacityQuarterAlso` (`src/data/pl.ts`) — all observed |
| `metadata-guard.mjs inspect` / `mark-researched` | `changed: true` |
| Gate (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed; baseline on main inherited from the contract (`882cd93`: unit 2326, e2e 71), unverified here |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-plan number-line-written-arrows`

## 5. Open

- Corrections to `change.md` the plan must carry: E3.9 has **4** skills (`mult_30`, `mult_groups_result`,
  `mult_groups_expr`, `word_groups_30`), so +1 jumps skill moves its threshold 2 → 3 (not 1 → 2). Thresholds with the
  recommended skills: E2.6 1 → 2 (3 skills), E5.2 1 → 2 (4), E6.7 1 → 2 (3), E2.7 unchanged; they take effect when
  `src/core/round/pick.ts` `playable` admits the mode/generator. Save stays v2.
- Open choices (research § Open Questions): E5.2 carry allowed vs no-carry; MULT_GROUPS jumps answer (expression
  tiles recommended); hint-picture rectangles in `TASK_LAYOUT`; borrowing notation; `Keypad` raw-key callback.
- Word round: `src/core/minigames/word.ts` `drawTask` must drop the new hint-picture field (or the plan lays it out).
- Leak rule for every number line (answer tick never labelled) needs a validator rule in `src/core/tasks/visual.ts`
  `validateVisual` and an invariant in `tests/contentInvariants.test.ts`.
- DESIGN-GAPs to add from row 88 in `docs/design-gaps.md` (digit boxes/active box, borrowing, arrow graph/table,
  line in hint phase, 0–100 line with boxed tick, k > 1 jumps) — not yet written.
- Follow-ups to move at archive: E1.10 `place_read_12` → `Trigger: S-14d`, E5.5 `capacity_half_l_e5` →
  `Trigger: S-14c`, `ArtPool`/S14-09/S14-10 → `Trigger: the next widget built on ArtImage`; new one for WRITTEN
  "missing digits". O5 (`LONG_KEYPAD_HINTS`, `capacityHalfFact`/`capacityQuarterAlso`) is in scope.
- `CLAUDE.md` still says save v1 in the S-11 paragraph (code is v2) — stale doc, not this slice's scope unless the
  plan touches CLAUDE.md anyway.

## 6. Autonomous decisions

1. **Research question derived from `change.md`, no interview** (the skill's clarification step). Rejected: asking.
   Why: the step prompt and contract forbid `AskUserQuestion`; change.md defines the scope. Would change: nothing in
   this run.
2. **Three parallel workers (sonnet) by area, decisive anchors re-read locally.** Rejected: one sequential pass.
   Why: the skill defaults to delegation for multi-area research. Would change: a worker contradicted by the source
   (one was: ADD_SUB/SEQUENCE answer mode in E2/E3 is `keypad`, corrected in research.md).
3. **Recommend `digits` as a new `AnswerMode` submitting a number** (keeps change.md decision 2). Rejected: an array
   answer (not captured by `captureFirstWrong`, compared as an unordered set by `isCorrect`, would push a save
   change); a focused `keypad`. Would change: a teacher read requiring the carry digit to be typed into its own box
   (still a number answer, more boxes).
4. **Box count = columns of the wider operand, result constrained to that digit count.** Rejected: boxes = answer
   length (leaks a carry into a new column). Would change: the plan allowing results like 100 in E5 with an extra,
   always-present box.
5. **ARROW_TABLE stays `keypad` with one blank** (keeps change.md decision 7). Would change: a multi-number reducer
   becoming available.
6. **Hint picture as `Task.hintVisual {hint, solution}` with jumps from `addSubHint`, landing never labelled.**
   Rejected: putting the line into `task.visual` (word-round filter, pre-first-try hint). Would change: the visual gate
   finding no room under the expression beside the keypad.
7. **School-method description (carry above the next column; borrowing by crossing out) given from general domain
   knowledge, flagged for the teacher read**, because `docs/zrodla/` may not be read and ZADANIA only says "przeniesienie
   zaznaczane małą cyfrą". Would change: the teacher read or the author describing a different notation.
8. **Commit message**: the proposed `docs(number-line-written-arrows): research` (contract rule 1).
