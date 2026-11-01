# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-implement` phase 2 step (phase 1 was `/10x-tdd`) of run `2026-10-31-space-base`. Phases 1 (look/label/art keys as data) and 2 (base pictures, per-building art filter) are committed; phases 3-5 remain. The next agent must not get this wrong: the house look must stay as before (the only intended pixel change is the stand-in roof apex, 64 px above its base, follow-up 20) and `HouseScene.art()` now filters `HOUSE_ART` with `houseArtKeys`.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | phase 1 `55c8c16`, phase 2 `7db029e` (+ this handoff commit) |
| pushed / PR / merged | no / none / no |
| `## Progress` rows remaining | 18 (`grep -c '^- \[ \]' plan.md`); 2.7 is [reviewer] |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | `BASE_FILES` (SPACE -> `public/assets/house/`), counted in the summary |
| `public/assets/house/base-1-shell.webp` | 1920x1080, 81 970 B |
| `public/assets/house/base-1-cell-closed.webp` | 608x342, 12 308 B (base sum with shared frame 102 878 B) |
| `src/data/houseArt.ts` | two base rows (5 entries) |
| `src/scenes/HouseScene.ts` | private `art()` = entries named by `houseArtKeys(geometry())`; `shellReady`, `loadArt` use it |
| `tests/houseArt.test.ts`, `tests/houseSceneWiring.test.ts` | sizes, per-building caps (`house-1` 80 000, `base-1` 110 000; base checked directly until phase 3), filter guard |

## 3. Verification

| command | result |
|---|---|
| `npm run art` | only the two new files appear in `git status public` |
| targeted vitest (5 files) | 47 passed |
| deliberate breaks | delete `base-1-cell-closed.webp` -> size, orphan, cap cases red; `HOUSE_ART.every(` back in `shellReady` -> wiring guard red; base cap 90 000 -> cap case red; each restored, suite green again |
| meta-check | size oracle is the pack manifest; the guard proves wiring, not the browser loading one building (phase 5) |
| lint / typecheck / deploy+ops tests / sample E1-E6 | OK (observed) |
| `npm test` | 227 files, 4179 passed (baseline 4171; +1 over phase 1) |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -o assets/house/ dist/sw.js` = 5 |
| `git diff --stat HEAD` rooms/ui/tasks/choice, BootScene, save.ts | empty |
| e2e | `house-cross-section.spec.ts` 4 passed (sandbox off); full suite is the orchestrator's |

## 4. Next command

`/10x-tdd base-cross-section phase 3` (phase 3, `Driver: tdd`)

## 5. Open

- Phases 3 tdd (base geometry from the pack manifest, flip the `houseCells` "no geometry for the base" pin, stale house scene), 4 impl (docs, gaps incl. 195, follow-ups, visual), 5 e2e.
- `[human]`/`[visual]`/`[reviewer]` rows 2.7, 4.6-4.10 are not mine.
- Gap 195 stays open until phase 3 gives the base a geometry.

## 6. Autonomous decisions

- Skill checkpoints decided in place: commit the planned set only, stop after phase 2.
- Base cap case checks the two base rows plus the shared frame directly (no geometry yet), per the plan.
