# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-implement rooms-as-data phase 5` step of run 2026-10-30-rooms-kitchen: phase 5 is committed (`2c367e8`). The art table and the art script are per room; `npm run art` is byte-neutral.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | phase 1 `dd6db69`, phase 2 `901926e`, phase 3 `96f9128`, phase 4 `c9fcca5`, phase 5 `2c367e8`, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 17 (`grep -c '^- \[ \]' plan.md`); 1.4, 2.5, 3.5, 4.4, 5.5 open (e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/roomArt.ts` | `ROOM_SCENE_FILES` (per room id), `roomArt(room)`, `ROOM_ART = Object.values(ROOMS).flatMap(roomArt)`; `SCENE_FILES` and `SALON_ART` removed (no other reader) |
| `scripts/make-task-art.mjs` | `ROOM_PACKS` table (salon row, `recolourBoard`), `ROOM_JOBS` derived from it; header names it as the place S-22 adds a row |
| `tests/fixtures/room-art-salon.json` | snapshot of the 37 entries taken from the unchanged table |
| `tests/roomArt.test.ts` | snapshot equality, scene-file row per room, checks over every room (local `ROOMS` renamed `ROOMS_DIR`) |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit baseline | 4010 (after phase 4) |
| unit after phase 5 | 213 files, 4012 tests passed: +2 |
| break 1 | folder `assets/rooms/${room.id}/` -> `assets/rooms/salon2/`: snapshot, header, orphan-file and weight cases red; restored |
| break 2 | salon `recolourBoard: false` then `npm run art`: `git status --porcelain public/` listed `architecture-after.webp` and `architecture-before.webp`; restored with `git checkout -- scripts public` |
| meta-check | each edit confirmed with `cmp` against a saved copy (break 1) and by the diff stat (break 2); the snapshot is an oracle of today's behaviour, not of the refactor |
| `npm run art` | 86 files; `git status --porcelain public/` empty (byte-neutral); `scripts/` shows only `make-task-art.mjs` (needed the sandbox disabled) |
| 5.4 | `git diff --stat 19ded7a -- src/core src/scenes src/ui public` empty |
| lint / typecheck | pass / pass |
| deploy scripts, `sample` E1-E6 | OK OK / all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| Playwright e2e | NOT run (orchestrator owns ports); row 5.5 left unticked |

## 4. Next command

`/10x-implement rooms-as-data phase 6`

## 5. Open

- Rows 1.4, 2.5, 3.5, 4.4, 5.5 stay unticked until the orchestrator's e2e (`--workers=4`, branch baseline + 0).
- Phase 6 has `[visual]`/`[human]`/`[reviewer]` rows that are not the implementer's. Follow-ups: none new. DESIGN-GAP: none.

## 6. Autonomous decisions

- Skill checkpoints (execution mode, commit message, dirty paths) decided in place: implemented in this context, proposed message used, stopped after phase 5.
- `ROOM_SCENE_FILES` throws in `roomArt` for a room without a row (the data test catches it first).
- The board recolour decision moved into the `ROOM_PACKS` row (`recolourBoard` plus the two background file names); log lines and job order unchanged.
- Earlier decisions (phases 2-4): `save-v5.json` built from `save-v4.json`; v4-era tests reworded to v5; marker `v4-salon` added to the guard test list; a teaser tile for a room missing from the catalogue.
