# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by `/10x-impl-review salon-load-health`: full-plan review done, verdict APPROVED, `MERGE: CLEAR`; two cheap findings fixed in 4fb1a5b, the rest recorded with triggers. The one thing not to get wrong: the font file is the one queued file the loader timeout does not cover (Phaser `FontFile` skips XHR) — a follow-up, not a regression.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 3062de6..4fb1a5b (phases p1–p5, f4415a5 p3 fix, 4fb1a5b review fixes) + this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 3 (`[human]` 1.6, 3.5; `[visual]` 2.6) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/reviews/impl-review.md` | review report (F1–F7, evidence, reviewer rows, MERGE line) |
| `src/core/migrations/legacySalon.ts`, `tests/legacySalonMigration.test.ts` | F1: unknown non-legacy key kept in an old salon; test asserts the whole `chosen` (4fb1a5b) |
| `tests/e2e/support/hook.ts` | `lastReason` union gains `'migration'` (4fb1a5b) |
| `src/core/autosave.ts`, `src/testing/e2eHook.ts`, `src/scenes/BootScene.ts`, `tests/roomsData.test.ts` | comments only: version-neutral wording, seam list (4fb1a5b) |
| `context/changes/salon-load-health/follow-ups/review-fixes.md` | font note sharpened, 3 new entries; 20 entries, 20 `Trigger:` |
| `context/changes/salon-load-health/plan.md`, `change.md` | rows 1.5, 2.5, 3.4, 4.4 ticked; status `impl_reviewed` |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | pass / pass (before and after 4fb1a5b) |
| `npm test` | 2925 passed = main 2939 − 62 (deleted `salonRemap.test.ts`: 11 × 5 + 7) + 48 new; 4fb1a5b +0 |
| deploy scripts, `sample` E1–E6, `npm run build` | pass; `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=…/playwright.config.ts --workers=4` (this session, with 4fb1a5b) | 101 passed (baseline 98, +3) |
| break: start arming off in `createAutosaver` | 5 red in `tests/autosave.test.ts` (M-3, F3, F4 cases); restored — proves the store ops, not just a status field |
| break: `LIFT_V2_SALON` without the `chosen` shape guard | 1 red ("chosen is null gives corrupt, never migration-failed"); restored — through `decodeSave`, the real chain |
| break: F1 code reverted, test kept | 1 red; restored |
| data check (scratch, through `decodeSave`/`parseImport`) | v1/v2/v2-legacy/v3 fixtures ok with right `migratedFrom`, all encode v3; v4 → `future`; malformed and `__proto__` input → `corrupt`, never a throw; fixtures diff vs main only `A` |
| Phaser 4.2.1 source | per-file `timeout: 0` overrides config (MergeXHRSettings); `Events.ADD` per file; retry reuses `file.xhrSettings` — f4415a5 correct and survives retries |

## 4. Next command

`visual gate (orchestrator)`

## 5. Open

- [ ] `[visual]` 2.6 — „Zapis gry” at `?e2eSave=legacy-salon` with no round: line „przeniesiono z wersji 2”, 1440 and 1024.
- [ ] `[human]` 1.6 — one-way door: after a rollback to a v2 build a v3 device shows the `future` card and plays without saving (`deploy/README.md` note).
- [ ] `[human]` 3.5 — iPad (WebKit): a stalled picture ends loading in ≤ 24 s and the game starts on stand-ins.
- Font load unlimited (`BootScene.preload`, `this.load.font`) and other review observations: `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. **F1 fixed rather than deferred.** Chosen: carry unknown non-legacy keys (plan decision 3, contract M-2). Rejected: leave as follow-up. Why: one loop, no live save affected, test made strict. Would change: a slot id that collides with an unknown key.
2. **F2 (font) a WARNING follow-up, not a CRITICAL fix.** Why: no data at risk, first launch only (precached afterwards), plan scoped it out; fixing needs a custom loader path. Would change: a blank-start report.
3. **F3 (rollback no-save) accepted.** Why: maintainer accepted the one-way door at Step 0; progress is never lost. Would change: a planned rollback below this build.
4. **E2E run in this session** (Chromium launched), not inherited from the orchestrator.
