# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 3 (tdd) done and committed as 3cb42cc. GRID and PERIMETER exist as generators but no skill uses them yet (phases 5, 6, 9 add skills); the e2e part of rows 3.4 is open (Chromium cannot start in this session).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | 3cb42cc (phase 3) on 2166514 (phase 2) on c84ece8 (phase 1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 3.1-3.3 ticked; 3.4 (e2e part) and 3.5 `[reviewer]` open; 1.5, 2.5 `[reviewer]` open; phases 4-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/grid.ts` | GRID `where`/`what` (5x4, 3-4 items), `parseGridParams`, `generateGrid` |
| `src/core/tasks/generators/perimeter.ts` | PERIMETER `rect`/`triangle`/`sideSquare`/`sideRect`/`composite` (L, U, staircase on a lattice), `parsePerimeterParams` (max 12..100) |
| `src/core/tasks/registry.ts`, `src/core/tasks/bounds.ts` | GRID and PERIMETER registered; GRID in `UNBOUNDED_TYPES` |
| `src/data/pl.ts` | `tasks.grid*`, `tasks.perimeter*` strings |
| `tests/grid.test.ts`, `tests/perimeter.test.ts` | 9 new tests (1000-draw per variant, oracles from the drawing) |
| `context/changes/drawn-grid-tasks-e3-e4/plan.md` | 2.4 ticked (orchestrator e2e note), 3.1-3.3 ticked |

## 3. Verification

| command | result |
|---|---|
| RED | stubs returning empty tasks: validator `expected [ ... ] to deeply equal []` in all 6 draw tests, `expected [Function] to throw an error` in both parser tests |
| lint / typecheck | OK / OK |
| unit | baseline 2103 + 9 = 2112 passed; `sample` E1-E6 exit 0, E3 output identical (no skill uses the new types yet); deploy and ops scripts OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium: MachPortRendezvous Permission denied, 3 plain tries); expected baseline 57 + 0 |
| Deliberate breaks | `composite` answer = bounding-box area -> "expected 12 to be 14" red; `sideRect` prompt perimeter +1 (odd) -> "perimeter even: expected 1 to be +0" red; GRID `where` distractor = the answer cell -> validator duplicate-choices red; all restored. Meta-check: the oracles read the drawing (cells counted from the polygon interior, item looked up on the grid), not the generator's `answer` |
| Teacher read (6 draws x variant, scratch script) | numeral agreement n/a (no counted nouns in prompts; "cztery równe boki" spelled out so hint[0] has no digit); prompts 1-3 sentences; `where` distractors are neighbouring cells and the swapped "3D"; hint[1] of `where` already names the cell, hint[2] repeats it (reviewer may want it softer) |
| Phase 2 e2e row (2.4) | ticked from the orchestrator note: full suite on 2166514 57 passed |

## 4. Next command

`/10x-tdd drawn-grid-tasks-e3-e4 phase 4`

## 5. Open

- 3.4 e2e part (orchestrator: 57 + 0), 3.5 `[reviewer]` teacher read of GRID/PERIMETER wording (samples via `npm run sample` once phases 5-6 add skills).
- `GRID` tiles such as "3D" are a deliberate distractor (digit before letter); `CoordGrid` and the tile row must show them as plain text (phase 5).
- Perimeter `rect` draws at most a 2:1 ratio whatever the labels say (the drawing is not to scale); `FigureGrid` (phase 6) must label sides from `sides`, `null` = no label.

## 6. Autonomous decisions

1. TDD gate: testable, implementation absent -> TDD. Tests were written before the production code this time; stubs in `grid.ts`/`perimeter.ts` produced the RED run, registry entries were scaffolding.
2. `max` of PERIMETER bounds the perimeter shown or asked for (12..100); rejected a per-variant param set. Would change: a skill needing a different cap for the side than for the perimeter.
3. `where` distractors: neighbouring cells plus the swapped label ("3D"); rejected cells holding other items only (any cell is fine, items are unique so none holds the asked item).
4. `composite` shapes L, U and two-step staircase, mirrored randomly, perimeter capped by `max`; rejected a general polyomino generator (needs a simple-polygon check).
5. No `bok` noun added: no prompt puts a number before it.
