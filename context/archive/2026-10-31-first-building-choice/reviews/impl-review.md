<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: "Co urządzamy najpierw?" (Dom or Baza kosmiczna) and the Mostek module

- **Plan**: context/changes/first-building-choice/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-11-01
- **Verdict**: APPROVED (after the fixes below)
- **Findings**: 0 critical, 6 warnings (4 fixed: F1, F2, F3, F5; 2 recorded as follow-ups: F4, F6), 6 observations

Run 2026-10-31-space-base, step impl-review, autonomous (no `AskUserQuestion`; triage decided in place per the agent contract).
Two review subagents (plan drift; safety, quality and patterns) read the diff `fc13e8c..HEAD`; every finding below was re-checked
against the code by the reviewer before triage.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (two documented deviations, harmless: `buildingStart` without `stars`, now pinned equal to `freshSession`; p6 extras needed by the plan's own intent) |
| Scope Discipline | PASS |
| Safety & Quality | WARNING (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites (re-run by the reviewer)

| suite | result | vs baseline |
|---|---|---|
| `npm run lint` | OK (before and after the fixes) | = |
| `npm run typecheck` | OK (before and after) | = |
| `npm test` at `ff22e33` | `Tests  4168 passed (4168)` | 4092 + 76 (the slice) |
| `npm test` after the review fixes | `Tests  4170 passed (4170)` | 4092 + 78 (+2: `roomArtLoader` re-queue case, `buildingStart` = `freshSession` case) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK | = |
| `npm run sample -- E1` … `E6` | all six exit 0 | = |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` (before and after) | = |
| `npx playwright test --list` | `Total: 184 tests in 48 files` | 179 + 5 (the phase-9 spec) |
| full e2e `npx playwright test --workers=3` at `ff22e33` (load average 20-43) | `7 failed` / `177 passed (38.8m)`: 6 timeouts or `screen` still `loading` (adaptive #13, money-pay #11 x2, save-backup-health SV2-04, save-transfer #10, stale-tab B-1 x2) | |
| `npx playwright test --last-failed --workers=1` (with the review fixes) | `6 passed (6.6m)`, `1 failed` (money-pay #11 fewest-coins: phase `done` after "Dalej", a known load flake in profile § 8) | |
| `npx playwright test tests/e2e/money-pay.spec.ts --workers=1` | `4 passed (1.8m)` | |
| `first-launch.spec.ts` + `first-building-choice.spec.ts` after the fixes, `--workers=2` | `12 passed (3.5m)` | |

e2e reconciliation: 184 = 177 passed + 7 re-judged green (6 in `--last-failed`, money-pay #11 alone); the 12 tests of the two specs the fixes touch are green on the fixed code.

## Deliberate breaks re-executed

- **Break C (phase 9 named)**: `TaskScene.renderThemeBack` shows "Wróć" without asking (`true || themeBackOffered(…)`) → `first-building-choice.spec.ts` "#12 S-28 FR-043" red alone (`-g "FR-043"`): `expect(received).toBeNull()`, `Received: {"x": 90, "y": 928}` at line 72 (`themeBack` still there after the first round); restored → green in the 12-test run. The spec does not survive its named break.
- **Break for review fix F2**: `backToChoice` back to `fromAge: false` → first-launch "#12 "Wróć" returns to the building choice…" red: `expect(received).not.toBeNull()`, `Received: null` (no `choiceBack`); restored → green.
- **Break for review fix F1** (unit): the new `tests/roomArtLoader.test.ts` case ran red against the unfixed `attachLoader` (1 failed / 9 passed), green after.
- **tdd phase 1 RED**: see below (`hasPurchase`).

## Checks the step prompt asked for

- **Frozen fixtures**: `git diff --stat fc13e8c -- tests/fixtures` shows only three ADDED files (`room-art-bridge.json`, `save-v5-salon.json`, `save-v6.json`); every older fixture is byte-unchanged.
- **v5 save loads into the house**: `tests/saveV6.test.ts` (`decodeSave(save-v5-salon)` → `migratedFrom: 5`, house `house-1`), `tests/fixtureLoadPath.test.ts` (real load path: `house-1`, `currentRoom 'salon'`, `needsPlacement` false) and the e2e `#2 S-28 FR-049` (first screen `task`, stars 17, salon `tasksDone 4`, written version 6).
- **Migration**: `LIFT_V5_BUILDING` (`src/core/migrations/building.ts`) is a shallow spread plus `version: 6`, imports nothing; source guard in `tests/saveV6.test.ts`.
- **Rollback note**: `deploy/README.md` § 6, "Uwaga (format v6, first-building-choice)" present; `git diff fc13e8c -- deploy/` touches only `deploy/README.md`.
- **Hooks**: no bypass. `.claude/settings.json` mtime 2026-10-10, `.claude/hooks/*` 2026-10-10/12 (before the branch); no `--no-verify` in any commit message of `fc13e8c..HEAD`.
- **tdd RED re-executed (phase 1)**: `hasPurchase` made to require `tasksDone > 99` → `tests/themeBack.test.ts` 2 failed / 8 passed ("is true when any room has a task done", "is gone for a room with a purchase"); restored → 10 passed. The RED names real assertions and needs the production term.
- **Teacher read (row 3.7)**: Mostek copy in `src/data/pl.ts` and `src/data/rooms.ts`. Task labels imperative + accusative: "Postaw pulpit", "Postaw fotel pilota", "Ustaw teleskop", "Postaw regał z planetami", "Połóż matę orbitalną", "Ustaw kapsułę roślinną"; the stage reuses "Odnów ściany i podłogę" (fits a module). Slot captions nominative; variant names agree in gender (Naturalny/Słoneczny/Miętowy for pulpit, fotel, teleskop, regał; Naturalna/Słoneczna/Miętowa for mata, kapsuła). Choice copy: "Co urządzamy najpierw?", "Dom", "Baza kosmiczna", spoken "Co urządzamy najpierw: dom czy bazę kosmiczną?" (accusative `bazę` correct), "Wróć". No numerals, short. `git diff fc13e8c -- src/data/curriculum src/data/wordTemplates.ts src/data/nouns.ts src/core/tasks src/data/balance.ts` empty, so `sample` output is unchanged (all six stages exit 0). PASS.
- **Follow-ups file verified against sources**: entries re-read against `context/archive/2026-10-30-rooms-as-data`, `2026-10-31-kitchen-room`, `2026-10-21-post-run-polish`, `2026-10-24-audit-backdrop-fox`, `2026-10-22-notebook-polish`, `2026-10-15-salon-load-health`, `2026-10-14-art-stand-in-and-load-signal`, `2026-10-14-minigame-daily-puzzle` follow-ups. Five were inaccurate and are corrected (F5 below).

## Findings

### F1 — Room art stays pending forever after "Wróć" mid-load

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/ui/roomArtLoader.ts `createRoomArtLoader` `attachLoader`; src/scenes/UIScene.ts `create`; src/scenes/TaskScene.ts `backToChoice`
- **Detail**: On a fresh install the chosen room now loads on the UIScene loader during the first round. `backToChoice` stops UIScene; Phaser 4.2.1 `LoaderPlugin.shutdown` runs `reset()` and `removeAllListeners()`, so `onComplete` never fires and the room stays in `pending`. `roomsToLoad` skips pending rooms, so choosing the same building again never re-queues it: stand-ins for the whole session, no backdrop, no "Obrazki" judgement until a reload. Reachable on the new main first-launch path (tap "Wróć" before about 1.5 MB arrived).
- **Fix**: `attachLoader` drops rooms still pending on the previous (shut-down) loader back to "not attempted" (detach, clear, publish), so the relaunched UIScene's `ensure([chosenRoom])` queues the missing keys again; keys already in the cache are skipped.
  - Strength: one place, no new lifecycle hook; the unit rig proves it.
  - Tradeoff: a file in flight on the dead loader is fetched again (precache, cheap).
  - Confidence: HIGH — `LoaderPlugin.shutdown` source read in `node_modules/phaser/src/loader/LoaderPlugin.js`.
  - Blind spot: no browser test of the exact mid-load timing.
- **Decision**: FIXED — new case in `tests/roomArtLoader.test.ts` ("a room still pending when its loader shut down is queued again on the next loader") red before (1 failed / 9 passed), green after.

### F2 — The choice view after the task-screen "Wróć" lost the way back to the age (playtest F-02 b)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `backToChoice`; tests/e2e/first-launch.spec.ts "#12 "Wróć" returns to the building choice…"
- **Detail**: `backToChoice` started the welcome with `{ placed }` only, so `fromAge` was false and a child-placed learner had no "Wróć" to the age on the choice view. Before S-28 the task-screen "Wróć" let a child who tapped the wrong age pick another (playtest F-02 b; the old spec re-picked age 9 → E5); phase 7 dropped that step and the spec assertion. The plan hid the choice-view "Wróć" only for a parent-placed learner.
- **Fix**: pass `fromAge: placed !== undefined && !placed.stageOverriddenByParent`; the first-launch spec again taps `choiceBack`, age 9, then Baza, and expects E5 after a reload; wiring guards in `tests/themeBackWiring.test.ts` and `tests/welcomeChoiceWiring.test.ts` follow.
- **Decision**: FIXED

### F3 — Gap rows, CLAUDE.md and a comment state things the code does not do

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: docs/design-gaps.md rows 195, 197, 198; src/core/artPick.ts `DrawnFallbackWhere` comment; CLAUDE.md S-28 sentence
- **Detail**: row 195 said the base "is reached through the same house view" (RoomScene hides "Dom" without `HOUSE_GEOMETRY`); row 197 and the artPick comment said a missing card is "counted in the Obrazki UI line" (`uiArtHealth` covers `UI_ART` only); row 198 said the Hasło words in the base are the Mostek's (`MINIGAME_WORDS` is one fixed salon list, R7); CLAUDE.md placed `buildingStart` in `src/core/save.ts` (it is `src/core/house.ts`) and gave Mostek "6 tasks" (7: stage + 6).
- **Fix**: texts corrected to the code.
- **Decision**: FIXED

### F4 — Weakened welcome backdrop-restore e2e

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: tests/e2e/backdrop-restore.spec.ts (welcome case)
- **Detail**: a fresh install has no room, so phase 6 changed the welcome case to assert `plain` before and after the context loss; it no longer proves the `RESTORE_WEBGL` redraw of `WelcomeScene` (left to the source guard `tests/backdropRestoreWiring.test.ts`). Justified by decision P5, but the proof is thinner.
- **Fix**: reach the welcome through `themeBack` after the salon loaded and assert the redraw (follow-up 14).
- **Decision**: DEFERRED — follow-ups/review-fixes.md 14, `Trigger:` line.

### F5 — Follow-ups re-recorded without re-reading their sources

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/first-building-choice/follow-ups/review-fixes.md entries 4, 5, 6, 7, 8, 11
- **Detail**: 6 described kitchen-room 6 as a data point (it is the service-worker install warning, closed by house-cross-section); 7 called N-2 a naming item (it is "Wróć leaves no trace", closed by the `console.info`); 11 described minigame-daily-puzzle's save-format follow-up as `variants`/Hasło (it is S13-06); 4 dropped the standing rule "never point the frozen step at `copyHouse`"; 5 did not say the kitchen-5 trigger "a third room" fired; 8 claimed a re-check and did not note that `openParent` changed (trigger fired) or that the #16 nit was fixed before the slice.
- **Fix**: each entry rewritten with its source's wording and evidence.
- **Decision**: FIXED

### F6 — FR-050 round equality holds by construction

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/buildingNeutral.test.ts
- **Detail**: the round, warm-up and word round are built from shared constants, not from the two sessions, so the deep-equal cannot fail; the real guard is `tests/freshRoundWiring.test.ts` (no house/rooms/currentRoom read in `freshRound`), which exists and is green.
- **Fix**: drop the tautological part or build from the sessions (follow-up 15).
- **Decision**: DEFERRED — follow-up 15.

### F7 — "Obrazki" keeps the first building's room record after a switch (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/scenes/UIScene.ts `create` (`refreshHealth` only when `total === 0`)
- **Decision**: RECORDED — follow-up 16.

### F8 — A sleeping HouseScene survives `backToChoice` (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/scenes/TaskScene.ts `backToChoice`
- **Detail**: harmless while `base-1` has no geometry.
- **Decision**: RECORDED — follow-up 17 (`Trigger: S-29`).

### F9 — `buildingStart` duplicates `freshSession`'s expression (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/core/house.ts `buildingStart` (phase-4 deviation: no `stars`, not via `freshSession`, to avoid a save/house import cycle)
- **Decision**: FIXED — `tests/house.test.ts` now pins `buildingStart(id)` field-equal to `freshSession(house)` for both choices.

### F10 — Small seams (OBSERVATION)

- **Location**: `ChoiceCard` (no pressed fill unlike `AgeButton`), `tests/welcomeChoiceWiring.test.ts` "offers Wróć only on the child age path" (file-wide match), `FIRST_ROOM` fallbacks in four scenes/widgets, `tests/fixtureLoadPath.test.ts` re-implements the repair call, stale describe title in `tests/layout.test.ts`.
- **Decision**: title FIXED ('"Wróć" to the building choice (F-02 b, FR-043)'); rest RECORDED — follow-up 18.

### F11 — p6 went beyond the plan (OBSERVATION)

- **Location**: src/scenes/TaskScene.ts (`changedata-roomLoad` backdrop redraw, listener removed on shutdown), src/scenes/UIScene.ts (`ensure` + `refreshHealth(chosenRoom)`), 7 adapted e2e specs.
- **Detail**: needed by the plan's own "plain until the room has loaded" intent and by plan review F8; the spec edits keep their asserts except F4's.
- **Decision**: ACCEPTED

### F12 — Manual rows

- **Severity**: OBSERVATION
- **Detail**: `[reviewer]` 3.7 performed (teacher read above) and ticked. `[reviewer] (CI at ship)` rows stay open for the ship step, each naming its proof: 3.8 Deploy job `deploy`, step `Smoke check (deploy)`: `ok   precache covers room pictures — 79 of 79 room pictures precached` (58 + 21 bridge); 5.7 same step: `ok   precache covers choice pictures — 2 of 2 choice pictures precached`; 8.11 Deploy job `build`: `Tests +[0-9]+ passed` and `e2e hook: absent (`. `[human]` 2.6, 8.7-8.10 and `[visual]` 8.6 are not the reviewer's.
- **Decision**: RECORDED

MERGE: CLEAR — no open CRITICAL, every reviewer criterion met, all suites green (unit 4092 + 78, e2e 179 + 5 with every load failure re-judged green); 4 warnings fixed, 2 recorded with Trigger lines.
