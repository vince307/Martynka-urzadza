# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-implement` step, phase 3, of run 2026-11-01-bathroom-polish-lab: the salon's three backgrounds come from the cream pack files, committed as `b1d6f31` and green. Phase 4 (e2e seam for a saved v6 kitchen) is next.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | p1 `13cb528`, p2 `d2b8c24`, p3 `b1d6f31` `feat(house-1-polish): salon na kremowym tle (p3)` (+ this handoff commit) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| Progress rows remaining | 22 (`grep -c '^- \[ \]' plan.md`); rows 3.1-3.6 ticked |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | salon row `scene` = three `{ pack: HOUSE_1_POLISH, id: 'salon-{before,after,shadows}-cream', as: 'architecture-before' / 'architecture-after' / 'shadows' }`, `recolourBoard: false` |
| `public/assets/rooms/salon/{architecture-before,architecture-after,shadows}.webp` | regenerated: 75 794 / 70 842 / 68 792 B (equal to research); `npm run art` changed nothing else; salon still 37 files |

## 3. Verification

| command | result |
|---|---|
| `npm run art` | exactly the three salon files modified |
| `vitest roomArt bootBudget recolourBoard` | 18 passed, no test added or edited |
| Break A (after `as: 'salon-after-cream'`) | `npm run art` wrote an orphan `salon-after-cream.webp`; `roomArt` "leaves no file without a table entry" red; restored, orphan removed |
| Break B (salon `recolourBoard: true`) | `recolour-board` exited 1: "board mask covers 0.0% and the result has non-finite values" (the guard refuses the cream); restored |
| Meta-check | the breaks prove the table and the guard, not that the cream shows: that is the phase-6 rendered pixel |
| 3.4 diff | `git diff --stat d2b8c24 -- src tests/fixtures …kitchen children bathroom bridge hangar` empty |
| local gate | lint, typecheck clean; unit 4252 passed (phase 2 4252, +0); deploy and ops tests OK; `sample` E1-E6 0 violations; build `e2e hook: absent (2 chunks checked)` |
| single e2e specs (sandbox disabled, `--workers=1`) | salon-load-health, salon-style, salon-art, canvas-renderer, backdrop-restore, house-cross-section, load-and-tab-guard: 28 passed, none edited |

## 4. Next command

`/10x-implement house-1-polish phase 4` (phase 4: confirm its `Driver:` line in plan.md)

## 5. Open

- `[human]` rows 5.7-5.11 (save v7, costs, salon cell fill gap 207, salon before look gap 206, real tablet offline); `[reviewer]` 2.8, 2.9 (CI), 5.12.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs`, later `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.
- `scripts/recolour-board.py`, `BOARD_COLOUR`, `BOARD_FILES`, `recolourBoard` stay unused by any row (follow-up).
- Full e2e: orchestrator, once after phase 6. DESIGN-GAPs 206, 207 and edits to 109, 182, 203, 169/171 come in phase 5.

## 6. Autonomous decisions

- No `AskUserQuestion`; manual gate and commit prompts decided in place (commit the planned set, stop after phase 3).
- Break A's first attempt used BSD `sed -i` wrongly and changed nothing; redone with python. An `npm run art` started in a tool call that hit the 120 s limit kept running in the background and rewrote files transiently; waited for it, final tree held only the planned files.
