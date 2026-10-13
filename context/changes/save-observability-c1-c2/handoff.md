# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by the `plan` step. `plan.md` has 6 phases (tdd, tdd, tdd, impl, impl, e2e) with a `## Progress` of 35 rows;
`change.md` status is `planned`. The next agent must not forget: the status contract in plan.md "Critical Implementation
Details" (`BlockReason`, `blockedBy` replacing the `blocked` option, first reason wins) is what phases 2, 4, 5 and 6 build on,
and the abandoned `store.read()` promise gets its `.catch` at race start.

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | 3 on the branch (identity, research; this step: `docs(save-observability-c1-c2): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| Progress rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-observability-c1-c2/plan.md` | full plan: 6 phases with `Driver:` lines, Critical Implementation Details (status contract, load limit, e2e seams, `start` order), Autonomous decisions, Progress |
| `context/changes/save-observability-c1-c2/plan-brief.md` | two-page brief |
| `context/changes/save-observability-c1-c2/change.md` | status `preparing` → `planned` (metadata only) |
| `context/changes/save-observability-c1-c2/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-observability-c1-c2` |
| code reading at `9df5f67` (`src/core/autosave.ts`, `src/main.ts` `start`, `src/ui/dom/saveFailedCard.ts`, `settingsPanel.ts` `SettingsPanelOptions`, `progressView.ts`, `src/scenes/UIScene.ts` `openSettings`, `RoomScene.ts` `room`/`roomState`, `src/testing/e2eHook.ts` `e2eSave`/`e2eSaveStore`, `tests/autosave.test.ts` `makeClock`, `tests/e2eSave.test.ts`, `tests/roomsData.test.ts`, `tests/e2e/save-restart.spec.ts`, `tests/e2e/support/welcome.ts`, `playwright.config.ts` `ROUND_SPEC`, `docs/design-gaps.md` rows 42–44) | plan claims anchored on symbols |
| Success Criteria ↔ Progress | 1:1 per phase (5/4/5/6/10/5 = 35) |
| `roadmap.md` | no `save-observability-c1-c2` entry — untouched (non-roadmap fix) |
| lint / typecheck / unit / build / e2e | not run — docs-only step (baseline in the contract: unit 1142, e2e 29) |

## 4. Next command

`/10x-plan-review save-observability-c1-c2`

## 5. Open

- Manual rows (human checklist): 4.5 `[human]` device check (iPad Safari private / site data blocked, Android without site storage → card only when storage is really unavailable); 5.9 `[human]` parent-facing form (DESIGN-GAP 43 revisited: panel section + pre-game card); 5.10 `[human]` copy acceptance (`pl.saveUnavailable`, `pl.settings` save section). `[reviewer]` 1.5, 3.5, 4.4, 5.6, 5.7; `[visual]` 4.6, 5.8.
- DESIGN-GAP: row 43 rewritten and row 45 added in phase 5 (`docs/design-gaps.md`).
- Follow-ups file `follow-ups/review-fixes.md` is written in phase 5 (M-S1, M-S2, M-S3+L-S1, M-R4, L-S2, L-S3, L-R8, L-R9, L-R11, F4 carried).
- Phase 6 may need the request-file protocol (`prompt-phase.md`) if Chromium cannot launch; three break patches named.

## 6. Autonomous decisions

- No AskUserQuestion (contract rule 1); complexity MEDIUM, every research recommendation adopted; details in plan.md `## Autonomous decisions` 1–11.
- Added a fourth e2e seam `?e2eSave=writefail` beyond the prompt's `unavailable`/`hang`; rejected: proving C-2 (the core of the audit) by unit only. Would change if plan-review finds the failing state sufficiently covered by `saveHealthView` unit tests.
- `AutosaverOptions.blocked` replaced by `blockedBy`; `status().blocked` kept for the hook and the S-11 spec. Would change if another caller of `createAutosaver` exists.
- `saveHealthView(status)` without a clock: the panel shows a wall-clock time, no "N minutes ago" (no numeral agreement). Would change if the maintainer wants relative time.
- One e2e phase (6) after the seam sweep (5), as the step prompt fixes. Non-roadmap: no roadmap status edit.
