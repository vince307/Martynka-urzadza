# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-new kitchen-room` step of run 2026-10-30-rooms-kitchen (2026-10-31). The change folder exists with
`change.md` (roadmap claims re-verified, kitchen pack inventory, triggered follow-ups, decisions D0-D7); no code yet.
The next agent must not get this wrong: **the boot budget test fails with the kitchen in the boot queue** (measured
57.8 s vs the 48 s limit), so research has to choose how the kitchen art loads (change.md D4) and must never raise
`balance.loader.totalMs` silently (scope.md).

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` (merge of #117, F-04 shipped) |
| Commits | 1 on top of `942e237`: `docs(kitchen-room): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | none yet (no `plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kitchen-room/change.md` | change identity: roadmap claim / repo now / correction table, kitchen pack inventory (slots, layers, WebP estimate), design-kit views and copy keys, migration (none), triggered follow-ups with a take each, autonomous decisions D0-D7 |
| `context/changes/kitchen-room/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/kitchen-room` |
| boot payload now (node over `TASK_ART`, `ROOM_ART`, `UI_ART`, `FONT_URL`, boot `SOUNDS`, the sum `tests/bootBudget.test.ts` makes) | 2 092 496 B = 41.8 s at 50 KB/s; limit 48 s; `ROOM_ART` 37 files, 1 203 384 B |
| `cwebp -quiet -q 85 -alpha_q 100 -m 6` (the art script's settings) on the 21 kitchen PNGs, output in the session scratchpad only | 797 758 B; projected boot payload 2 890 254 B = 57.8 s, so the budget test would fail by about 9.8 s |
| `sips` / `stat` on the pack files | sizes and pixel dimensions as in change.md's inventory (every variant the size of its slot; three 1920 x 1080 scene files) |
| lint / typecheck / unit / build / e2e | NOT run: this step changed docs only (no code) |
| deliberate break | none (no test written in this step) |

## 4. Next command

`/10x-research kitchen-room`

## 5. Open

- Research questions (change.md): the kitchen art load path vs the boot budget (D4: per-room load, downscale, atlas or a
  `[human]` raise); the runtime move after "Dalej" (`RoomScene.create` `RoomDoneCard` callback, `nextRoom` in
  `src/core/house.ts`, registry `rooms`/`currentRoom`, flush, `SalonBackdrop` on wake); the celebration with an intensity
  parameter (`RoomDoneCard`, `starBurst`, `RoomScene.showCard`, `prefersReducedMotion`); per-room copy (`pl.room.names`
  case, `pl.room.tasks`/`slots`/`variants` for the kitchen, `roomMismatch` lines); kitchen costs (5-15, 7 tasks).
- Pack notes: the bench's `targetRect` does not span its file (the game ignores `targetRect`); the bench tucks under the
  counter (z 18 vs 20) and may show its hidden end before the counter is bought; cream margin vs the salon's green board.
- DESIGN-GAP candidates (next row 175 in `docs/design-gaps.md`): kitchen task imperatives and captions, the celebration
  view, the kitchen tile without a thumbnail, cream vs green margin, room-neutral mismatch lines. None added yet.
- Follow-ups fired by this slice (change.md table): rooms-as-data 1, 2, 3, 5, 6, 7, 14 and the RoomScene group (L-R8 out,
  L-R11 for the new celebration tweens), audit-art-renderer § 2 (`python3 -I` in `scripts/make-task-art.mjs`).
- Human checklist: none yet. A `[human]` row is due only if research/plan picks the `totalMs` raise (D4 option d).

## 6. Autonomous decisions

- **Next command `/10x-research` instead of the skill's default `/10x-plan`.** Fixed by the step prompt; also needed by
  the failing boot budget and the runtime room move. Would change: nothing in this run.
- **Scope decisions recorded as fixed by the maintainer (scope.md)** in change.md D0. Would change: a new maintainer
  instruction.
- **Kitchen content from the pack only: 6 slots, `decor: []`, `worn: []`, `contactShadows: []`, no thumbnail, no
  recolour** (change.md D1). Why: the pack's README/style guide (before = one full picture, plants are architecture,
  shadows in the sprites, cream margin). Would change: a pack revision or the maintainer asking for the green board.
- **No save-format change (stay on v5)** (change.md D3). Why: `house`, `rooms`, `currentRoom` already carry the kitchen;
  `nextRoom` creates its state. Would change: research needing a persisted "celebration shown" flag.
- **Boot budget: no silent raise; research picks the mechanism, leaning to a per-room art load** (change.md D4). Why:
  measured overrun of ~9.8 s, and every later room adds 0.8-1.5 MB. Would change: research showing a runtime load
  breaks the art-health or stand-in paths at a cost above the slice, then downscale or a `[human]` raise.
- **Celebration = a parameter of the existing done card, only `room` intensity reachable** (change.md D5). Why: scope.md,
  FR-040. Would change: research showing a full reveal cannot coexist with the room list on one card.
- **Measurement artefacts kept out of the repo**: the converted WebP files live in the session scratchpad only;
  `public/assets/rooms/kitchen/` is created by the implement step through `npm run art`. Would change: nothing.
