# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-tdd` phase 3 step of run `2026-10-15-fix-s14c-s14d`. Phase 3 code is committed; row 3.3 (e2e part) waits for the orchestrator, 3.4 [reviewer] and 3.5 [visual] are not mine.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + p1 `8430945` + p2 `ccbfc11` + p3 (see `git log`) + handoff p3 |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (2.4 ticked from the orchestrator note; 3.1, 3.2 done; 3.3 open for e2e; 1.5, 1.6, 2.5-2.7, 3.4, 3.5 not mine) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/saveHealth.ts` | `failing` carries `count`, `stage`, `error`; `SaveHealthView.migration` (`SaveMigration`: from, copy kept/lost, code) replaces `migratedFrom`, set only when `writes > 0` |
| `src/data/pl.ts` | `settings.saveFailingDetail`, `settings.saveStage`, `settings.saveMigrated.kept/lost` (the old function key is now an object) |
| `src/ui/dom/saveHealthView.ts` | muted detail line under `saveFailing`; migration line by copy fate, with the code line on `lost` |
| `docs/design-gaps.md` | rows 94, 95 |
| `tests/saveHealth.test.ts`, `tests/autosave.test.ts`, `tests/saveTransferCopy.test.ts` | 5 new tests (migration gated by writes, kept/lost, failing detail and fallback, copy text, backup pending then done) |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| `npm test` | 2471 passed (branch baseline 2466, +5) |
| deploy/ops shell tests, `sample` E1-E6 | OK (no content change) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | e2e: not runnable in this session — orchestrator gate (Chromium cannot start); expected 77 + 0. Specs asserting the old texts: none (`grep saveMigrated tests/e2e` is empty), `save-restart.spec.ts` C-2 still finds `pl.settings.saveFailing` |
| RED | `expected undefined to be null`; `expected undefined to deeply equal { from: 1, copy: 'kept', code: null }`; `expected { kind: 'failing', ...} to match object { kind: 'failing', count: 2, ... }`. The copy test failed with `TypeError: pl.settings.saveMigrated.kept is not a function` (missing key, not an assertion); the autosave pending/done test was green at once (the status already carried the fact from p2) |
| Break A (`migration` without `writes > 0`) | first run stayed green (meta-check: `backup: pending` returned null anyway); test strengthened with `backup: 'done', writes: 0`, then red; restored |
| Break B (`stage` ignores `lastFailure`) | "failing carries ... stage and the error code" red, restored |
| `git diff --stat tests/fixtures` | empty; `SAVE_VERSION` 2 |

## 4. Next command

Next: `/10x-implement save-v2-backup-health phase 4` (Driver: impl)

## 5. Open

- Row 3.3 e2e part (orchestrator: `npx playwright test --workers=4`, expect 77).
- Rows 1.5, 2.7, 3.4 [reviewer]; 1.6, 3.5 [visual]; 2.5, 2.6 [human].
- Earlier open items unchanged: [human] 4.7, 4.8; DESIGN-GAP 96-97 come in phase 4; follow-ups in phase 5.

## 6. Autonomous decisions

- Teacher-read wording of `saveFailingDetail`, `saveStage`, `saveMigrated` is exactly the plan's contract text (row 3.4 is the reviewer's).
- Mixed phase: the DOM view, `pl.ts` and design-gap rows inline; the phase keeps Driver: tdd.
- `pl.ts` imports the type `FailureStage` from core (type-only, allowed by the boundary rule).
- Did not set change.md status.
