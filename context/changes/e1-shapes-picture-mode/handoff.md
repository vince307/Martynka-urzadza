# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-implement` phase 2 of run `2026-10-15-fix-s14c-s14d`. Phase 1 (face codes, SHAPES, PATTERN, the §3a answer path) is committed and green; no curriculum data yet, so nothing is reachable in the game. Do not let Phase 2 forget the stand-ins left on purpose: `TaskPicture` throws for a `pattern` drawing until the row widget exists, and tiles still draw text, not faces.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phase 1 `a230f1a`, phase 2 code `b9b16d5`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| Progress | rows 2.1-2.5 ticked with `b9b16d5`; 2.6 (e2e, orchestrator), 2.7 `[reviewer]`, 2.8 `[visual]` open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/faceDraw.ts` | `drawShape` (moved out of `CoordGrid`, plus rectangle), `drawFace`, `starPoints` |
| `src/ui/widgets/PatternRow.ts` | row of faces with a dashed empty place; `TaskPicture` draws `pattern` with it; `visualShape('pattern')` is `long` (full-width rectangle) |
| `src/ui/widgets/AnswerTiles.ts`, `SelectTiles.ts` | a face-code value draws the figure and an empty label |
| `src/data/layout.ts` | `FACE_COLORS`, `FACE_LOOK`, `PATTERN_LOOK` |
| `src/data/curriculum/E1.ts` | E1.1 `childName` "Figury i szlaczki", skills `E1.1.shapes_pick` (tiles, name+odd), `E1.1.shapes_all` (select), `E1.1.pattern` (tiles, AB/AAB/ABB) |
| tests changed | `curriculum` (SHAPES, PATTERN to GROUP_1), `curriculumStart` (ORACLE E1 `[2,4,6,8,10,11]`, playable 1..11, hand computation in the comment), `curriculumEnd` (title), `curriculumPick` (unplayable-step case rebuilt on E1 with step 1 emptied), `contentInvariants` (face answers exempt from "last hint states the answer"), `hints` (result line compared to `faceText`) |
| `docs/design-gaps.md` | rows 100, 101 |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2720 passed (branch baseline 2708, +12: the three E1.1 skills in the per-skill content and solvability tests); deploy test scripts OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` x6; `--count 6` E1 shows E1.1 tasks |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session (Chromium: MachPortRendezvous Permission denied, 2 plain tries) - orchestrator gate; expected 86 + 0 |
| Break 1: ORACLE E1 left at `[3,4,6,8,10,11]` | `tests/curriculumStart.test.ts` red: `expected [ 2, 4, 6, 8, 10, 11 ] to deeply equal [ 3, 4, 6, 8, 10, 11 ]`; restored (the oracle is the by-hand rule D computation in the comment, not `calendarStart`) |
| Break 2: PATTERN skill removed with PATTERN in GROUP_1 | `tests/curriculum.test.ts` red: `E1.1 PATTERN: expected false to be true`; restored |
| e2e specs that may now draw an E1.1 picture-tile task | every spec that plays an unforced E1 round: `first-launch` #12 (age 6), `task-round`, `minigames` (E1 October, current step 4, E1.1 only in the 30 % "earlier" bucket), `room-purchase`, `room-change`, `save-*`. In September age 6 starts at step 2, so E1.1 is in the earlier bucket there too. `answerRight` handles face tiles: tiles mode taps `t.value === state.answer` (string code), select mode taps each `state.answer` value (the `number[]` cast is only a type); `answerWrong` picks a tile not in `correctChoices`/`answer` and, for select, a tile not in the answer set. No helper change was needed; confirm in the orchestrator run. |
| Teacher read `npm run sample -- E1 --count 6`, E1.1 | prompts are 1 short sentence ("Dotknij koła.", "Który nie pasuje?", "Co będzie dalej?") and the tiles/row carry the task, so a 6-year-old can answer without reading; hints teach before the result; odd-one tiles have one unambiguous split; patterns have one next element. Concern for the reviewer: a "Dotknij prostokąta." task can show a square tile (mathematically a square is a rectangle; school grade 1 keeps them apart) |

## 4. Next command

`/10x-tdd e1-shapes-picture-mode phase 3` (Phase 3, `Driver: tdd`)

## 5. Open

- Not seen on screen: nothing was rendered here (no Chromium). `[visual]` 2.8 needs the pattern row (132 px cells, `long` rectangle 1448x300, 200 high with the solution), figures on 200x136 select tiles and 254x136 tiles, and the dashed place.
- 2.6 e2e: orchestrator runs `npx playwright test --workers=4` (expect 86 passed).
- Progress preview (`progress.ts`) was not touched: a SHAPES first-wrong example is a face code only for tiles tasks; `roundResults` already converts it to words (phase 1).
- `taskKey` ignores tiles for SHAPES `name` (plan risk F4) as before.
- `[reviewer]` 1.5, 2.7 and `[human]` 9.6, 9.7 open.

## 6. Autonomous decisions

1. **Pattern drawing is shape `long`**, not `wide`: nine cells at 132 px need about 1350 px; the 600 px wide rectangle would shrink them to 59 px. Rejected: a new layout rectangle. Would change: the visual gate finding the row too large in the solution phase (then lower `PATTERN_LOOK.cell`).
2. **Face fill 0.8 of the short side, small 0.6 of that**, rectangle 1.15 x 0.7 of the radius; provisional numbers in `FACE_LOOK` for the visual gate.
3. **Empty label for face tiles** (text kept as an empty `Text`) so the tile shrink logic and hook targets stay unchanged.
4. **`E1.1.pattern` figures**: circle, square, triangle, star, heart (not rectangle, which is hard to tell from the square at small size). Would change: a teacher asking for rectangles in rows.
5. **E1.1 skills**: two SHAPES skills (tiles name+odd, select all) and one PATTERN, threshold 2 of 3 with `ceil(0.5 n)`.
6. **Commit message and next-phase prompts** decided in place; stop after phase 2.
