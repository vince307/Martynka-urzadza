# Handoff — `variant-change-room-done` (slice S-10)

Written by `/10x-implement` phase 5 (committed f5e153a): the "Pokój gotowy!" card with the room list and the "Zmień wygląd" mode; green except e2e (orchestrator gate). Phase 6 (seam sweep, design gaps 37-41, follow-ups, docs) is next.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | ..., `8baf606` (phase 4), handoff p4, `f5e153a` (phase 5) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 22 (5.1-5.4 ticked; 5.5 [reviewer], 5.6, 5.7 [visual] left) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/RoomDoneCard.ts` | new: card, title, a tile per `RoomListItem` (miniature + check mark; teaser dashed, padlock while locked), "Dalej" (`PageButton.setDepth(5)`), `target()` |
| `src/ui/widgets/RoomView.ts` | `drawRoomMiniature(g, room, state, left, top, scale)` |
| `src/scenes/RoomScene.ts` | `mode`, `card` (set at once in `dispatch` on the last purchase), `cardDrawn` (after `purchasePopMs`, 0 with reduced motion), `showCard` (auto-read via `effectiveAutoRead` + narrator), `modeButton`, `blocked = open \|\| card` disables holdZone/task/mode/resume; `roomGesture` gets `mode: this.mode`; narration = done.spoken / change.hint / task; snapshot `done`/`mode`/`card`/`modeText`; `modeButtonTarget`, `cardNextTarget` |
| `src/data/layout.ts` | `ROOM_LAYOUT.modeButton` (1010,892, 570x128: right of the 3rd thumbnail, so it does not copy `taskButton`'s rect), `ROOM_DONE_LAYOUT` (card ends at tray.top 780, "Dalej" at 735,624), `ROOM_TOUCH_TARGETS.modeButton/cardNext` |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `targets.modeButton`, `targets.cardNext`; snapshot types |
| `tests/layout.test.ts` | +2 tests (mode/card targets, tiles in card) |
| `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` | deferred break A for phase 7 (unchanged) |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1076 passed (baseline 1074, +2) |
| `npm run lint`, `npm run typecheck`, deploy tests, `sample` E1-E6 | clean / exit 0 |
| `npm run build` | "e2e hook: absent (2 chunks checked)" |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate; expected 24 passed (+0) |
| Deliberate break | `ROOM_LAYOUT.modeButton.top` 892 -> 800 made the new `layout.test.ts` test red (`expected true to be false`, overlap with thumbnail/"Wybieram"); restored. Meta-check: it protects the disjointness of rectangles, not looks. |

Request for orchestrator: `npx playwright test` on f5e153a must stay 24 passed (no spec touched; `RoomScene` changes affect the room spec path: hold zone, task button, panel).

## 4. Next command

`/10x-implement variant-change-room-done phase 6`

## 5. Open

- Phase 7 must use `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` (break A, row 7.2). Hook now exposes `snapshot.room.card/mode/done/modeText`, `targets.modeButton/cardNext`.
- `[human]`/`[visual]` rows: 3.5, 4.6, 4.7, 5.6, 5.7, 6.6-6.9. `[reviewer]` 2.4, 5.5.
- DESIGN-GAP rows 37-41 go into `docs/design-gaps.md` in phase 6: code comments exist for 37 (hold view), 38 and 40 (mode button, `ROOM_LAYOUT.modeButton`), 39 and 40 (card and room list, `ROOM_DONE_LAYOUT`, `RoomDoneCard`); `pl.ts` comment cites 37-41.
- Not verified in a browser: card layering (card graphics depth 5 over RoomView captions depth 0), thumbnail look, padlock/check shapes, "Zamknij"/mode button shared place.

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
11. Phase 5: `ROOM_LAYOUT.modeButton` is 1010,892 570x128, not the `taskButton` rect (that rect overlaps the 3rd thumbnail; plan said "miniatury nie nachodzą"). Card is 220..780 (ends at tray.top) with "Dalej" at y 624 above "Wybieram" instead of reusing `UNLOCK_LAYOUT.button`. `RoomDoneCard.show(items, room, state)` takes the salon's `RoomDef` + state for the miniature (one room in v1); tile name is `pl.room.name`. `PageButton.setDepth` added so the button sits over the card graphics. Auto-read stage comes from the registry learner (`effectiveAutoRead`), speaking skipped without settings/learner. Would change: visual gate shows overlap or odd layering.
12. Phase 5 e2e not runnable (MachPort): orchestrator gate. Teacher read of strings (row 5.5 stays [reviewer]): "Pokój gotowy!", "Salon", "Wkrótce", "Dalej", "Zmień wygląd", "Gotowe", "Stuknij mebel, który chcesz zmienić." - no numerals, imperative accusative OK.
