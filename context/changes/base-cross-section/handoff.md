# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-tdd` phase 3 step of run `2026-10-31-space-base`. Phases 1-3 are committed; the base now has a cross-section (`HOUSE_GEOMETRY['base-1']`) and the house scene is fresh per building. The next agent must not get this wrong: phase 4 is docs/gaps/follow-ups only (gap 195 closed, 196 narrowed, first-building-choice follow-up 17 closed by this phase), and CLAUDE.md needs ONE compact S-29 sentence.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | p1 `55c8c16`, p2 `7db029e`, p3 see `git log` (`test(base-cross-section): ... (p3)`) |
| pushed / PR / merged | no / none / no |
| `## Progress` rows remaining | 15 (`grep -c '^- \[ \]' plan.md`); 3.4 is the orchestrator's e2e row |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/houses.ts` | `HOUSE_GEOMETRY['base-1']` (pack cells, lift shaft, `background` 0xe8efeb, teaser, no stand-in roof, shared `cell-frame` with DESIGN-GAP comment) |
| `src/scenes/HouseScene.ts` | `create` resets `artQueued`, `artSettled`, `cells`, `modes` first |
| `src/scenes/TaskScene.ts` | `backToChoice` stops `SCENE_KEYS.house` |
| tests | `tests/houseCells.test.ts` (flipped geometry cases, `HOUSE_GEOMETRY base (S-29 phase 3)`), `houseArt.test.ts` (cap case over the geometry), `houseSceneWiring.test.ts` (create resets), `themeBackWiring.test.ts` (backToChoice stop), `roomVisitWiring.test.ts` (comment) |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `AssertionError: expected [ 'base-1' ] to deeply equal []` (every house has a geometry); base literal cases and both wiring guards red |
| GREEN | 49 passed in the 4 touched files plus roomVisit |
| deliberate breaks | base `x` 252 -> 253: manifest + same-cells cases red; drop `artQueued` reset: wiring guard red; drop `scene.stop(SCENE_KEYS.house)`: guard red; each restored |
| meta-check | the literals come from the pack manifest and preview, not from the house entry (the "same cells as the house" case is the second oracle); guards prove wiring, the fresh scene in a browser is phase 5 test 3 |
| lint / typecheck / deploy+ops / sample E1-E6 / build | OK (observed; `e2e hook: absent`) |
| `npm test` | 227 files, 4185 passed (baseline 4171, p2 4179, +6) |
| `git diff --stat HEAD -- save.ts rooms.ts balance.ts main.ts public scripts` | empty |
| e2e | RESULT_E2E |

## 4. Next command

`/10x-implement base-cross-section phase 4` (phase 4, `Driver: impl`)

## 5. Open

- Phase 4 impl (docs, gap rows from 199, follow-ups, seam sweep, visual rows), phase 5 e2e.
- `[human]`/`[visual]`/`[reviewer]` rows 2.7, 4.6-4.10 are not mine; 3.4 is the orchestrator's `--workers=4` run.

## 6. Autonomous decisions

- Skill checkpoints decided in place: commit the planned set only, manual gate skipped, stop after phase 3.
- Phase keeps `Driver: tdd`; scene wiring proven by source guards, as the plan says.
