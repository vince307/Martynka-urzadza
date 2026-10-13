<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Pierwszy mebel za gwiazdki — salon, zadanie remontowe i wybór 1 z 3 wariantów

- **Plan**: context/changes/first-furniture-purchase/plan.md
- **Mode**: Deep (code checks done directly with targeted reads/greps instead of a sub-agent; the risky claims were few and local)
- **Date**: 2026-10-13
- **Verdict**: SOUND after fixes (was REVISE)
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2 — fixed in plan) |
| Plan Completeness | WARNING (F3 — fixed in plan) |

## Grounding

Grounding: 13/13 paths ✓ (`src/main.ts`, `src/scenes/{TaskScene,RoomScene,UIScene}.ts`, `src/testing/e2eHook.ts`,
`tests/e2e/support/{hook,welcome}.ts`, `tests/layout.test.ts`, `tests/summary.test.ts`, `playwright.config.ts`,
`src/data/{layout,pl}.ts`, `src/core/types.ts`, `docs/design-gaps.md`), 14/14 symbols ✓ (`TaskScene.sessionStars`,
`syncStars`, `beginRound`, `applyParentStage`, `currentSummary` with `nextRoomTaskCost: null`, `flyStar`, `create` setting
`REGISTRY_KEYS.stars` to 0, `main.ts` `preBoot`, `UIScene` `changedata-stars` / `refreshSpeaker` on narration,
`installE2EHook` `inRoom()`, `ROUND_SPEC` in `playwright.config.ts`, `passWelcome`, `RoomTaskDef.label` "text key",
`HUD_LAYOUT.settings` 1782…), brief↔plan ✓.

Claims checked against the code:
- `TaskScene` is never restarted: only `BootScene.create` / `WelcomeScene` call `scene.start(task)`; no `scene.restart` — moving
  the balance init to `preBoot` is safe. ✓
- Delta model: `task-round.spec.ts` asserts `starsTotal === i + 1` per task, so the phase-4 break (adding `starsEarned` instead
  of the delta) goes red on the second paid answer. ✓
- Speaker in the room: `UIScene.refreshSpeaker` shows the speaker for any non-empty `REGISTRY_KEYS.narration`; `TaskScene`'s
  `toRoom` handler sets it to `null` before `scene.switch`, `onWake` → `render` rewrites it — the room can set its label in
  between. No e2e spec asserts a hidden speaker in the room. ✓
- Boundary rules: `src/data/**` may import `core` only for `core/text/*` and types (`eslint.config.mjs`); `src/core` has no
  `src/data` imports today — `taskButtonView` returns the label key and the scene resolves it via `pl`. ✓
- Driver lines: 1–3 `tdd` (modules absent, failing tests lead), 4–7 `impl` (glue, UI, docs; seam-sweep row 7.5 in the last impl
  phase), 8 `e2e` after the seam sweep, feature built in 4–6, risk #16 exists in `context/foundation/test-plan.md`. All right.
- Triggered follow-ups (`Trigger: S-09`): `nextRoomTaskCost` (phase 4) and the in-flight star (phase 4) included; shared HUD
  button deferred convincingly (no HUD button changes, Trigger kept open); FR-011 switch and hook `null` targets already done.
- PRD: FR-016/FR-017/US-02 covered; deviations (no sound, session-only state, author-made salon content, UX choices) each have a
  `[human]` row (7.6–7.9). No decision overturned.
- Sizing: each phase ≤ 2 new UI components, independently green (phase 5 leaves the affordable tap a no-op until phase 6).

## Findings

### F1 — e2e #16 double tap can pass vacuously

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 8 — spec intent and deliberate break 1
- **Detail**: The spec required only `S ≥ 5` before the two fast taps on „Wybieram”. A second purchase needs the next task's
  cost (6) too, so with `5 ≤ S < 11` a double-purchase bug is refused as `short` and the assertion `stars === S - 5` passes
  regardless — the key risk-#16 claim (and the phase-8 deliberate break) would prove nothing. The multi-round play to reach
  `S` can also hit the „Nowa umiejętność!” card between rounds (`pendingUnlock`), which the spec did not handle.
- **Fix**: Spec plays rounds until `S ≥ cost(task 1) + cost(task 2)` (from `SALON.tasks`) and asserts that precondition
  explicitly; taps `unlockNext` when `screen === 'unlock'` between rounds.
- **Decision**: FIXED (plan.md phase 8 Intent, Known risks)

### F2 — No stale-panel guard in the reducer; phase-8 break would stop proving the seam

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 — `stepPanel`; Phase 8 — deliberate break 1
- **Detail**: `stepPanel` `confirm` purchased `currentTask(room, state)` whatever `panel.taskId` said, so a panel left open for
  an already bought task (a scene seam slip, or S-10 reusing the panel) would buy the next task with the old preview. Adding
  the guard (confirm/pick on a panel whose `taskId` ≠ current task → `closed`, no purchase) is cheap defence in depth — but it
  neutralises the planned phase-8 break („scene keeps the stale `open` panel”), which would then stay green.
- **Fix**: Phase 3 reducer + tests gain the stale-panel guard; phase-8 break 1 becomes „the scene's „Wybieram” handler bypasses
  `stepPanel` and calls `purchase` directly on every tap”, which still turns the spec red (with F1's `S ≥ 11`).
  - Strength: the reducer is the single guard against double purchase from any caller; the e2e break targets the real seam.
  - Tradeoff: one more reducer branch and test case.
  - Confidence: HIGH — follows directly from the contract `stepPanel(panel, event, ctx)`.
  - Blind spot: none significant.
- **Decision**: FIXED (plan.md phase 3 Intent + tests, phase 8 break 1, Progress 8.2, Known risks)

### F3 — Phase 5 silently breaks two existing layout tests

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 — Scena i układ
- **Detail**: Phase 5 removes the turquoise panel; `tests/layout.test.ts` uses `ROOM_LAYOUT.panel` in „keeps the parent settings
  icon … outside the notebook and the room panel” and „keeps the room placeholder's way back a touch target inside the room
  panel”. The plan did not name them, so a fresh agent might delete the gear-vs-room protection instead of moving it.
- **Fix**: Phase 5 rewrites both against `ROOM_LAYOUT.area` / `ROOM_TOUCH_TARGETS` (not deleted); criterion and Progress 5.1 say so.
- **Decision**: FIXED (plan.md phase 5 Intent, criterion, Progress 5.1)

### F4 — Phase 2 as `tdd` for content

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 2
- **Detail**: Asked by the plan (decision 13). Kept `tdd`: `src/data/rooms.ts` is absent and a failing invariants test
  (counts, cost range, pattern variety, geometry above the tray) leads the data, same pattern as `tests/contentInvariants.test.ts`.
- **Decision**: RECORDED

### F5 — Phase 4's deliberate break needs Chromium

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 — criterion 4.4
- **Detail**: Only e2e catches the delta break (scene seam). The plan already routes it to the orchestrator through the
  request-file protocol when Chromium is unavailable in the agent session (profile § 8). No change.
- **Decision**: RECORDED

### F6 — Phase 2 moves `ROOM_LAYOUT.resume` before the room is redrawn

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 2 — Paleta i geometria
- **Detail**: Between phases 2 and 5 „Wróć do notesu” sits at left 240 on the old placeholder panel; still inside the panel
  (180–1740), so the existing layout test and `task-round.spec.ts` (via `targets.resume`) stay green. Harmless; noted so the
  phase-2 agent does not „fix” it.
- **Decision**: RECORDED

VERDICT: PROCEED — approach sound and grounded in the code; one critical (vacuous e2e double-tap) and two warnings fixed in plan.md, drivers correct, follow-ups and PRD deviations covered.
