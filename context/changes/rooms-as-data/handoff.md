# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-plan-review` step of run 2026-10-30-rooms-kitchen: verdict PROCEED (0 critical, 3 warnings fixed in
`plan.md`, 2 observations), `change.md` is `plan_reviewed`. The one thing the next agent must not get wrong: phase 1 commits
`tests/fixtures/save-v4-salon.json` while `SAVE_VERSION` is still 4 and adds `houseEqual` beside the other house rules (the
load path in phase 3 must compare houses structurally, never by reference, or every start writes the save).

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` (confirmed with `git branch --show-current`) |
| Commits | 4 on the branch after this step: change identity, research, plan, and this step's `docs(rooms-as-data): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/rooms-as-data/reviews/plan-review.md` | the review report (F1–F5, decisions, `VERDICT: PROCEED`) |
| `context/changes/rooms-as-data/plan.md` | triaged: `houseEqual` in phase 1; structural dirty compare, real-data "finished salon stays" test and hook `currentRoom` in phase 3; phase-2 test list completed; parent-only "salon" → "Salon" declared in phase 4 and row 6.6; phase-7 third test now reloads a finished salon (row 7.1 break added); Known risks + decisions PR-1..PR-3 |
| `context/changes/rooms-as-data/change.md` | frontmatter `status: planned -> plan_reviewed` |
| `context/changes/rooms-as-data/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/rooms-as-data` |
| `grep -c '^- \[ \]' plan.md` | 35 (unchanged; rows 6.6 and 7.1 rewritten identically in phase body and Progress, replace count 2 each) |
| `grep -c '^Driver: ' plan.md` | 7; drivers unchanged (1 tdd, 2 tdd, 3-6 impl, 7 e2e after the phase-6 seam sweep) |
| code checks | `roomsListView` maps a teaser entry to `id: null`; `repairCurrentRoom` uses the known ids; `RoomScene.resolve` falls back to `ROOMS[FIRST_ROOM]` and the hook's `roomId` is `room.id` (cannot see a move); `SALON.name` is `'salon'` and `UIScene` `roomName` prints it; one `doneCard.show` call; `room-change.spec.ts` already asserts the done-card items; `freshSession(` callers: `src/main.ts`, `src/scenes/UIScene.ts`, `src/testing/e2eHook.ts`, 4 test files |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source change |

## 4. Next command

`/10x-tdd rooms-as-data phase 1`

## 5. Open

- Manual rows (human checklist): 6.6 `[visual]` salon states + done card + "Zapis gry" at 1440/1024 vs `main` (only
  expected difference: "Salon" in the parent save summaries); 6.7 `[human]` rollback below v5 shows `pl.saveFuture`; 6.8
  `[human]` update proven without two real builds (decision P-6); 6.9 `[reviewer] (CI at ship)`.
- Carried risks (plan `## Known risks`): start-time write if the house compare is not `houseEqual` (multi-tab specs
  `stale-tab.spec.ts`, `load-and-tab-guard.spec.ts` would go red); `kitchen` cell stored in every F-04 save (accepted);
  `freshSession(house)`/`SessionSave.house` churn in tests; phase-7 finished-salon test length; e2e seam leak guarded by the
  `v4-salon` marker in `vite/e2eHookGuard.mjs`.
- DESIGN-GAP: none added.
- Follow-ups: written in phase 6 to `follow-ups/review-fixes.md` (list in plan phase 6 § 2); the review found no triggered
  follow-up missing.

## 6. Autonomous decisions

- Fixed by the maintainer (scope.md): v5 = house + floor grid, lossless salon move, frozen v4 fixture, write-once
  `backup-v4`, no art or balance in F-04. Would change: a new maintainer instruction.
- PR-1 keep the `kitchen` cell in the F-04 data house (proven invisible: teaser entry, unknown rooms skipped by
  `roomInRenovation`, repair against `ROOMS`); added real-data and reload tests. Rejected: salon-only data house + a generic
  teaser rule (recreates `ROOM_ORDER`'s special case). Would change: either new test failing.
- PR-2 structural `houseEqual` for the load-time dirty decision. Rejected: leaving "differs" to the implementer. Why: a
  reference compare writes at every start and stales an open tab via `writeVerdict`. Would change: nothing known.
- PR-3 the parent save summaries' "salon" → "Salon" is accepted as a parent-only correction, declared in row 6.6, no
  `[human]` row. Would change: the maintainer preferring the old text.
- Phase-7 third test changed from a duplicate of `room-change.spec.ts` to a finished-salon reload; e2e count stays +3.
  Would change: a cheaper seam for a finished salon appearing.
- Skill checkpoints decided in place: "how to proceed" → triage done in place (fix CRITICAL/obvious WARNING, record the
  rest), report saved; no sub-agent (the risky claims were a few direct greps); no `AskUserQuestion`.
