# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-tdd first-furniture-purchase phase 2` (autonomous run 2026-10-13-s09-s11). Phase 2 (salon data and room strings) is committed `59c9253`; row 2.4 is open only for the e2e gate, which the orchestrator must run. Row 1.3 is ticked from the orchestrator's run on `323024b`.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | docs commits, `d792eee` test(p1), `59c9253` test(p2), then this `docs(first-furniture-purchase): handoff p2` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/rooms.ts` | `SALON` (10 slots, 10 tasks, costs 5..15 sum 96), `SALON_PLACEHOLDERS` (size + 3 looks per slot, plain/stripes/dots), `ROOMS`, `FIRST_ROOM`, types `Look`, `SlotPlaceholder` |
| `src/data/layout.ts` | `PLACEHOLDER_COLORS` + `oak`, `terracotta`, `paleLeaf`; `ROOM_LAYOUT` + `area`, `wallBottom`, `tray`, `taskButton`; `resume` moved to left 240 (still inside the panel, layout test green) |
| `src/data/pl.ts` | `pl.room.name`, `pl.room.tasks` (keys `fixFloor`..`hangPicture`), `pl.room.slots` (keyed by slot id), `pl.room.short(have, need)` |
| `tests/roomsData.test.ts` | 8 invariant tests |

Phase 5 note: `RoomScene` still draws the old panel caption; `resume` now sits at x 240 (the scene reads `ROOM_LAYOUT.resume`, so no code change was needed).

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `SALON` with no slots) | 6 failed, e.g. `AssertionError: expected [] to have a length of 10 but got +0` |
| GREEN | `npx vitest run tests/roomsData.test.ts`: 8 passed (first run caught a real data error: curtains top 190 < area top 204, fixed to y 360) |
| Deliberate break | sofa y 600 to 700: `sofa: expected 820 to be less than or equal to 780` red; floor variants with two `plain`: `floor: expected 2 to be 3` red; restored, 8 passed. Meta-check: bounds come from `ROOM_LAYOUT.tray/area`, not from slot data |
| `npm run lint` / `typecheck` | OK / OK (boundary rule: `src/data/rooms.ts` imports only types from core) |
| unit (`npm test` + deploy tests + `sample` E1–E6) | OK, Tests 995 passed (baseline 987, +8); all sample exits 0 |
| `npm run build` | OK, e2e hook absent |
| `npx playwright test` | not runnable in this session (MachPort, 7 failed / 16 did not run, all at browser launch) — orchestrator gate |

## 4. Next command

`/10x-tdd first-furniture-purchase phase 3`

## 5. Open

- Row 2.4 open only for e2e: orchestrator runs `npx playwright test` on `59c9253` (data/layout/pl only; `resume` moved, so a red spec reading `resume` would be the seam to check).
- Row 2.5 `[reviewer]` teacher read left open. My own read: imperative + accusative OK (Napraw podłogę, Pomaluj ściany, Powieś zasłony, Wstaw kanapę, Połóż dywan, Postaw stolik/lampę/kwiatek, Powieś półkę/obraz), slot captions nominative, "masz 3/5" digits only.
- Earlier items unchanged: `[human]` 7.6–7.10, `[visual]` 4.6, 5.5, 6.5, 6.6, `[reviewer]` 2.5, 6.4, seam sweep 7.5; phase 4 break 4.4 and phase 8 need Chromium; DESIGN-GAP 31–36 in phase 7 (the DESIGN-GAP comment is already in `pl.ts`).

## 6. Autonomous decisions

- TDD gate: `src/data/rooms.ts` absent, so TDD with no redirect. No AskUserQuestion.
- RED via a throwaway stub `rooms.ts` (empty SALON), replaced by the real data.
- `paleLeaf` added as a separate key (0xe3f0d9, same value as `tile`) because the style guide names it; `PLACEHOLDER_COLORS` is only read by key. Would change: a lint/duplication objection, then use `tile`.
- Slot layout (centers/sizes) is a proposal inside `ROOM_LAYOUT.area`; phase 5 may tune it, the invariant test stays binding. Task ids kebab-case, labels camelCase keys of `pl.room.tasks`.
- Commit split: test+data commit, then SHA ticks plus handoff in a docs commit.
