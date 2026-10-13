# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by the `new` step (`/10x-new observability-c1-c2`, autonomous run 2026-10-13-fix-observability). The change
folder and `change.md` exist; nothing else. Next agent: this is a NON-ROADMAP change — never edit roadmap statuses; and
H-7 is a product rule change (PRD FR-013 and docs/ZADANIA.md § 1 sentences listed in change.md must be updated by the plan).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2`, cut from `main` at `a34aeee` |
| Commits | 1 on the branch: `docs(observability-c1-c2): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/observability-c1-c2/change.md` | change identity: audit claim vs repo table (all C-1, C-2, L-8, H-6, H-7 claims confirmed at `a34aeee`), design binding (no kit view; 2 DESIGN-GAPs to add), no migration, H-7 doc sentences to update, triggered follow-ups with scope, 7 autonomous decisions |
| `context/changes/observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| grep `addEventListener('error'` / `unhandledrejection` / `onerror` in `src/` | only `utterance.onerror` in `src/ui/narrator.ts` `speakNow` — C-1 confirmed |
| read `node_modules/phaser/src/dom/RequestAnimationFrame.js` `step` | callback before `requestAnimationFrame(step)` — C-1 confirmed |
| read `parentGate.ts` `submit`, `stagePanel.ts` `openStagePanel`, `settingsPanel.ts` `openSettingsPanel`, `UIScene.openSettings`/`applySettings`/`closeSettings`, `WelcomeScene.openParent`/`start`, `inputSuspend.ts` `createInputSuspender` | close-before-callback and success-only release confirmed (C-2, L-8) |
| read `UIScene.openSettings` + `SettingsPanelOptions` | no voice availability passed — H-6 confirmed |
| read `mastery.ts` `recordRound`, `balance.mastery`; grep `loss` in `tests/` and `mastery` in `tests/e2e/` | −1 rule in code + 2 unit test files; no e2e depends on it |
| gate suites | not run — docs-only step, no product code changed |

## 4. Next command

/10x-research observability-c1-c2

## 5. Open

- Research questions (change.md decisions 1, 3, 6, 7): benign `error` events to filter (`ResizeObserver loop…`, resource errors without `ErrorEvent.error`); no DOM environment in vitest (no jsdom/happy-dom in `package.json`) → DOM behaviour only via e2e; how to trigger an exception in the e2e build only (`src/testing/e2eHook.ts` like `e2eMonth`) and the build-guard proof; whether the panel should subscribe to `Narrator.onAvailability` while open; whether `progressView` ranking still works with no −1.
- DESIGN-GAPs to add in `docs/design-gaps.md` (after row 28): error card; "no Polish voice" line in the settings panel.
- New Polish strings (error card, no-voice line) need a `[reviewer]` teacher-read row.
- Docs to update for H-7: `context/foundation/prd.md` FR-013, `docs/ZADANIA.md` § 1 „Adaptacja trudności”, `src/data/balance.ts` `mastery` comment, `tests/mastery.test.ts`, `tests/curriculumEnd.test.ts` `MASTERY`.
- Follow-ups taken in: S-08 F6 (`WelcomeScene.openParent` guard); conditionally the S-05 e2e-hook room targets item (if `src/testing/e2eHook.ts` is touched). Out with reasons in change.md: S-08 F4, F5, F7; S-06 `openDialog` keyboard; S-05 narrator unlock, HUD button, test-plan narrator risk; S-07 calibration and `playableSteps`.
- The S-06 follow-up "`mountInstallHint` lets a tap through" is already closed by S-08 (`main.ts` passes `suspender.suspend()`); research should confirm and say so.

## 6. Autonomous decisions

1. C-1 boundary in `src/main.ts` + DOM card in `src/ui/dom/` for every uncaught error, reload only, no network; rejected loop restart, per-scene try/catch, local error buffer (PRD scope change). Would change: benign error events found by research (→ pure filter), or S-11 save.
2. C-2/L-8: `finally` in `createInputSuspender` and in every holder (`UIScene`, `WelcomeScene`), rethrowing to the boundary; error card suspends input and never releases. Rejected: close-after-success only, swallowing. Would change: a single "hold input for a dialog" helper proves simpler.
3. E2E failure trigger only in the e2e build, proved absent from `dist/` (guard + grep); never `page.clock`. Would change: `page.evaluate` throwing from `setTimeout` suffices for C-1.
4. H-7: remove `MasteryRules.loss` / `balance.mastery.loss` (rule, not tuning), add "mastery never decreases" test; rejected `loss: 0`. Would change: maintainer wants a tunable penalty in S-17.
5. Scope C-1, C-2 (+L-8, F6), H-6, H-7 only; M-1/M-2/H-3/H-4/H-8/H-10/H-9 etc. out. Would change: research shows M-1 still reachable without the card.
6. H-6: pass `available`, show a no-voice line, keep the switch active. Would change: a kit pattern for unavailable settings.
7. Next step `/10x-research` (not the skill's default `/10x-plan`) — the step prompt fixes it and real unknowns exist.
