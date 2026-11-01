# Handoff — `hangar-module` (slice S-30)

Written by the `/10x-implement hangar-module phase 1` step of run 2026-10-31-space-base. Phase 1 (Hangar as data, copy and art, unreachable) is committed at 041e279; next is phase 2 (`Driver: tdd`). The next agent must not miss that phase 2 has to REMOVE the temporary Hangar exemption in `tests/roomsData.test.ts` (test "is keyed by its own id and placed in exactly one house of HOUSES"), and that e2e for phase 1 (row 1.6, `187 + 0`) was not run by this step.

## 1. State

| | |
|---|---|
| Branch | `feat/hangar-module`, cut from `main` at `a4a0aee` (S-29 merge) |
| Commits | 7 on top of `a4a0aee`: identity, research, plan, plan review, phase 1 `041e279`, docs `phase 1 shas` + handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged by this step) |
| `## Progress` rows remaining | 21 (`grep -c '^- \[ \]' plan.md`): 1.6 (e2e by orchestrator), 1.7, 1.8, phases 2-4 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | `SPACE_BASE_V2` constant + `ROOM_PACKS` row `hangar` |
| `public/assets/rooms/hangar/*.webp` | 21 new files made by `npm run art` (nothing else in `public/assets` changed) |
| `src/data/rooms.ts` | `hangarSlots`, `HANGAR`, `ROOMS` gains it |
| `src/data/roomArt.ts` | `ROOM_SCENE_FILES.hangar` |
| `src/data/pl.ts` | `room.names.hangar`, task labels, slot captions, variant forms (DESIGN-GAP row 201 cited; row itself comes in phase 3) |
| `tests/fixtures/room-art-hangar.json` | snapshot written from the pack manifest and PNG sizes |
| `tests/roomArt.test.ts`, `tests/roomsData.test.ts`, `tests/roomHit.test.ts` | hangar snapshot, manifest literal, costs, `unreachableSlots` over the Hangar; the exemption below |
| `context/changes/hangar-module/plan.md` | rows 1.1-1.5 ticked with sha |
| `context/changes/hangar-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run art` + `git status --short` | only the 21 new files under `public/assets/rooms/hangar/` (no other WebP changed) |
| the five phase-1 vitest files | green, 85 tests |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy/ops tests + `sample` E1-E6 | unit `Tests 4190 passed` (baseline 4185, +5) |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -o "assets/rooms/hangar/" dist/sw.js \| wc -l` = 21 |
| `git diff --stat a4a0aee -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/balance.ts public/assets/rooms/{salon,kitchen,bridge}` | empty |
| e2e | not run (phase says orchestrator, `--workers=4`, expected `187 + 0`; phase 1 leaves the Hangar unreachable) |
| Deliberate breaks | rover `x` 1114 → 1115: manifest literal case red; `hangar-crates` variants dropped from `pl.room.variants`: copy case red; `hangar-mat-mint.webp` moved away: size, orphan and weight cases red; each restored, suites green again. Meta-check: the literal is written from the manifest, not from `hangarSlots`; the art cases prove files and tables agree, not that the picture looks right (visual pass, phase 3) |

## 4. Next command

`/10x-tdd hangar-module phase 2`

## 5. Open

- Plan gap found: the existing invariant "placed in exactly one house of HOUSES" (`tests/roomsData.test.ts`, `describe('every room in ROOMS')`) fails for an unreachable room; phase 1 exempts `hangar` with a comment (expects 0 placements). Phase 2 must restore `toHaveLength(1)` for every room when the `HOUSES` row lands.
- Manual rows: 1.6 e2e (orchestrator), 1.7 [reviewer] teacher read of the Hangar copy, 1.8 [reviewer] CI at ship `100 of 100 room pictures precached`, 3.6-3.10 as in the plan.
- DESIGN-GAP row 201 and edit of row 196 are planned for phase 3 in `docs/design-gaps.md` (pl.ts already cites 201).
- Follow-ups and seam sweep (`SPACE_BASE`/`SPACE` duplicate in `scripts/make-task-art.mjs`) are phase 3.
- Risk: phase-4 e2e is load-sensitive (plan `## Known risks`).

## 6. Autonomous decisions

- Invoked the phase directly from the plan body instead of through the Skill tool wrapper; no user prompts arose. Would change: a skill-only step that cannot be reproduced by hand.
- Temporary exemption for `hangar` in the "placed in exactly one house" test, rather than adding the `HOUSES` row early (that is phase 2 and would flip e2e and four tests). Rejected: deleting the invariant. Would change: a plan that moves the row into phase 1.
- Row 1.6 left unticked: the e2e part was not observed by this step. Rows 1.7/1.8 are [reviewer], not mine.
- Fixture labels follow the `roomArt()` label format of the Mostek fixture ("caption Variant").
