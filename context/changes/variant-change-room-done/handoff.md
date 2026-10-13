# Handoff — `variant-change-room-done` (slice S-10)

Written by `/10x-implement` phase 4 (committed 8baf606): a hold on a furnished slot opens the free variant-change panel; green except e2e (orchestrator gate). Phase 5 (room-done card, room list, "Zmień wygląd" mode) is next.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | ..., `41c4c7b` (phase 3), handoff p3, `8baf606` (phase 4) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 30 (4.1-4.5 ticked; 4.6, 4.7 [visual] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/RoomScene.ts` | `holdZone`, `feed`, `update` (suspender cancel), `resetGesture`, `dispatch` writes only `rooms` on `changed`, `slotTargets`, snapshot `hold`/`heldSlot`; F5 casts gone |
| `src/ui/widgets/RoomView.ts` | `highlight(slotId)` outline layer, `slotBox`, caption at `captionAnchor` (V1) |
| `src/data/pl.ts` | `roomText.task/slot` typed lookups (F5; used by RoomView, RoomTaskButton, RoomScene) |
| `src/data/layout.ts` | `ROOM_LAYOUT.slot.holdOutline` 10, DESIGN-GAP comment (row 37 is written in phase 6) |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `targets.slots`, snapshot `hold`/`heldSlot`/panel `mode` types |
| `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` | deferred break A: `dispatch` writes `stars = step.stars - 1` on `changed`; `git apply --check` passes on 8baf606 |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1074 passed (baseline 1074, +0; no new unit tests, the scene seam is e2e-only) |
| `npm run lint`, `npm run typecheck`, deploy tests, `sample` E1-E6 | clean / exit 0 |
| `grep "as Record<string, string>" src/scenes/RoomScene.ts` | empty; `snapshot` uses `this.room()` |
| `npm run build` | "e2e hook: absent (2 chunks checked)" |
| `tests/layout.test.ts` | green, unchanged |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate; expected 24 passed (+0) |
| Deliberate break | deferred by plan: patch `e2e-break-s10-p4.patch`. Meta-check: no existing spec performs a change, so any break of this seam stays green in phases 4; row 7.2 in phase 7 must apply the patch and see test 1 red on `stars === S` after "Wybieram" in the change panel. Patch is production code only. |

Request for orchestrator: `npx playwright test` on 8baf606 must stay 24 passed (`room-purchase.spec.ts` untouched).

## 4. Next command

`/10x-implement variant-change-room-done phase 5`

## 5. Open

- Phase 7 must use `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` (break A, row 7.2).
- `[human]`/`[visual]` rows: 3.5, 4.6, 4.7, 6.6-6.9. `[reviewer]` 2.4.
- Phase 5 `ROOM_DONE_LAYOUT`: do not copy `UNLOCK_LAYOUT.button` (overlaps `ROOM_LAYOUT.choose`). `RoomScene.feed` passes `mode: 'normal'` to `roomGesture`: phase 5 must pass `'change'` while the "Zmień wygląd" mode is on, and disable `holdZone` while the card is shown.
- DESIGN-GAP rows 37-41 go into `docs/design-gaps.md` in phase 6 (code comment for 37 exists).

## 6. Autonomous decisions


1. Triage done in place (no AskUserQuestion): every CRITICAL/WARNING fixed in plan.md with its recommended fix; OBSERVATIONS F6/F7 accepted. Would change: maintainer disagreement on disk.
2. F1 — added pure `roomGesture` to phase 1 (tdd) rather than leaving gesture rules in `RoomScene` (rejected: in-scene feed like `UIScene`, untestable before phase 7). Why: CLAUDE.md logic-in-core rule and the slice check "hold must not trigger on release". Would change: phase-1 agent finds it duplicates `longPress` wholesale.
3. F2 — accepted "Zamknij" sharing `modeButton`'s place (S-09 precedent) over moving the mode button. Would change: visual gate shows the double-tap toggle confuses.
4. Deep mode without a sub-agent: the riskiest claims were few and local, verified directly. Would change: a broader blast radius.
5. Phase 1 stayed `Driver: tdd`; adding the `mode: 'buy'` literal to `PanelState` and the existing tests was done inline as the type change. Stubs (wrong values) were written before tests only to get an assertion RED. Would change: none.
6. `Box` is `{left, top, right, bottom}` and `roomGesture` returns `held` only while the press is `holding`. Would change: phase 4 scene needs another shape.
7. Phase 2: caption anchors floor (300, 820) and walls (300, 240), `captionCharWidth` 20 (conservative estimate). Strings teacher-read: gender/accusative fine ("Stuknij mebel"), no numerals, short sentences. `RoomView` must use `captionAnchor` in phase 4. Would change: visual gate shows overlap.
8. Phase 3: F6 taken: `e2eStars` is read next to `e2eFail` in `main.ts` and passed into `createGame` as `startStars` (like `month`). Cap 500 (`E2E_MAX_STARS`), 1-3 digit decimals only. Would change: nothing.
9. Phase 4: the hold zone is one `Zone` over `ROOM_LAYOUT.area` created before the buttons; its input is disabled while a panel is open (set in `redraw`). `feed` ignores events while the panel is open. Hold outline is a separate graphics at depth 1 so `render` does not clear it. F5 solved with `roomText` in `pl.ts` (one cast in data, none in scenes). Would change: visual gate shows layering problems.
10. Phase 4 e2e not runnable (MachPort): orchestrator gate; break deferred to phase 7 as the plan says.
