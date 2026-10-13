# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by the `research` step. `research.md` answers every open question from change.md with file + symbol evidence;
`change.md` status is `preparing`. The next agent must not forget that the timed-out `store.read()` promise needs its own
`.catch`, otherwise a late rejection reaches the error boundary's `unhandledrejection` listener and shows the fatal card.

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | 2 on the branch (identity; this step: `docs(save-observability-c1-c2): research`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by the research skill's `metadata-guard.mjs mark-researched`) |
| Progress rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-observability-c1-c2/research.md` | research: status fields, panel line, unavailable card, load timeout, room repair, e2e seams, Polish copy, M-R5/M-S2 verdict |
| `context/changes/save-observability-c1-c2/change.md` | status `new` → `preparing` (metadata only) |
| `context/changes/save-observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-observability-c1-c2` |
| code reading at `1e17ccf` (`src/core/autosave.ts`, `src/main.ts` `start`, `src/core/save.ts`, `src/ui/dom/saveFailedCard.ts`, `settingsPanel.ts`, `progressView.ts`, `src/scenes/UIScene.ts` `openSettings`, `RoomScene.ts`, `src/storage/idb.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `src/core/errorSignal.ts`, `tests/autosave.test.ts`, `tests/e2e/save-restart.spec.ts`, `context/foundation/test-plan.md` "Never `page.clock`") | all claims in research.md anchored |
| lint / typecheck / unit / build / e2e | not run — docs-only step, no code changed (baseline in the contract: unit 1142, e2e 29) |

## 4. Next command

`/10x-plan save-observability-c1-c2`

## 5. Open

- Plan decisions listed in research.md "Open Questions": first-`blockedBy`-wins, `balance.save.loadTimeoutMs` (5000 ms suggested) with a hook-build-only short override for `?e2eSave=hang`, optional clock time in the panel line, M-R5 included (test loop over `ROOMS`), M-S2 deferred.
- Routine-ness of `unavailable` on target tablets is an inference (modern private modes keep IndexedDB), not verified on a device → a `[human]` device-check row in the plan.
- DESIGN-GAP: row 43 in `docs/design-gaps.md` to be rewritten; new row 45 for the unavailable card if its copy differs from row 42.
- Every new string in `src/data/pl.ts` (`pl.saveUnavailable`, `pl.settings` save lines) needs a `[reviewer]` teacher-read row.
- Follow-ups for the plan to write in `follow-ups/review-fixes.md`: M-S1, M-S2, M-S3, M-R4, L-*; F4 (`tests/e2eHookGuard.test.ts`) optional — no guard change needed.

## 6. Autonomous decisions

- Research questions taken from change.md decision 8 + the run prompt; no question asked (contract rule 1).
- Recommended parametrising `mountSaveFailedCard` (copy group + optional `onExport`) over a second card; rejected: a duplicate card. Would change if the unavailable card needs a different layout.
- Recommended a snapshot of `saver.status()` at panel open over a subscription; rejected: a `watchVoice`-style channel (the autosaver has no events and the panel is modal). Would change if the panel became non-modal.
- Recommended the room repair in `src/main.ts` `start` (loaded branch) with known ids as a parameter, not in `decodeSave`/`toSession`; rejected: data-aware decoding (`decodeSave` is the future S-12 import validator). Would change if core were allowed to import `src/data/rooms.ts`.
- Recommended M-R5 in scope (test-only, a few lines), M-S2 out (needs an async channel from `requestPersistence`). Would change if the plan finds the phase over size.
