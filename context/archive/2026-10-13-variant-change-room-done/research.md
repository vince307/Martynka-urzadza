---
date: 2026-10-13T11:57:08+0200
researcher: Claude (autonomous run 2026-10-13-s09-s11, research step)
git_commit: a8deb20
branch: feat/variant-change-room-done
repository: Martynka-urzadza
topic: "S-10 variant-change-room-done: free variant change by hold / change mode, \"Pokój gotowy!\", rooms list with unlock in data, \"poprawki\""
tags: [research, room, variant-panel, long-press, e2e-hook, design-gaps]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: S-10 variant change, room done, rooms list

**Date**: 2026-10-13T11:57:08+0200 · **Git Commit**: a8deb20 · **Branch**: feat/variant-change-room-done

## Research Question

Resolve the eight open unknowns of `change.md` (rows "Roadmap claims vs repo now" and handoff §5): (1) child hold
threshold, (2) slot hit-testing with the floor/walls under furniture, (3) where the change-mode ("poprawki") button sits,
(4) the "Pokój gotowy!" card and rooms list, (5) the data shape of room unlocking, (6) card narration, (7) e2e hook
fields for change mode and the card, plus (8) how a child's hold is driven and tested end to end (UIScene wiring of
`longPress`, e2e `holdTouch`) and how e2e/visual gate reach a finished room. Also: design binding (kit views, gaps, copy)
and the triggered follow-ups F4, F5, V1, V2.

## Summary

- The pure pieces S-10 builds on exist and are small: `longPress` (`src/core/longPress.ts`) is scene-agnostic and takes
  its rules as an argument, so the child hold is a second caller with its own `balance` entry; `stepPanel`
  (`src/core/variantPanel.ts`) only knows "buy the current task" and must gain a change branch that never calls
  `purchase`. Nothing in `src/core` imports `src/data` (checked: `grep` over `src/core` finds no `data` import), so slot
  hit-testing takes the slot boxes as an argument.
- Hit-testing: with the salon geometry (`SALON` + `SALON_PLACEHOLDERS`, `src/data/rooms.ts`), "topmost furnished slot by
  `depth`" works, but the rug is reachable only on narrow strips around the sofa (computed below). Acceptable, and
  change mode (tap) gives a second route.
- Phaser input: `RoomScene` currently has no input under the room area; every hidden widget disables its zone
  (`VariantPanel.hide`, `PageButton.hide`), and `UIScene` has no full-screen zone (its class comment). A single
  interactive zone over `ROOM_LAYOUT.area`, created before the buttons, receives the hold without stealing taps from them.
- Canvas cards in this codebase do not hold the input switch: `UnlockCard` in `TaskScene` and `VariantPanel` in
  `RoomScene` never call `openInputSession`; only DOM overlays do (`UIScene.openSettings`, `WelcomeScene`). The
  "Pokój gotowy!" card as a canvas card follows the same rule; the slice rule "every overlay holds the switch" applies
  to DOM overlays.
- E2E: a hold is driven by `holdTouch` (`tests/e2e/support/hook.ts`, raw CDP `Input.dispatchTouchEvent`), coordinates
  come from `window.__martynkaE2E.targets` (`src/testing/e2eHook.ts`). There is no star seam: the finished salon costs
  5+6+…+15 = 96 stars, about 14 clean rounds at 7 stars (`balance.round`: 1 per task + 2 bonus). The plan must pick a
  route to the finished room for e2e and the visual gate (recommendation below).
- The bound kit (`designs/martynka-maths-A-v1`) has no hold, change mode, room-done card or rooms list → DESIGN-GAP rows
  37+. A non-bound pack in `designs/` (`martynka-evolution-v1/preview.js`) does show a finished room as a status line
  "Pokój gotowy!" with buttons "Wygląd" and "Notes": a usable precedent for copy, not a source of truth (profile §6
  binds only `martynka-maths-A-v1`).

## Detailed Findings

### 1. Child hold threshold (unknown 1)

- `longPress(state, event, rules)` with `LongPressRules { holdMs, moveTolerance }` (`src/core/longPress.ts`): time comes
  from the event (`down.now`, `tick.now`); fires once per gesture; a second finger, `cancel` or `reset` ends it.
- Only caller: `UIScene.feed` passes `balance.parentSettings` (`src/data/balance.ts`: `holdMs: 2000, moveTolerance: 30`),
  whose comment states 2 s is chosen to be "longer than a child's ordinary press" (PRD US-03 / FR-015).
- PRD FR-018 says "krótkim przytrzymaniu mebla"; no number anywhere (PRD, plan §7, test-plan). Platform defaults for a
  long press (general knowledge, not repo evidence): Android `ViewConfiguration` long-press timeout 400–500 ms, iOS
  `UILongPressGestureRecognizer.minimumPressDuration` 0.5 s.
- **Recommendation:** new entry `balance.roomHold = { holdMs: 600, moveTolerance: 40 }` (600 ms: above platform defaults
  so a slow child tap stays a tap; 40 game px ≈ 21 CSS px at 1024 wide, a little looser than the adult's 30 because a
  child's finger rolls). `[human]` device row to tune; numbers live in data, so tuning needs no code.
- Feedback while holding: DESIGN-GAP row 28 chose "no feedback" for the gear on purpose (adult-only). For the child the
  opposite is wanted (plan §9: nothing by colour or sound alone; discoverability). Recommend a static highlight of the
  held slot (thick outline, no motion → no reduce-motion branch) drawn while `hold.kind === 'holding'`; new gap row.

### 2. Wiring the hold in `RoomScene` (unknown 8, part 1)

- Pattern to mirror: `UIScene` — `hold: LongPressState = IDLE`; `SettingsIcon` zone forwards `pointerdown` →
  `{type:'down', now: this.time.now}`, `pointerup` → `up` or `cancel` (`pointer.wasCanceled`), `pointerout` → `cancel`;
  scene-level `this.input.on('pointermove')` → `move`; `update()` feeds `tick` with `this.time.now` while holding;
  on fire it resets `hold` to `IDLE`.
- Zones and order in `RoomScene.create`: `RoomView` (graphics, no input — class comment "It takes no input"), then
  `RoomTaskButton` zone, `VariantPanel` zones, `PageButton` zone. Hidden widgets disable input: `VariantPanel.hide`
  sets `z.input.enabled = false` on every thumb/choose/close zone; `PageButton.hide` likewise. Geometry
  (`ROOM_LAYOUT`): area `left 180, top 204, 1560×656` (bottom 860); task button and resume start at `top 892`, so with
  the panel closed no room button overlaps the area; with the panel open the tray (`top 780`) overlaps the area's bottom
  80 px, and the panel zones are on top.
- A hold that fires while the finger is still down opens the panel; the finger then lifts possibly over a thumbnail.
  `VariantPanel` buttons fire only on `pointerup` after a `pointerdown` on the same zone (`pressed === key`), and
  `PageButton`/`RoomTaskButton` follow the same rule (their comments), so the lift does not pick. Keep it that way.
- Reset points the plan must cover: `sleep` (scene switch), the panel opening, the card showing, and input suspension by
  the parent's DOM dialog. `createInputSuspender(…, onRelease)` in `src/main.ts` resets all pointers on release, so a
  held finger would never send `up`; `RoomScene.update` should tick only when
  `!(registry inputSuspender).suspended()` and otherwise feed `cancel`.
- Global top-only across scenes: `UIScene` sits above; its comment states input is only on the speaker, switch and gear,
  "otherwise Phaser would stop a tap from reaching the task scene below". None of those three overlaps the room area
  (`HUD_LAYOUT`: speaker/roomSwitch at `top 44`, settings at `left 1782, top 952`; `tests/layout.test.ts` "keeps the
  parent settings icon … outside the notebook and the room area").

### 3. Slot hit-testing (unknown 2)

- Slot geometry: `SlotDef { x, y, depth }` centres (`src/core/types.ts`), sizes only in `SALON_PLACEHOLDERS`
  (`src/data/rooms.ts`), boxes computed inline in `RoomView.render`. Boxes (left..right × top..bottom):
  floor 180..1740 × 520..860 (d0), walls 180..1740 × 204..520 (d1), rug 610..1310 × 640..760 (d2),
  curtains 500..700 × 210..510, picture 960..1200 × 240..420, shelf 1250..1550 × 280..380 (d3),
  lamp 290..390 × 380..740, table 1330..1570 × 580..720, plant 1570..1710 × 480..760 (d4), sofa 720..1280 × 480..720 (d5).
- Floor + walls tile the whole room area, so after tasks 1–2 every point in the area is "on" a furnished slot. That is
  acceptable (holding bare floor changes the floor) and is what a child expects.
- Rug vs sofa: the sofa (depth 5) covers the rug's middle; the rug is reachable at y 720..760 under the sofa (40 px
  strip, 560 wide) and on the side strips x 610..720 and 1280..1310 (110×120 and 30×120). The left strip is ≥ 96 px
  wide, so the rug stays holdable; change mode (tap) has the same reach. Placeholders vanish in S-16, where art
  hit areas get redone anyway.
- Ties: curtains/picture/shelf share depth 3 but do not overlap each other; lamp/table/plant share depth 4 and
  table 1330..1570 vs plant 1570..1710 touch at x 1570 only. A deterministic tie-break (later in `room.slots`) is enough.
- **Recommendation:** pure `slotAt(room, sizes, chosen, point): string | null` in `src/core/rooms.ts` (or a new
  `core/roomHit.ts`), `sizes: Record<string, {width,height}>` passed in (core never imports data); only furnished slots
  (`chosen[id] !== undefined`) count; highest `depth`, then later index. Shared box helper so `RoomView.render` and
  the hit test cannot drift. Unit tests: rug strips, sofa over rug, empty slot ignored, outside area → null.

### 4. Variant panel change branch (decision 1 of change.md, confirmed feasible)

- `stepPanel` today: `closed` + `open` event opens only `currentTask` when affordable; an open panel whose `taskId` is no
  longer current closes as stale; `confirm` calls `purchase` and returns `bought`. `RoomScene.dispatch` writes
  `rooms` and `stars` only when `step.bought` is set; `RoomScene.redraw` takes the preview slot from `currentTask`.
- Consumers of `PanelState` that must learn the new variant: `RoomScene.redraw` (preview slot, which placeholder the
  panel shows), `RoomScene.snapshot` (copies `panel` verbatim), `tests/variantPanel.test.ts`,
  `tests/e2e/room-purchase.spec.ts` (`panel.kind`, `panel.preview`). No exhaustive `switch` on `PanelState.kind`
  exists in `src/` (only `kind === 'open'` checks), so adding `mode: 'buy' | 'change'` plus `slot` is low-risk.
- **Recommendation:** `{ kind: 'open'; mode: 'buy'; taskId; slot; preview } | { kind: 'open'; mode: 'change'; slot;
  preview }`, event `{ type: 'change'; slot }` accepted only when closed and the slot is furnished; change `confirm`
  writes `chosen[slot]` and returns `stars` untouched plus a `changed` result (not `bought`), so the scene's
  "write stars" branch cannot fire. Keep `preview: null` and "Wybieram" unarmed until a thumbnail is tapped, same as
  buying (one rule for the child); confirming the current variant is a harmless no-op. Re-run `RoomScene.celebrate`
  (pop + stars) on a change (needed for V2); under reduce motion nothing (existing rule).
- Test-plan risk #16 gets a property: over any event sequence in change mode `stars` and `tasksDone` are unchanged.

### 5. Change mode button and "poprawki" (unknown 3)

- After the 10th purchase `taskButtonView` returns `null` and `RoomTaskButton.show(null)` hides the button, leaving
  `ROOM_LAYOUT.taskButton` (`left 900, top 892, 720×128`) empty. That slot is free exactly when the room is done.
- `tests/layout.test.ts` already checks room targets ≥ 96 px, inside the scene, apart from each other, the gear and the
  HUD ("keeps the room touch targets …") and "Wybieram" clear of the task button; a change-mode button in the task
  button's rectangle reuses both checks if it is listed in `ROOM_TOUCH_TARGETS`.
- Precedent outside the bound kit: `designs/martynka-evolution-v1/preview.js` shows, for a finished room,
  `Pokój gotowy!` (status line) + button `Wygląd` (opens the variant chooser) + `Notes`. Copy candidates: "Wygląd" or
  "Zmień wygląd" for entering change mode, "Gotowe" for leaving it. Not binding (profile §6) → DESIGN-GAP + teacher read.
- **Recommendation:** as change.md decision 3 — a button in the task-button rectangle shown only when the room is done;
  in change mode a tap on a furnished slot opens the panel (same `change` event), and the same button reads "Gotowe" to
  leave. The hold works in both modes and before the room is done.

### 6. "Pokój gotowy!" card and rooms list (unknowns 4, 5)

- Pattern: `UnlockCard` (`src/ui/widgets/UnlockCard.ts`) with `UNLOCK_LAYOUT` (card `388,284 1144×660`, title, art
  `200` px, button `735,793 450×108`); `TaskScene` shows it from state (`unlockShown`, `learner.pendingUnlock`) and sets
  narration `pl.unlock.spoken(name)`. Copy `pl.unlock` = `title`, `next`, `spoken`.
- Room unlocking: `RoomDef` (plan §5, `src/core/types.ts`) has no unlock field; `SaveState`/`RoomState` have no
  "unlocked" or "done" flag; `ROOMS` has one entry; `pl.room.name = 'Salon'` is drawn nowhere (F4).
- PRD FR-019 / plan §7: "lista pokoi (miniatury) ma w v1 jedną pozycję (salon) i zapowiedź; mechanika odblokowania
  kolejnego pokoju istnieje w danych". "Done" is derivable: `state.tasksDone >= room.tasks.length`
  (`currentTask` returns `null` then).
- **Recommendation (data shape):** `ROOM_ORDER` in `src/data/rooms.ts`, e.g.
  `[{ room: 'salon' }, { teaser: true, unlockAfter: 'salon' }]` typed in `core/types.ts` (new `RoomListEntry`, no change
  to plan-§5 `RoomDef`), and pure `roomsListView(order, rooms, states)` → per entry `{ id?, done, locked, teaser }`.
  Test: salon done → teaser entry unlocked (still not enterable, no room exists). No save field needed (decision 6
  holds): everything derives from `RoomState`.
- **Card trigger:** on the purchase that makes the room done (`bought` and `currentTask === null` after it), after the
  celebrate pop (delay = `ANIMATION.purchasePopMs`, 0 under reduce motion). Showing it only on that event needs no
  "seen" flag; on later visits the room shows the change-mode button instead. Card content: title, rooms list (salon
  thumbnail drawn from the current `chosen` via `drawLook` scaled + teaser tile "Wkrótce"-style), one primary button
  closing the card (to the room in change mode or plain room — plan decides). While the card is up, the hold zone and
  the room buttons are off; "Wróć do notesu" may stay visible only if it does not overlap the card (`UNLOCK_LAYOUT.card`
  ends at y 944, resume starts at 892 → overlap; hide it while the card is open, as the panel does).
- A separate rooms-list view outside the card is not required by FR-019; recommend none in v1 (one room).

### 7. Narration (unknown 6)

- `RoomScene.redraw` sets `REGISTRY_KEYS.narration` to the task label or `null`; `UIScene` shows the speaker only when
  narration is non-null and the narrator is available. After the room is done narration becomes `null` (no task), so the
  speaker hides today.
- `TaskScene.autoReadUnlock` speaks the card only when auto-read is on and after a user gesture.
- **Recommendation:** while the card is open set narration to a new `pl.room.done.spoken` (e.g. "Pokój gotowy!"); the
  speaker reads it on tap. Auto-read on show is optional: the card appears right after the child's tap on "Wybieram"
  (a gesture), so auto-read is allowed if `effectiveAutoRead` says so — mirror `autoReadUnlock`. Gap row like 23/36.

### 8. E2E hook and tests (unknowns 7, 8 part 2)

- Hook: `installE2EHook` (`src/testing/e2eHook.ts`) exposes frozen `snapshot` (`room: RoomScene.snapshot()` while the
  room is active) and `targets` (room: `resume`, `taskButton`, `thumbs`, `choose`, `close`). Guard:
  `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS = ['__martynkaE2E','e2eMonth','e2eFail','e2e-forced-failure']` (absent from
  `dist/`, all required in `dist-e2e/`).
- Room snapshot fields today (`RoomSnapshot`): `roomId, tasksDone, chosen, currentTask, affordable, buttonText, panel`.
  **Add (read-only):** `mode` (`'normal' | 'change'`), `done: boolean`, `card: { title, entries } | null`,
  `hold: 'idle' | 'holding'` (lets a spec assert that a short press did not start/finish anything), and targets
  `slots: Record<string, Point>` (a holdable point per furnished slot, from the same box helper — for the rug the
  left strip, not the centre), `modeButton`, `cardButton`. Also fixes F5 (use `this.room()` in `snapshot`).
- Driving a hold: `holdTouch(page, point, ms, drift)` (`tests/e2e/support/hook.ts`) — CDP `touchStart`, optional 5
  `touchMove` steps, `waitForTimeout(ms)`, `touchEnd`; `parent-settings.spec.ts` defines `HOLD_MS`/`DRIFT` locally
  (and `support/welcome.ts` duplicates them). Specs already import data modules (`adaptive.spec.ts` imports
  `src/data/curriculum/E4`, `error-boundary.spec.ts` imports `src/data/pl`), so the room spec can derive its hold
  times from `balance.roomHold` instead of duplicating numbers.
  The spec belongs to the `chromium-hook` project: add its file name to `ROUND_SPEC` in `playwright.config.ts`.
- Reaching states: `room-purchase.spec.ts` earns stars by playing clean rounds (`MAX_ROUNDS = 4`, `test.setTimeout(120_000)`).
  One floor purchase (5 stars, one round) suffices for "hold → change → stars unchanged". The finished room needs 96
  stars ≈ 14 clean rounds; there is no seam (`main.ts` sets `REGISTRY_KEYS.stars` to 0, only `e2eMonth`/`e2eFail`
  query params exist).
- **Recommendation:** add `?e2eStars=N` parsed in `src/testing/e2eHook.ts` (pure parser like `e2eMonth`), applied in
  `main.ts` under `__E2E_HOOK__` to the initial `REGISTRY_KEYS.stars`, and the marker `e2eStars` in
  `E2E_HOOK_MARKERS` + `tests/e2eHookGuard.test.ts`. It does not write IndexedDB (profile §9 rule), the purchases still
  go through the real touch path, and the visual gate (V2 rug pop = 5 purchases, 35 stars; room-done card = 96) uses it
  too. Rejected alternative: 14 rounds in a spec (slow, flaky under the 120 s budget). Product decision → `[human]` row.
- Note (profile §8): subagents may not run `npx playwright`; e2e phases use the request-file protocol.

## Code References

- `src/core/longPress.ts` `longPress`, `LongPressRules`, `IDLE` — reducer reused by the child hold.
- `src/scenes/UIScene.ts` `UIScene.create` (SettingsIcon handlers, `pointermove`), `update`, `feed`, `openSettings` — wiring to mirror.
- `src/ui/widgets/SettingsIcon.ts` `SettingsIcon` — zone → down/up/out handlers.
- `src/core/variantPanel.ts` `stepPanel`, `PanelState`, `PanelEvent` — gains the change branch.
- `src/core/rooms.ts` `currentTask`, `taskButtonView`, `purchase` — "done" is `currentTask === null`.
- `src/scenes/RoomScene.ts` `dispatch`, `redraw`, `celebrate`, `snapshot`, `room` — scene changes; F5 in `snapshot`.
- `src/ui/widgets/RoomView.ts` `RoomView.render`, `slotCenter`, `drawLook` — boxes, captions at slot centre (V1).
- `src/ui/widgets/VariantPanel.ts` `hide` (zones disabled), press-then-release rule.
- `src/ui/widgets/UnlockCard.ts`, `src/data/layout.ts` `UNLOCK_LAYOUT`, `ROOM_LAYOUT`, `ROOM_TOUCH_TARGETS`, `HUD_LAYOUT`.
- `src/data/rooms.ts` `SALON`, `SALON_PLACEHOLDERS`, `ROOMS`, `FIRST_ROOM`; `src/data/pl.ts` `pl.room`, `pl.unlock`.
- `src/data/balance.ts` `balance.parentSettings` (adult hold), `balance.round` (stars per round).
- `src/core/inputSuspend.ts` `createInputSuspender`, `openInputSession`; `src/main.ts` (registry init, suspender with pointer reset).
- `src/testing/e2eHook.ts` `installE2EHook`, `e2eMonth`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`.
- `tests/e2e/support/hook.ts` `holdTouch`, `toPage`, `tapTarget`; `tests/e2e/parent-settings.spec.ts`; `tests/e2e/room-purchase.spec.ts`; `playwright.config.ts` `ROUND_SPEC`.
- `tests/layout.test.ts` room target cases; `tests/variantPanel.test.ts`; `tests/rooms.test.ts`; `tests/roomsData.test.ts`.

## Architecture Insights

- One reducer per spending path: keeping change mode inside `stepPanel` keeps "the only way the scene spends stars"
  (file comment) true, provided the change branch returns no `bought`.
- Core takes data as arguments (no `src/core` → `src/data` imports today); hit-testing follows that.
- Canvas overlays coordinate by scene state, DOM overlays by the input switch; the room card is canvas.
- V1 (caption collisions): captions are drawn at `slot.x, slot.y`; floor (960,690) vs rug (960,700) and walls (960,362)
  vs picture (1080,330) collide. Fix: optional caption anchor per slot in `SALON_PLACEHOLDERS` (e.g. floor caption at
  its bottom-left, walls at top-left) + a layout test that caption boxes of all slots do not intersect.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md` — S-10 triggers: hold + "Pokój
  gotowy!", F4, F5, V1, V2 (scope agreed in change.md; all supported by the code read above).
- S-08 (`parent-settings`) — `longPress` design (loop clock, one finger), gap row 28 "no hold feedback" for adults only.
- S-09 — impl-review F1 (double tap after purchase) solved by geometry; the change-mode button must keep that rule.

## Related Research

- `context/archive/2026-10-13-first-furniture-purchase/research.md` (purchase flow and panel).

## Open Questions

- Product (plan decides, `[human]` rows): hold numbers (600 ms / 40 px recommended); `e2eStars` seam; the card's
  button target (plain room vs change mode); auto-read of the card; copy ("Wygląd"/"Gotowe"/teaser line).
- DESIGN-GAP rows to add (37+): hold feedback, change-mode button and state, room-done card, rooms list with teaser,
  card narration.
- None on code structure; the remaining items are product choices listed above.
