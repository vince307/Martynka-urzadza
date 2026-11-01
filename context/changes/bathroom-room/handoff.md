# Handoff — `bathroom-room` (slice S-31)

Phase 3 (`impl`) is done and committed as `69694ce`: the bathroom exists as data, Polish copy and 21 WebP files, precached, but no house lists it yet (unreachable). Phase 4 adds the `HOUSES` row.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, `7c742b8` phase 1, `32c2a5b` phase 2, `69694ce` phase 3, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 23 (rows 1.1-1.4, 2.1-2.4, 3.1-3.6 ticked; 3.7, 3.8 are `[reviewer]`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | `BATHROOM_V1` pack root and a `ROOM_PACKS` row for `bathroom` |
| `public/assets/rooms/bathroom/` | 21 generated WebP files, 563 514 bytes (equals the research figure) |
| `src/data/rooms.ts` | `bathroomSlots`, `BATHROOM` (stage + 6 slots, costs 5/7/9/10/12/13/15 = 71), `ROOMS` gains it after `CHILDREN` |
| `src/data/roomArt.ts` | `ROOM_SCENE_FILES.bathroom` |
| `src/data/pl.ts` | room name, 6 captions, 6 variant families, 6 task labels; DESIGN-GAP comments cite row 205 (the row itself is written in phase 5) |
| `tests/fixtures/room-art-bathroom.json` | 21 entries written from the pack PNG sizes and the copy table |
| `tests/roomArt.test.ts`, `tests/roomsData.test.ts`, `tests/roomHit.test.ts` | snapshot, `bathroom data (FR-033)` manifest literal, unreachableSlots case; the "placed in exactly one house" invariant exempts `bathroom` (0) until phase 4 |

## 3. Verification

| command | result |
|---|---|
| `npm run art` | 21 new files; `git status --short public` shows only `public/assets/rooms/bathroom/`; no other asset changed (the transient bridge diffs seen mid-run were gone when it finished) |
| five targeted suites | 100 passed |
| Break sink `x` 943 → 944 | `roomsData` manifest case red; restored |
| Break: move `bathroom-rug-mint.webp` away | `roomArt` size, orphan and weight cases red (3 failed); restored |
| Break: `'bathroom-ducks'` → `'bathroom-duckz'` in `pl.room.variants` | full run 2 failed (snapshot label case and the copy case); restored |
| Meta-check | the manifest literal and the fixture come from the pack manifest and PNGs, not from `bathroomSlots`; whether the pictures look right is the phase-5 visual pass |
| lint / typecheck | OK (one lint fix: removed two needless `!` in the new test) |
| unit incl. deploy and ops tests, `sample` E1-E6 | `Tests 4228 passed (4228)` = phase-2 4223 + 5; samples: 0 violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -o "assets/rooms/bathroom/" dist/sw.js \| wc -l` = 21 |
| e2e | not run (no spec touched, bathroom unreachable) |

## 4. Next command

`/10x-tdd bathroom-room phase 4`

## 5. Open

- `[reviewer]` rows: 2.5, 3.7 (Polish read of the copy; `npm run sample` unaffected, no task content changed), 3.8, 5.12. `[visual]` row 5.6. `[human]` rows 5.7-5.11.
- Phase 4 must add the `HOUSES` row (`upper-right`), remove the `bathroom` exemption in `tests/roomsData.test.ts`, and add the finished-children fixture.
- Design gap 205 is cited in `pl.ts` comments but written to `docs/design-gaps.md` in phase 5.
- `npm run art` is slow under load (about 5 min); run it in the background and wait.
- E2E: single specs only per phase; the orchestrator runs the full suite after phase 6.

## 6. Autonomous decisions

- Manual gate, "how to proceed" and commit-message prompts: decided in place, proposed message used, stopped after phase 3. Would change: none.
- The `ROOM_PACKS` furniture list is generated with `flatMap` over slot and family (as bridge and hangar), not spelled out. Would change: none.
- Row 3.5 was verified by the file list of the commit (only the data files, the art script, tests and the new assets). Would change: none.
