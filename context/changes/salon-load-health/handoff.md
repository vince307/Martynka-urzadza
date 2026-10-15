# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by the `/10x-plan` step. `plan.md` (5 phases, `## Progress` all pending) and `plan-brief.md` exist; nothing is
built yet. The one thing not to get wrong: in phase 1 the frozen fixture `tests/fixtures/save-v2-legacy-salon.json` is
generated from `encodeSave(legacySalonSession())` BEFORE `SAVE_VERSION` becomes 3, and `MIGRATIONS[2]` must be total
(malformed rooms → `corrupt`, never `migration-failed`).

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 3 on the branch after this step (change identity, research, `docs(salon-load-health): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 26 (all; `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below changed) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/plan.md` | Implementation plan: 5 phases with `Driver:` lines, success criteria, `## Autonomous decisions`, `## Progress` |
| `context/changes/salon-load-health/plan-brief.md` | Two-page brief (decisions table, phases at a glance) |
| `context/changes/salon-load-health/change.md` | Frontmatter status `preparing` → `planned` |
| `context/changes/salon-load-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-load-health` |
| Success Criteria ↔ Progress per phase (awk count) | 6/6, 6/6, 5/5, 4/4, 5/5 |
| `grep -c '^Driver: ' plan.md` | 5 (tdd, tdd, impl, impl, e2e), each the first line under its `## Phase N:` heading |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md hash matched; `changed: true` |
| Source re-reads (`src/core/save.ts`, `src/core/rooms.ts` `remapLegacySalon`, `src/data/rooms.ts` `SALON`/`LEGACY_SALON`, `src/main.ts` `start`, `src/core/autosave.ts` statuses, `src/testing/e2eHook.ts` `legacySalonSession`, `tests/e2e/salon-art.spec.ts`) | consistent with `research.md`; `legacySalonSession` has `learner: null` (spec (a) runs on the welcome screen) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `7f831c5`: unit 2939, e2e 98 — inherited, unverified) |

## 4. Next command

`/10x-plan-review salon-load-health`

## 5. Open

- `[human]` rows in `plan.md` Progress: 1.6 (v3 one-way door — rollback below v3 shows the `future` card; accepted by the maintainer at Step 0), 3.5 (iPad/WebKit: a stalled picture ends loading in ≤ 24 s).
- `[visual]` 2.6: "Zapis gry" under `?e2eSave=legacy-salon` before any round shows "przeniesiono z wersji 2" (1440 and 1024).
- Phase 5 (e2e) needs the request-file protocol (`e2e-request-p5.md`, patches `e2e-break-p5a..c.patch`); the stall test needs `serviceWorkers: 'block'` + a never-fulfilled `page.route` on `assets/rooms/salon/furnishings-before.webp` and the spec name in `playwright.config.ts` `ROUND_SPEC`.
- Phase 1 changes existing e2e asserts (`writtenVersion` 2 → 3 in `tests/e2e/salon-art.spec.ts`, `tests/e2e/save-backup-health.spec.ts`, titles in `tests/e2e/save-migration.spec.ts`): the orchestrator's e2e gate must run on phase 1.
- Follow-ups (out of scope) are listed in plan phase 4 § 3 and land in `context/changes/salon-load-health/follow-ups/review-fixes.md` in phase 4.
- No `ARTIFACT GAP`. `context/foundation/lessons.md` does not exist.

## 6. Autonomous decisions

1. **No interview** (contract: never AskUserQuestion): complexity HIGH-ish but every solution question was settled by `change.md`, `research.md` and the contract; remaining choices decided in `plan.md` `## Autonomous decisions` 1–10. What would change it: a maintainer answer contradicting a recorded decision.
2. **Frozen migration tables in `src/core/migrations/legacySalon.ts`; `LEGACY_SALON`/`LegacyRoomLayout`/`remapLegacySalon` deleted in phase 2.** Rejected: data import in `save.ts`, injection through `decodeSave` params, keeping a data copy with an equality test. Why: a migration is a pure function of bytes; one truth. What would change it: a second runtime reader of the old list.
3. **M-3 lives in `createAutosaver`** (arms a `'migration'` write when `options.migrated` is set; runtime `migrationWrittenAt`). Rejected: `markDirty()` in `main.ts`. Why: testable in `core`, no race with the slow/unavailable cards. What would change it: a start write needed for a non-migration reason.
4. **F3/F4 ride along in phase 2** (trigger "the v3 save format" fired). What would change it: plan-review showing F3 alters import/reset dialogs beyond the tests.
5. **Loader limits `timeoutMs 12000`, `maxRetries 1`** (worst case 24 s per file). Rejected: default retries (36 s), 5 s (too short for 289 KB on a slow first launch). What would change it: the iPad measurement (`[human]` 3.5).
6. **E2E risk ids #2 and #15** (no art-specific risk in the test plan). What would change it: a new test-plan risk for pictures.
7. **One note in `deploy/README.md`** despite "No changes under deploy/" — the run contract's slice rules allow exactly this note. What would change it: the maintainer treating any `deploy/` edit as needing `sync`.
8. **Roadmap untouched** (non-roadmap change; `metadata-guard` roadmap sync skipped per step prompt).
