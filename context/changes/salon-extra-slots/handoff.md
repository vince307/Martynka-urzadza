# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-plan-review` step of autonomous run `2026-10-15-fix-s16bcd`: the plan is reviewed (`VERDICT: PROCEED`, 0 critical, 1 warning fixed, 4 observations recorded), `change.md` is `plan_reviewed`; nothing is implemented. The next agent must not get this wrong: phase order is load-bearing (phase 1 `holdPoint` clip and phase 2 render wiring before phase 3 adds the curtains and moves the decor), and `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots`, cut from `main` at `a06795b` |
| Commits | 4 on top of main: change identity, research, plan, `docs(salon-extra-slots): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| Progress rows remaining | 34 of 34 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/reviews/plan-review.md` | review report: claims-vs-code table, findings F1–F5 with decisions, `VERDICT: PROCEED` |
| `context/changes/salon-extra-slots/plan.md` | triage edits: phase 1 contract note (F5), phase 3 visual criterion + Progress 3.7 add the done-card miniature (F2), phase 5 follow-up list adds VO2, the per-file timeout test, F2 and F3 (F1), `## Known risks` gains fired-and-deferred follow-ups with reasons, F3, F4, F2 |
| `context/changes/salon-extra-slots/change.md` | `status: plan_reviewed` |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-extra-slots` (observed) |
| Grounding: `ls` of 22 plan paths, grep of 18 symbols, `node` read of `designs/martynka-salon-v2/manifest.json` slots | all present (except the planned new `tests/roomShown.test.ts`); manifest geometry equals plan phase 3 (observed) |
| Progress ↔ phases | 8 phases, 34 rows, 1:1 with success criteria (counted) |
| Code read: `src/core/rooms.ts`, `roomHit.ts`, `variantPanel.ts`, `migrations/legacySalon.ts`, `save.ts` (`MIGRATIONS` loop, `validRoom`), `RoomView.ts`, `RoomScene.ts` (`RoomSnapshot`), `RoomDoneCard.ts`, `layout.ts`, `bootLoad.ts`, `balance.loader`, `deploy-check/parse.ts`, `playwright.config.ts`, the buy-everything e2e specs | every live-save, migration, hit-test, card, depth, hook, e2e-limit, `check:deploy` and `totalMs` claim holds (table in the review) |
| Code gates (lint, typecheck, unit, build, e2e) | not run: review step, no product code changed. Baseline on main at a06795b (contract, inherited, unverified): unit 3063, e2e 117 |

## 4. Next command

`/10x-tdd salon-extra-slots` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` decisions to confirm (plan § Autonomous decisions 1–4): costs 8, 10, 12, 13, 15 (total 129); boot `balance.loader.totalMs` 45 → 50 s; finished salons reopen until task 12; tests changed on purpose in `tests/roomsData.test.ts` plus count pins.
- Manual-only rows (human checklist): 6.4 iPad "Wymień lampę"; 8.4 iPad hold on the curtains near the top edge; visual 3.7 (now also the done-card miniature at task 12).
- Known risks added by the review (plan `## Known risks`): F2 miniature curtains above `drawRoomMiniature` top; F3 hold through an unbought default-look piece (`slotAt` reads `chosen`); F4 same-version old tab overwrite; deferral reasons for VO2, per-file timeout test, L-4, L-7, L-R8, L-R11.
- E2E phases 6–8 use the request-file protocol; break patch `e2e-break-p6a.patch` is written in phase 2.
- Follow-ups to write in phase 5 (`follow-ups/review-fixes.md`): list in plan phase 5 § Follow-ups (now including VO2, per-file timeout test, F2, F3).
- No DESIGN-GAP added. No `ARTIFACT GAP`.

## 6. Autonomous decisions

1. **Triage without AskUserQuestion**: the one WARNING (F1, fired follow-ups) fixed in the plan; observations recorded in `## Known risks`. Would change: a human in the loop.
2. **No sub-agent for the codebase verification**: every risky claim was checked against the code in this session. Would change: a claim left unverified.
3. **No CRITICAL**: no path loses or corrupts a furnished salon (append-only `SALON.tasks`, `OLD_ONLY_KEYS`/`TARGET_SLOTS` derived from the frozen tables, `validRoom` checks values only, migrations only for `version < 3`). Would change: a code path deriving the v2 marker from live `SALON` data.
4. **F3 (hold through an unbought piece) recorded, not fixed**: same behaviour as the decoration today; fixing it means occluders in `slotAt`, a hit-test change beyond the plan. Would change: the author expecting a hold on the old pouf to do nothing.
5. **F2 (miniature overdraw) not fixed in code**: ≈ 9 px inside the tile padding, `drawRoomMiniature` stays out (F2 of final-art-salon); visual 3.7 decides. Would change: the visual gate showing it.
6. **Next driver**: phase 1 is `Driver: tdd` → `/10x-tdd`.
