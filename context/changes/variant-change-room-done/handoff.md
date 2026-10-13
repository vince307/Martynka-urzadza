# Handoff — `variant-change-room-done` (slice S-10)

Written by the phase-7 finishing step. All automated phases (1-7) are committed; review, visual and human rows remain.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | ..., `3e3931d` (phase 6), `96f7514` (fix: hold point margin), `14891b9` (phase 7 e2e spec + config), handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | [reviewer]/[visual]/[human] rows only (5.5-5.7, 6.5-6.9) |
| Working tree | clean after this handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/room-change.spec.ts` | 2 tests: hold opens the free change panel (stars unchanged, tap outside the mode does not open, thumbnail preview), and the finishing purchase shows "Pokój gotowy!" |
| `playwright.config.ts` | `ROUND_SPEC` entry for the hook-build round spec |
| `context/runs/2026-10-13-s09-s11/e2e-request-s10-p7.md` | rounds 1-3 and the orchestrator evidence |
| `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch`, `e2e-break-s10-p7a..d.patch` | the five deliberate breaks |
| `docs/design-gaps.md`, `follow-ups/review-fixes.md` | gaps 37-41, S-11/S-16/v1.1/M8 items |

## 3. Verification

Orchestrator e2e run, round 3 (on `96f7514` + the spec, now `14891b9`): `room-change.spec.ts` 2 passed; full `npx playwright test` 26 passed (baseline 24 + 2). Each break applied alone, spec red, reverted:

| Break | Red assertion |
|---|---|
| p4 (dispatch writes stars on `changed`) | test 1 :122 `expect(changed.state.stars).toBe(S)` Expected 15 Received 14; test 2 :190 `toBe(0)` Expected 0 Received -1 |
| p7a (fired hold dispatches `open`) | test 1 :113 `toMatchObject({kind:'open', mode:'change', slot:'floor'})` received mode "buy"; test 2 :184 panel stayed closed |
| p7b (gesture mode always `change`) | test 1 :101 `panel.kind` Expected "closed" Received "open" after the plain tap |
| p7c (no card on the finishing purchase) | test 2 :163 `room.card` not.toBeNull, Received null (poll timeout) |
| p7d (VariantPanel fires on pointerup without pointerdown) | test 1 :138 `held.preview` toBeNull, Received 0 |

Phase 7 found a product defect: `holdPoint` returned the slot rectangle's top-left edge, which a touch at 1280x720 missed (519.99 vs 520); fixed in `96f7514` (3x3 margin, +2 unit tests).

This step ran: `npm run lint` clean, `npm run typecheck` clean, unit command exit 0 (`npm test` 1078 passed, deploy and ops scripts, `sample` E1-E6), `npm run build` prints "e2e hook: absent (2 chunks checked)". Playwright not run here (orchestrator evidence above).

## 4. Next command

`/10x-impl-review variant-change-room-done`

## 5. Open

- Rows 5.5 (teacher read), 6.5 [reviewer], 6.6-6.9 [human] (iPad/Android hold, tap in mode, card, reduced motion) and the visual gate are not mine.
- Fix `96f7514` (holdPoint margin) came from this phase; real-finger misses on small slots belong to the device check 6.9.

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
13. Phase 6: docs only. Archived S-09 follow-ups are not edited; their closure is recorded in this change's follow-ups file. Design gap row text for 32/36 is covered inside rows 41 (no separate edit to rows 32 and 36). Would change: reviewer wants the old rows amended.

14. Phase 7: e2e not runnable (MachPort): `e2e: not runnable in this session (MachPort) — orchestrator gate`. Spec left uncommitted per protocol; request file written. Hold-over-thumbnail point asserted inside the floor rect. Would change: green run shows the point hits another slot.

15. Phase 7 round 2: `toRoom` fixed (first task solved by retype, pays 0, then `roomSwitch`); Chromium again not launchable (MachPort); spec + config stay uncommitted; request file has "Round 2 changes". Would change: green run shows other state-dependent targets.

16. Fix step: fixed the geometry in core (`holdPoint` margin) rather than widening `slotAt` or the scene's hit zone: the slot rectangle is what the child sees, so a touch on its very edge missing it is correct; the e2e target must sit inside. Margin step/2 = 10 px covers the ±1.5 px scale rounding. Would change: a device check shows real fingers miss small slots.
17. Phase 7 finish: committed spec + config untouched (proven as is); rows 7.1-7.6 ticked on the orchestrator round-3 evidence; change.md `implemented` with [reviewer]/[visual]/[human] rows still open. Would change: impl-review wants the breaks re-run.
