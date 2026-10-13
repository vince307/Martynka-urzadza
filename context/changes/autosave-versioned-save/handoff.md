# Handoff — `autosave-versioned-save` (slice S-11)

Written by the implementation-review step of run 2026-10-13-s09-s11. Review is filed (`reviews/impl-review.md`, MERGE: CLEAR); two warnings were fixed in b59e247, which **changes production code** (`src/main.ts` `start`, `src/data/pl.ts` `saveFailed.note`), so the orchestrator must re-run the full e2e on the final commit. Do not edit `tests/fixtures/save-v1*.json` (frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | p1-p7 (`7cf32a4` .. `a403b21`), fix `b59e247`, docs/handoff commits, plus this review commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 8, all [visual]/[human]: 4.6, 5.6, 5.7, 5.8, 6.6, 6.7, 6.8, 6.9 (reviewer rows 5.5 and 6.5 ticked, b59e247) |
| Roadmap | S-11 `planning` (unchanged) |
| Working tree | clean after the commit (Playwright's gitignored `test-results/` from the failed sandbox run aside) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/reviews/impl-review.md` | full-plan review, phases 1-7, 2 warnings fixed, 4 observations, MERGE line |
| `src/main.ts` (`installErrorBoundary` handler, `start`) | `booted.failed` set by the handler; `start()` returns before the game when a fatal signal came during the load or the unreadable card |
| `src/data/pl.ts` (`saveFailed.note`) | "Tym razem gra nie zapisze postępów." (was "Dziś …") |
| `docs/design-gaps.md` row 42 | card is shown before the game starts, not over the canvas |
| `context/changes/autosave-versioned-save/follow-ups/review-fixes.md` | review follow-ups F3 (`unavailable` e2e seam), F4 (guard cases), F5 (export fallback), each with `Trigger:` |
| `context/changes/autosave-versioned-save/plan.md`, `change.md` | rows 5.5, 6.5 ticked; status `impl_reviewed` |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, before and after b59e247 |
| `npm test` | 1142 passed = baseline 1079 + 63 (slice); fix adds +0 |
| deploy tests, `sample` E1..E6 | OK, 0 violations |
| `npm run build` | `e2e hook: absent`; `grep -rlE "e2eSave\|e2eStars\|__martynkaE2E" dist/` → no match |
| `npx playwright test` | one plain run: Chromium killed by the sandbox (mach port permission), 13 failed at launch, 0 at an assertion; evidence is the orchestrator's round 2 on a403b21 (29 passed = 26 + 3; breaks p7a-p7d RED). e2e: orchestrator re-runs on the review's final commit |
| Deliberate break | `createAutosaver` ignoring `options.blocked` → `tests/autosave.test.ts` 2 RED (unreadable / unavailable never written); restored, 12 green, diff clean. Meta-check: proves the core rule; the browser wiring is proven for `unreadable` only (break p7c), `unavailable` is follow-up F3 |
| Hook bypass check | `.claude/settings.json` and hooks untouched; none |

## 4. Next command

visual gate (S-11 failed-load card, restored game after reload)

## 5. Open

- Human checklist: 4.6 iPad/Android restart, kill, silent update keep state (`src/main.ts` `start`); 5.6 [visual] card, gate over card, welcome after "Graj dalej" at 1440x900 and 1024x768 (`src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard`, reachable via `?e2eSave=unreadable` in the hook build); 5.7 export on iPad home-screen app and Android (`src/ui/dom/saveExport.ts` `exportRawSave`); 5.8 `?e2eSave` seam; 6.6 v1 deviates from plan §5 (`src/core/types.ts` `SaveV1`) — accept before the first deploy; 6.7 card gating; 6.8 two-build e2e deferred to v2; 6.9 `pl.errorCard.body` unchanged.
- E2E re-run needed on the final commit (production code changed in b59e247).
- Follow-ups: `follow-ups/review-fixes.md` (v2 migration, two builds, two instances, S-12 export/import, carried F3/F4 observability, review F3-F5).
- DESIGN-GAP rows 42-44 (42 wording corrected).
- Known risks: v1 validation must never tighten without a migration (`src/core/save.ts` `validateSave`); two same-origin instances, last writer wins.

## 6. Autonomous decisions

- F1 fixed in place (WARNING, cheap): `booted.failed` guard in `src/main.ts` `start` rather than blocking only the saver — rejected "block the saver on creation" because the game itself would still run unseen under the error card. Would change: the maintainer wanting the game to start after a non-fatal pre-game error (then `isFatalSignal` is the place, not `start`).
- F2 fixed in place: note wording "Tym razem" (teacher read). Would change: the maintainer's own copy for DESIGN-GAP 42.
- F3-F5 recorded as follow-ups, not fixed: they add tests/seams or confirm device behaviour, none can lose a save today.
- Kept the p1 `unlockedStep` relaxation: `floorToCalendar` fills a missing stage at load, so requiring all six keys would only make good saves unreadable. Would change: a stage the game reads without the floor.
- Triage decided in place (no AskUserQuestion), contract rule 1.
