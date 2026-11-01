# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-plan-review` step of run 2026-11-01-bathroom-polish-lab: verdict PROCEED, 0 critical, 3 warnings fixed in
`plan.md`, 2 observations recorded; `change.md` is `plan_reviewed`. The one thing not to get wrong: phase 1 (tdd) captures the
frozen `tests/fixtures/save-v6-kitchen-mid.json` with the v6 code BEFORE `SAVE_VERSION` moves, and lands `MIGRATIONS[6]`
(kitchen `tasksDone` k ≥ 1 → k + 2) before any kitchen data changes; the temporary `tasks-overflow` expectation it adds to
`tests/fixtureLoadPath.test.ts` is removed red-first in phase 2.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, cut from `main` at `964285b` (S-31 merge #136) |
| commits | 4 on top of `964285b`: change identity, research, plan, `docs(house-1-polish): plan review` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| Progress rows remaining | 41 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit (files staged by explicit path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/reviews/plan-review.md` | the review: grounding, migration audit table, follow-up and driver checks, F1-F5, `VERDICT: PROCEED` |
| `context/changes/house-1-polish/plan.md` | edited: phase 4 contract (`v5-salon` doc line), phase 5 follow-ups (kitchen-room 13 / hangar 8) and criterion + row 5.4 (comment-only diff allowed), phase 6 test 2 contract (what the in-memory seam can show), Known risks (F4 migration audit, F5) |
| `context/changes/house-1-polish/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-1-polish` |
| grounding greps (`SAVE_VERSION`, `MIGRATIONS`, `decodeSave`, `LIFT_V5_BUILDING`, `validRoom`, `roomStateProblems`, `backup-v${from}`, `readBackups`, `E2E_SAVE_SEAMS`, `E2ESaveStoreLog`, `ROUND_SPEC`, pack files, `cwebp`) | all present as the plan describes |
| fixtures (python read of `save-v5-salon`, `save-v6`, `save-v6-kitchen-done`, `save-v6-children-done`) | kitchen states 0/absent/7/7 as the plan assumes |
| `git log --oneline -S"place-counter" -- src/data/rooms.ts` | one commit (`18c0118`, S-22): the kitchen list never changed, the +2 holds for v5 saves too |
| Success Criteria ↔ Progress (python check, after the edits) | phases 1-6: 6/6, 9/9, 6/6, 5/5, 12/12, 3/3 identical |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed; baseline per contract `main` at `964285b`: unit 4233, e2e 193 (inherited, not re-measured) |

## 4. Next command

`/10x-tdd house-1-polish` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` rows (plan Progress 5.7-5.11): save v7 (overturns scope.md "save stays v6"; rollback below v7 shows the
  `pl.saveFuture` card), kitchen costs 5/6/7 + slots = 84, salon cell fill (D4, gap 207), salon before look worn-v2 + code
  grade (D5, gap 206), real-tablet offline check.
- `[reviewer] (CI at ship)` rows 2.9 (smoke 146 of 146 room pictures) and 5.12 (unit + hook line): proven only by the
  post-merge Deploy log, ticked by the orchestrator's docs PR.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`,
  `src/core/migrations/kitchenStages.ts` (new), `scripts/make-task-art.mjs` (`ROOM_PACKS` per-file source),
  `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs` (`v6-kitchen` seam), `deploy/README.md` § 6 (docs-only note).
- Phases 2-3 need `cwebp` (present: `/usr/local/bin/cwebp`) and Pillow 12.1.0 + numpy 2.4.3 for `npm run art` (BLOCKED, never
  hand-made WebP, if missing).
- Phase 6 test 2: assert through `save.migratedFrom`, `save.store.ops`/`writtenVersion` and `save.backup` only; `backup-v6` byte
  equality and persistence are unit-proven (`fixtureLoadPath`) — do not extend `E2ESaveStoreLog` for them (review F1).
- E2E: phases run only single specs; the orchestrator runs the full suite once after phase 6 (expected 193 + 3).
- DESIGN-GAPs planned: rows 206, 207 new; 109, 182, 203, 169/171 edited (phase 5). Follow-ups planned in phase 5
  (`context/changes/house-1-polish/follow-ups/review-fixes.md`), now including kitchen-room 13 / hangar 8 (review F3).

## 6. Autonomous decisions

- No `AskUserQuestion`; triage done in place (contract rule 1): every WARNING had an obvious fix, applied to `plan.md`;
  observations recorded under `## Known risks`. Would change: nothing.
- Deep mode without a sub-agent: the 5 riskiest claims (migration correctness per kitchen state, frozen-module rule,
  backup/import/future paths, e2e seam capability, follow-up coverage) were each one or two greps; a sub-agent would only
  have re-read the same files. Would change: a claim spanning many modules.
- F1: weakened phase-6 test 2 to what the in-memory seam shows instead of extending the hook log with backup bytes (rejected:
  test-only code growth for a fact the unit suite already proves). Would change: a bug where the browser path writes a
  different backup than the unit path.
- F2: allowed comment-only edits under 5.4 rather than forcing every comment fix into phases 1/4 (rejected: unknowable which
  leftovers the sweep finds). Would change: a sweep that finds a non-comment leftover — then it is a finding, not an edit.
- No product decision overturned: save v7, costs 84, D4, D5 each have a `[human]` row and none contradicts the PRD. Would
  change: the maintainer's answer on rows 5.7-5.10.
