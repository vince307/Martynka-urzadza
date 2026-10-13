# Handoff — `variant-change-room-done` (slice S-10)

Written by `/10x-tdd` phase 1 (committed 20808c9): core reducers for change mode, hit-testing, room gesture and `roomDone` are done and green. The next agent must keep the change branch of `stepPanel` from ever returning `bought` and must feed `roomGesture` (not scene logic) from the scene in phase 4.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | identity, research, plan, plan review, `20808c9` (phase 1), handoff p1 |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 38 (phase 1 rows 1.1-1.3 ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/variantPanel.ts` | `PanelState` with `mode: 'buy' | 'change'`, `change` event, `changed` result; change branch never spends |
| `src/core/roomHit.ts` | new: `slotBox`, `slotAt`, `holdPoint`, `Point`/`Box`/`SlotSizes` |
| `src/core/roomGesture.ts` | new: `roomGesture`, `ROOM_GESTURE_IDLE` over `longPress` |
| `src/core/rooms.ts` | `roomDone` |
| `tests/roomHit.test.ts`, `tests/roomGesture.test.ts` | new; `tests/variantPanel.test.ts` (mode literals, change cases, property with `change`), `tests/rooms.test.ts` (`roomDone`) |
| `context/changes/variant-change-room-done/plan.md`, `change.md`, `handoff.md` | Progress 1.1-1.3 ticked; status `implementing` |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1064 passed (baseline 1035, +29) |
| `npm run lint`, `npx tsc --noEmit`, `npm run build` | clean; build "e2e hook: absent" |
| RED (stubs returning wrong values) | `roomGesture`: "expected [ 'stub', 'stub', 'stub' ] to deeply equal [ null, null, 'sofa' ]"; `roomHit`/`roomDone`/`variantPanel` change cases also red on assertions (40 failing) |
| Break 1: change confirm bumps `tasksDone` and spends 5 | 19 red (change-mode confirm tests, property seeds); restored |
| Break 2: `slotAt` takes lowest depth | 5 red ("middle of the sofa", rug, edges); restored |
| Break 3: `roomGesture` opens on `up` outside change mode | red "a tap outside change mode opens nothing"; restored |
| Meta-check | oracles come from FR-018 ("change is free"), US-02 AC and hand-computed SALON boxes, not from the code |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate; baseline 24 e2e |

## 4. Next command

`/10x-tdd variant-change-room-done phase 2`

## 5. Open


- `[human]` rows: 3.5 (`?e2eStars` seam), 6.6 (hold 600 ms / 40 px), 6.7 (UX of mode/card/list), 6.8 ("Zmień wygląd" vs literal "poprawki", "Wkrótce"), 6.9 (device check).
- Phase 4 break deferred: patch `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` (`RoomScene.dispatch` writes stars on `changed`) proved by phase-7 row 7.2.
- Phase 5 `ROOM_DONE_LAYOUT`: do not copy `UNLOCK_LAYOUT.button` (overlaps `ROOM_LAYOUT.choose`).
- Observation F6: `e2eStars` may be passed into `createGame` like `month` rather than read in `preBoot`.
- DESIGN-GAP rows 37–41 and follow-ups as listed in plan phase 6.


## 6. Autonomous decisions


1. Triage done in place (no AskUserQuestion): every CRITICAL/WARNING fixed in plan.md with its recommended fix; OBSERVATIONS F6/F7 accepted. Would change: maintainer disagreement on disk.
2. F1 — added pure `roomGesture` to phase 1 (tdd) rather than leaving gesture rules in `RoomScene` (rejected: in-scene feed like `UIScene`, untestable before phase 7). Why: CLAUDE.md logic-in-core rule and the slice check "hold must not trigger on release". Would change: phase-1 agent finds it duplicates `longPress` wholesale.
3. F2 — accepted "Zamknij" sharing `modeButton`'s place (S-09 precedent) over moving the mode button. Would change: visual gate shows the double-tap toggle confuses.
4. Deep mode without a sub-agent: the riskiest claims were few and local, verified directly. Would change: a broader blast radius.
5. Phase 1 stayed `Driver: tdd`; adding the `mode: 'buy'` literal to `PanelState` and the existing tests was done inline as the type change. Stubs (wrong values) were written before tests only to get an assertion RED. Would change: none.
6. `Box` is `{left, top, right, bottom}` and `roomGesture` returns `held` only while the press is `holding`. Would change: phase 4 scene needs another shape.
