# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-implement first-furniture-purchase phase 5` (autonomous run 2026-10-13-s09-s11). Phase 5 (salon in the room and the task button) is committed `1d58e0e`; row 5.3 is the orchestrator's gate (Chromium dies with MachPort here). Rows 4.3 and 4.4 are now ticked with the orchestrator's evidence.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | docs commits, `d792eee` p1, `59c9253` p2, `94873fd` p3, `314a2a7` p4, `1d58e0e` feat(p5), then this `docs(first-furniture-purchase): handoff p5` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 24 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/RoomView.ts` | draws walls/floor and the 10 slots by depth (dashed outline when empty, colour + pattern + caption when furnished or previewed); `render(room, state, preview)`, `slotCenter` |
| `src/ui/widgets/RoomTaskButton.ts` | current task button (`show(view|null)`, `onTap(affordable)`, `target()`, `text()`); faded with "masz X/Y" when short |
| `src/scenes/RoomScene.ts` | reads `stars`/`rooms`/`currentRoom` from the registry, redraws on create, `wake` and `changedata-stars` (only while active); short tap → `scene.switch(task)`, affordable tap does nothing yet (phase 6); sets `narration` to the task label; `snapshot()`, `taskButtonTarget()` |
| `src/data/layout.ts` | `ROOM_LAYOUT.panel`/`caption` removed, `taskButton` and `slot` extended, new `ROOM_TOUCH_TARGETS` (`resume` moved out of `TASK_TOUCH_TARGETS`) |
| `src/data/pl.ts` | `room.caption` removed (no new strings) |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `snapshot.room`, `targets.taskButton` (room screen only) |
| `tests/layout.test.ts` | the two `ROOM_LAYOUT.panel` tests rewritten (area / `ROOM_TOUCH_TARGETS`); the room targets test replaces the old resume test |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 1032 passed (baseline 1032 at p4, +0: one old test replaced by the new targets test) |
| `npm run build` | OK, `e2e hook: absent` |
| `npm run sample -- E1` | exit 0 |
| `grep room.caption src tests` | empty |
| Deliberate break | `taskButton.left` 900 → 1200 (inside the scene, on the gear): `layout.test.ts` red, "expected true to be false" on the overlap check; restored with `git checkout`. First try, left 1700, went red only on the scene bound (wrong break), so redone. |
| `npx playwright test` | not runnable in this session (MachPort: 7 failed on browser launch, 16 not run) — orchestrator gate |

Orchestrator, row 5.3: `npx playwright test` on `1d58e0e`, expect 23 passed (`task-round.spec.ts` still taps "Wróć do notesu" through `targets.resume`; no new spec this phase).

## 4. Next command

Phase 6 has `Driver: impl`:

`/10x-implement first-furniture-purchase phase 6`

## 5. Open

- Row 5.3 (orchestrator gate); 5.5 `[visual]` (salon with 0 stars "masz 0/5", with 7 stars, speaker in the room, 1440x900 and 1024x768) and 4.6 `[visual]`.
- Earlier: `[reviewer]` 2.5, 6.4, 7.5; `[human]` 7.6-7.10; `[visual]` 6.5, 6.6; phase 8 needs Chromium.
- DESIGN-GAP rows for the room view / task button / slots are written in phase 7 (comments in code say "phase 7").

## 6. Autonomous decisions

- No AskUserQuestion; implemented in this context; committed the planned set only.
- Minor: the sort of `ROOM_LAYOUT.slot` and `taskButton` extra fields (radius, insets) live in layout data; `RoomTaskButton.text()` added for the hook's `buttonText`.
- Affordable tap is a no-op until phase 6 (plan).
- Narration is set in `redraw` (create, wake, stars change while the room is active); `TaskScene.onWake` overwrites it on return.
- Mistake caught: a `git checkout -- src/data/layout.ts` after the first break reverted my unstaged layout edits; redone and staged before the second break.
