# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 9 (impl) done and committed as 486b501: E5.12 and E6.3 are playable, tests pinned to the new order. Row 9.4 (e2e) is open for the orchestrator; 9.5 `[reviewer]` and 9.6 `[visual]` are not mine. Row 8.4 ticked from the orchestrator note (57 passed on d9b83f2, 4.0 min).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | 486b501 (phase 9) on d9b83f2 (p8) on eacf9e0 (p7) on ab1fa91 (p6) on c01c12e (p5) on e69e6e8 (p4) on 3cb42cc (p3) on 2166514 (p2) on c84ece8 (p1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 9.4 (e2e), 9.5 `[reviewer]`, 9.6 `[visual]`; 8.5-8.7, 7.5, 6.6, 6.7, 5.6, 5.7, 4.4, 3.5, 2.5, 1.5 open; phases 10-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/curriculum/E5.ts` | E5.12 (`childName` "Obwody i boki"): `E5.12.perimeter_side_square` (max 80), `E5.12.perimeter_side_rect` (max 60), keypad; unlock threshold 1 of 2 |
| `src/data/curriculum/E6.ts` | E6.3 (`childName` "Obwody figur na kratkach"): `E6.3.perimeter_composite` (max 60), keypad; threshold 1 of 1 |
| `src/core/tasks/generators/perimeter.ts` | `COMPOSITE_MAX_ROWS = 5` (composite redraws until the lattice is at most 5 rows); `SQUARE_MAX` 40 -> 80 |
| tests | `perimeter.test.ts` (5 rows + 36 px cell in the keypad-solution strip), `perimeterSkills.test.ts` (E5.12, E6.3, childName), oracle updates in `curriculumStart` (E5 n=12: 2,4,6,9,11,12; E6 n=9: 3,4,6,8,10,10), `curriculumPick`/`curriculumEnd`/`progress` now use empty E6 step 2 as the unplayable step |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| unit | branch baseline 2205 + 17 = 2222 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0 |
| build | OK, `e2e hook: absent` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, even the seed spec). Expected 57 + 0. WATCH: `first-launch`, `adaptive` (E5/E6 rounds now include PERIMETER keypad tasks with a figure; the e2e `answerRight` must read the answer from the hook, check it handles `figure` visuals), `drawn-tasks`, `art*` |
| Deliberate break | (1) removed the rows check in the composite generator: `perimeter.test.ts` red ("cell: expected 30.33 to be >= 36"); (2) removed E6.3 `childName`: `curriculum.test.ts` and `perimeterSkills.test.ts` red. Both restored |
| Teacher read | `sample -- E5` step 12 and `E6` step 3: prompts "Obwód kwadratu wynosi 32 cm. Ile centymetrów ma jeden bok?", rectangle "Obwód ... Jeden bok ma 15 cm. Ile centymetrów ma drugi bok?", composite "Bok każdej kratki ma 1 cm. Oblicz obwód..."; hints teach (sum of two sides first / go round the figure) without the result in step 1. No defects |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 10`

## 5. Open

- 9.4 e2e (orchestrator), 9.5 `[reviewer]`, 9.6 `[visual]` (side-of-square, composite figure in keypad and solution step, "Nowa umiejętność!" E5.12); earlier open rows as in §1.
- `docs/design-gaps.md` rows 73-77 are referenced from comments; phase 10 writes them (add: composite capped at 5 rows).

## 6. Autonomous decisions

1. Carry-forward (7-row lattice vs 36 px cell in the 768x190 strip): chose to cap composite figures at 5 rows in the generator (`COMPOSITE_MAX_ROWS`), not to enlarge the rect or shrink the lattice; 5 rows give >= 36 px with the 4 px margins and the widest figure (8 columns) fits easily. Rejected: a taller keypad-solution rect (would shift the solution lines for all pictured tasks). Would change: a visual-gate finding that 5-row figures look too small. Tested in `perimeter.test.ts`.
2. `SQUARE_MAX` raised 40 -> 80 and E5.12 square skill uses max 80, because with 40 the space was 9 distinct tasks (< the 12 floor). Would change: the author wanting smaller squares in E5.
3. E6 step 2 became the example of an unplayable step in three pinned tests (E5 step 12 and E6 step 3 are now playable).
