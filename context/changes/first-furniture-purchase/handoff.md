# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-implement first-furniture-purchase phase 6` (autonomous run 2026-10-13-s09-s11). Phase 6 (variant panel, preview, confirm animation) is committed `d8ca40e`; row 6.3 is the orchestrator's e2e gate (Chromium dies with MachPort here). Row 5.3 is ticked with the orchestrator's evidence.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | docs commits, `d792eee` p1, `59c9253` p2, `94873fd` p3, `314a2a7` p4, `1d58e0e` p5, `d8ca40e` feat(p6), then `docs(first-furniture-purchase): handoff p6` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 20 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/VariantPanel.ts` | tray: 3 thumbnails (slot shape in scale, colour + pattern; chosen = lift + thick border), "Wybieram" (faded and silent without a preview), "Zamknij"; `show(looks, size, preview)`, `hide()`, `thumbTargets/chooseTarget/closeTarget` |
| `src/ui/widgets/RoomView.ts` | furniture drawing extracted to exported `drawLook(g, box, look, scale, radius)`, reused by thumbs and the pop |
| `src/scenes/RoomScene.ts` | `panel: PanelState`; every tap goes through `dispatch` -> `stepPanel`; registry `rooms` then `stars` written only when `bought`; panel open hides task button and "Wróć do notesu"; `celebrate` (pop tween, star burst from a generated `purchase-star` texture, skipped under `prefersReducedMotion()`); `playPurchaseSound()` empty hook; panel closed on `sleep` and `wake`; snapshot has `panel` |
| `src/data/layout.ts` | `ROOM_LAYOUT.thumbs/choose/close`, `ROOM_TOUCH_TARGETS.thumb/choose/close`, `ANIMATION.purchase*` |
| `src/data/pl.ts` | `room.choose` "Wybieram", `room.close` "Zamknij" (teacher read done: imperative, correct) |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `snapshot.room.panel`, `targets.thumbs/choose/close` (room screen only) |
| `tests/layout.test.ts` | new test: panel targets >= 96, inside tray (thumb lift included), disjoint, tray clear of HUD/gear |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 1033 passed (baseline 1032 + 1) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1..E6` | exit 0 each |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | `thumbs.size` 200 -> 80 (staged first): `layout.test.ts` 2 failed, "expected 80 to be greater than or equal to 96"; restored by exact reverse edit (diff clean, 17 passed). Meta: protects the size/containment of the tray; the purchase flow itself is proved by phase 3 unit tests and phase 8 e2e. |
| `npx playwright test` | not runnable in this session (MachPort; 7 failed on launch, 16 not run) — orchestrator gate |

Orchestrator, row 6.3: `npx playwright test` on `d8ca40e`, expect 23 passed (no new spec; existing specs do not open the panel). No e2e break patch this phase (no spec proves the panel yet; phase 8 does).

## 4. Next command

Phase 7 has `Driver: impl`:

`/10x-implement first-furniture-purchase phase 7`

## 5. Open

- Row 6.3 (orchestrator gate); `[reviewer]` 6.4 (teacher read of "Wybieram", "Zamknij", pl.room); `[visual]` 6.5 (panel, preview 1/2/3, after purchase, animation frame, 1440x900 and 1024x768), 6.6 (reduced motion); 5.5 and 4.6 `[visual]`.
- Earlier: `[reviewer]` 2.5, 7.5; `[human]` 7.6-7.10; `[visual]` 6.x above; phase 8 needs Chromium.
- Phase 7 owes DESIGN-GAP rows 31-36 (comments "phase 7" in RoomView, RoomTaskButton, VariantPanel, layout.ts, RoomScene purchase sound).
- Not visually checked: thumbnail aspect for very wide slots (floor/walls 1560x340 shrinks to a thin strip in a 160 px box) — look at it in the 6.5 screenshots.

## 6. Autonomous decisions

- No AskUserQuestion; implemented in this context; committed the planned set only.
- Minor adaptations: `VariantPanel.show` takes the slot size as a second argument (thumbs keep the furniture shape); furniture drawing extracted into `drawLook` instead of duplicating it; pop animation is a temporary graphics drawn with `drawLook` over the slot (scale 1.08 so wide slots stay inside the area).
- Panel is closed on both `sleep` and `wake`; "Wróć do notesu" is hidden/re-armed in `redraw` instead of `refresh`.
- No new e2e spec in this phase (plan: phase 8).
