# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-impl-review` step of run 2026-11-01-bathroom-polish-lab: full-plan review APPROVED, `MERGE: CLEAR`, no code fix needed; one WARNING went to follow-ups. The next agent must not tick 2.9 or 5.12 before the post-merge Deploy log shows them.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | `8a667f5`..`d10e0d6` (16) + this review commit `docs(house-1-polish): impl review` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress rows remaining | 8 (`grep -c '^- \[ \]' plan.md`): 2.9, 5.12 `[reviewer] (CI at ship)`; 5.6 `[visual]`; 5.7-5.11 `[human]` |
| working tree | clean after the review commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/reviews/impl-review.md` | review report, verdict APPROVED, 0 critical / 1 warning / 3 observations, ends with `MERGE: CLEAR` |
| `context/changes/house-1-polish/plan.md` | row 2.8 ticked with the Polish read |
| `context/changes/house-1-polish/change.md` | status `impl_reviewed` |
| `context/changes/house-1-polish/follow-ups/review-fixes.md` | item 14 (`isRecord` fourth copy, save-truth follow-up 20 fired) |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | 4254 passed (baseline 4233 incl. 3 CI-skipped, +21) |
| deploy + ops shell tests, `npm run sample -- E1..E6` | pass, all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| break A `done + 1` in `LIFT_V6_KITCHEN_STAGES` | 13 unit failures (`saveV7`, `fixtureLoadPath`); restored |
| break B `done < 0` | `0 becomes 0` red; restored |
| break C `MIGRATIONS[6]` removed | 31 failures, saves `unreadable`, no loop; restored |
| e2e break A on `house-1-polish.spec.ts -g FR-021`, `--workers=1`, sandbox off | red "Expected: place-kitchen-table, Received: place-fridge"; restored; spec 3 passed |
| meta-check | the oracles are the frozen v6 file, the hand-written `save-v7.json` and literals, never the step's own output; e2e reads the rendered/store state |
| `git diff --name-status 964285b -- tests/fixtures` | only added save fixtures (+ planned `room-art-kitchen.json` table) |
| `git diff --stat 964285b -- deploy` | `deploy/README.md` only |
| full e2e | not run here (orchestrator: 196 = 193 + 3, load timeouts pass alone) |
| servers | none left (4397/4398/4399 free) |

## 4. Next command

`visual gate (house-1-polish)`

## 5. Open

- `[visual]` 5.6: the 17-frame matrix in `plan.md` (kitchen stages, cross-fade, cream salon incl. Canvas, house cells, done cards, backdrops, `?e2eSave=v6-kitchen`, `?e2eArt=room`) into `reviews/visual-review.md`.
- `[human]` 5.7 save v7, 5.8 kitchen costs 84, 5.9 salon cell fill (gap 207), 5.10 salon before look (gap 206), 5.11 tablet offline update.
- `[reviewer] (CI at ship)` 2.9: Deploy job `deploy`, step `Smoke check (deploy)`, `146 of 146 room pictures precached`; 5.12: Deploy job `build`, `Run npm test` `Tests  4251 passed | 3 skipped (4254)`, `Run npm run build` `e2e hook: absent (`.
- PR body „dla właściciela produktu”: `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS`), `src/core/types.ts` (`SaveV7`), `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs` (`ROOM_PACKS`), `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.
- Follow-ups 1-14 in `follow-ups/review-fixes.md`; new item 14 (`isRecord` in `kitchenStages.ts`).

## 6. Autonomous decisions

- R1. Drift and quality checked inline rather than by the skill's two subagents: the non-test diff is about 80 lines I read in full. Would change: a larger code diff.
- R2. F1 (`isRecord` fourth copy) recorded as follow-up, not fixed: extracting would edit two frozen migration steps. Would change: a non-frozen module needing it (the narrowed trigger).
- R3. F2-F4 accepted as observations (unit literal for the 0 boundary, double version pin, fixture derived on the v6 code). Would change: a bug at `tasksDone 0` seen in a real write.
- R4. Triage done in place, no `AskUserQuestion`; continuation "Done" (stop after this step).
