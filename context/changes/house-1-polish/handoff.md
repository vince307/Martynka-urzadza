# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-implement` step, phase 4, of run 2026-11-01-bathroom-polish-lab: the e2e-build-only seam `?e2eSave=v6-kitchen` is committed as `7a76b76` and green. Phase 5 (docs, gap rows, follow-ups, seam sweep, visual pass) is next.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | p1 `13cb528`, p2 `d2b8c24`, p3 `b1d6f31`, p4 `7a76b76` `feat(house-1-polish): e2e seam for a saved v6 kitchen (p4)` (+ this handoff commit) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| Progress rows remaining | 17 (`grep -c '^- \[ \]' plan.md`); rows 4.1-4.5 ticked |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/testing/e2eHook.ts` | `E2ESaveSeam` and `E2E_SAVE_SEAMS` gain `'v6-kitchen'`; `e2eSaveStore` serves `structuredClone(save-v6-kitchen-mid.json)`; doc comment lists it, `v5-salon` entry says "lifts it to v6 and on to v7" |
| `vite/e2eHookGuard.mjs` | `E2E_HOOK_MARKERS` gains `'v6-kitchen'` |
| `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | seam read case, a store case (fixture is v6 and decodes), marker list |

## 3. Verification

| command | result |
|---|---|
| `vitest e2eSave e2eHookGuard` | 59 passed |
| Break A (drop `'v6-kitchen'` from `E2E_SAVE_SEAMS`) | `e2eSave` "reads each seam from the query string" red; restored |
| Break B (`console.log('v6-kitchen')` appended to `src/main.ts`) | `npm run build` failed in the `e2e hook:` guard (generateBundle error); restored |
| Meta-check | the guard proves absence from `dist/` only because the marker is listed; that the seam really loads the save is for phase 6 |
| 4.3 / 4.4 | build prints `e2e hook: absent (2 chunks checked)`; `grep -rl v6-kitchen dist/` empty; `git diff --stat b1d6f31 -- src/core src/data src/scenes src/ui public scripts tests/fixtures` empty |
| local gate | lint, typecheck clean; unit 4254 passed (phase 3 4252, +2); deploy and ops tests OK; `sample` E1-E6 OK; build OK |
| e2e | none run (no spec touched) |

## 4. Next command

`/10x-implement house-1-polish phase 5` (Driver: impl)

## 5. Open

- `[human]` rows 5.7-5.11 (save v7, costs, salon cell fill gap 207, salon before look gap 206, real tablet offline); `[reviewer]` 2.8, 2.9 (CI), 5.12.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs`, `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs` (done), `deploy/README.md`.
- `scripts/recolour-board.py`, `BOARD_COLOUR`, `BOARD_FILES`, `recolourBoard` stay unused by any row (follow-up).
- Full e2e: orchestrator, once after phase 6. DESIGN-GAPs 206, 207 and edits to 109, 182, 203, 169/171 come in phase 5.

## 6. Autonomous decisions

- No `AskUserQuestion`; manual gate and commit prompts decided in place (commit the planned set, stop after phase 4).
- `tests/e2eHookGuard.test.ts` pins the marker list, so it was edited too (one string); not in the plan's file list.
- Earlier (phase 3): an `npm run art` that hit the tool time limit kept running in the background; waited for it, final tree held only the planned files.
