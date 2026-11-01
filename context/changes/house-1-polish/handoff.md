# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-plan` step of run 2026-11-01-bathroom-polish-lab: `plan.md` (6 phases, drivers tdd/impl/impl/impl/impl/e2e)
and `plan-brief.md` are written, `change.md` is `planned`, roadmap S-32 is `planning`. The one thing not to get wrong: the
save step v6 → v7 (phase 1, `MIGRATIONS[6]`, kitchen `tasksDone` k ≥ 1 → k + 2) lands BEFORE the kitchen data (phase 2), and
the temporary `tasks-overflow` expectation phase 1 puts in `tests/fixtureLoadPath.test.ts` must be removed red-first in phase 2.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, cut from `main` at `964285b` (S-31 merge #136) |
| commits | 3 on top of `964285b`: change identity, research, `docs(house-1-polish): plan` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| Progress rows remaining | 41 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit (files staged by explicit path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/plan.md` | the plan: 6 phases with `Driver`/`Driver why`, Success Criteria mapped 1:1 to `## Progress`, `## Autonomous decisions` P1-P10 |
| `context/changes/house-1-polish/plan-brief.md` | two-page brief with the key-decision table |
| `context/changes/house-1-polish/change.md` | status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-32 status `ready` → `planning` (At a glance row and slice body) |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-1-polish` |
| Success Criteria ↔ Progress mapping (python check over `plan.md`) | phases 1-6: 6/6, 9/9, 6/6, 5/5, 12/12, 3/3 identical |
| `gh run view 41330660160 --log --job 124920757998` (sandbox disabled) | `ok   precache covers room pictures — 144 of 144 room pictures precached`, `all 24 checks ok` (cited in rows 2.9) |
| `gh run view 41330660160 --log --job 124919859656` (sandbox disabled) | `Tests  4230 passed \| 3 skipped (4233)`, `e2e hook: absent (2 chunks checked)` (cited in row 5.12) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed; baseline per contract `main` at `964285b`: unit 4233, e2e 193 (inherited, not re-measured) |

## 4. Next command

`/10x-plan-review house-1-polish`

## 5. Open

- `[human]` rows (plan Progress 5.7-5.11): save v7 (overturns scope.md "save stays v6"; rollback below v7 shows the
  `pl.saveFuture` card), kitchen costs 5/6/7 + slots = 84, salon cell fill (D4, gap 207), salon before look worn-v2 + code
  grade (D5, gap 206, against the pack README), real-tablet offline check.
- `[reviewer] (CI at ship)` rows 2.9 (smoke 146 of 146 room pictures) and 5.12 (unit + hook line): proven only by the
  post-merge Deploy log, ticked by the orchestrator's docs PR, not on main.
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`,
  `src/core/migrations/kitchenStages.ts` (new), `scripts/make-task-art.mjs` (`ROOM_PACKS` per-file source),
  `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs` (`v6-kitchen` seam), `deploy/README.md` § 6 (docs-only note).
- Phases 2-3 need `cwebp` and Pillow 12.1.0 + numpy 2.4.3 for `npm run art` (BLOCKED, never hand-made WebP, if missing).
- E2E: phases run only single specs; the orchestrator runs the full suite once after phase 6 (expected 193 + 3).
- DESIGN-GAPs planned: rows 206, 207 new; 109, 182, 203, 169/171 edited (phase 5). Follow-ups planned in phase 5
  (`context/changes/house-1-polish/follow-ups/review-fixes.md`).

## 6. Autonomous decisions

- No `AskUserQuestion` (contract rule 1): complexity MEDIUM, 0 open product questions after research; structure and every
  choice decided from the artifacts — recorded in `plan.md` § Autonomous decisions P1-P10.
- P1 save v7 with the meaning remap (keeps research R1/R2, change.md D2) — overturns scope.md's starting decision; would change
  if the maintainer refuses a format step (then stages could only be appended).
- P2 migration as its own tdd phase before the data, bridged by one temporary `tasks-overflow` expectation (S-31 precedent);
  rejected one combined phase (step prompt). Would change: nothing.
- P3 new frozen `save-v6-kitchen-mid.json` (tasksDone 3, two pieces) + existing `save-v6-kitchen-done.json` + hand-written
  `save-v7.json`; rejected a tasksDone-1 fixture (no `chosen`). Would change: a boundary bug only a real write shows.
- P4 stage ids/labels/costs `clean-kitchen`/`renew-walls`/`renew-floor`, 5/6/7 (R5, D3). Would change: S-17 or the teacher read.
- P5 per-file `{ pack, id, as? }` art source; rejected row-level `scenePack`. P6 keep salon output names and the unused recolour
  script (R3, R4).
- P7/P8 salon crop and before look as the pack gives them, with the code worn grade (D4, D5), each a `[human]` row and a gap.
- P9 `v6-kitchen` e2e seam in its own small phase 4 (so phase 6 only writes a spec). P10 no "Zapis gry" note for the move.
- Seam-sweep row is in phase 5 (the last impl phase), with the CLAUDE.md "Current state" sentence including save format v7.
