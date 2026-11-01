# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-plan-review` step of run `2026-10-31-space-base`. The plan is reviewed (VERDICT: PROCEED), `change.md` is `plan_reviewed`, no product code was touched. The next agent must not get this wrong: the base "Wkrótce" has NO vertical offset (plan review F1 removed `teaser.offsetY`; the preview's y+182 is a canvas baseline that centres the text in the cell like the house), and phase 1 must leave the house look byte-for-byte as before.

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | 7 on top of `9a44799` (identity, research, plan and their handoffs, `d5436af` plan review), plus this handoff commit |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 28 of 28 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/base-cross-section/reviews/plan-review.md` | review report: 0 critical, 2 warnings (fixed), 3 observations; ends `VERDICT: PROCEED — …` |
| `context/changes/base-cross-section/plan.md` | edited: `teaser` contract without `offsetY` (phase 1 §1/§3, phase 3 §1, P1); rows 2.7 and 4.10 and Current State "Counts" cite S-28 Deploy run 41261590741 with the real log lines; Known risks gains the shared stand-in colours |
| `context/changes/base-cross-section/change.md` | `status: plan_reviewed` |
| `context/changes/base-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/base-cross-section` (observed) |
| `gh run view 41261590741 --log` (sandbox off) | job `deploy` 124716473458 `Smoke check (deploy)`: `ok   precache covers house pictures — 3 of 3 house pictures precached`; job `build` 124715797789: `e2e hook: absent (2 chunks checked)` and `Tests  4168 passed \| 3 skipped (4171)` (ANSI colour codes in the raw log between `Tests` and the number) (observed) |
| python Progress↔Success Criteria check after edits | phases 1-5: 4/7/4/10/3, all equal (observed) |
| source checks at `b7bde74` | `shellReady` uses `HOUSE_ART.every`; `artQueued`/`artSettled` not reset in `create`, `show()` calls `loadArt` on wake too; `backToChoice` stops ui and room only; `HouseView.render` reads `HOUSE_LAYOUT.background`/`.teaser`; `standInShell` inline `margin = 24`, apex `shellTop + 40`; `RoomScene.redraw` shows `pl.house.open` (string) (observed) |
| pack checks (Pillow) | both shells transparent at (120, 600); airlock vs blind at cell (304, 100) = (253,246,223) vs (77,180,175); manifest `bases.base-1` cells and `liftShaft` as in the plan (observed) |
| `grep -o "assets/house/" dist/sw.js \| wc -l` | 3 on the existing local build (observed; row 2.4 expects 5 after phase 2) |
| lint / typecheck / tests / build / e2e | not run: docs-only step. Baseline per contract: unit 4171, e2e 184 on main `9a44799` (inherited, unverified here) |

## 4. Next command

`/10x-tdd base-cross-section` (phase 1, `Driver: tdd`)

## 5. Open

- Phases and drivers: 1 tdd, 2 impl, 3 tdd, 4 impl (docs, gaps, follow-ups, seam sweep, visual), 5 e2e (`tests/e2e/base-cross-section.spec.ts`, 3 tests, e2e `184 + 3`).
- Manual rows (human checklist): 4.6 `[visual]` 8 states × 1440/1024; 4.7 `[human]` Mostek celebration default (D4/P6); 4.8 `[human]` shared house `cell-frame` in the base + "Wróć do pokoju"; 4.9 `[human]` tablet offline base pictures; 2.7 `[reviewer] (CI at ship)` `5 of 5 house pictures precached`; 4.10 `[reviewer] (CI at ship)` `Tests  <4168 + N> passed | 3 skipped` (strip ANSI) and `e2e hook: absent (`.
- Risks: phase 2 `npm run art` needs `cwebp` and pinned Pillow 12.1.0 + numpy 2.4.3; `tests/houseCells.test.ts` "has a geometry for every house but the base" flips in phase 3; `tests/houseArt.test.ts` "weighs at most 80 000 B in all" becomes per building in phase 2 (base about 102 878 B, cap 110 000); shared stand-in colours `HOUSE_LAYOUT.standIn` (plan Known risks, review F4); house-cross-section follow-up 19 re-recorded (review F3).
- DESIGN-GAPs and follow-ups for phase 4 as listed in `plan.md` phase 4 §1 (to `context/changes/base-cross-section/follow-ups/review-fixes.md`).

## 6. Autonomous decisions

- F1 fixed by dropping `teaser.offsetY` rather than setting it to 0 for both buildings. Why: the pack preview's `fillText` at y+182 uses the alphabetic baseline, so the base text centres in the cell like the house; a field always 0 is dead weight. Rejected: keeping `offsetY: 11` (text 11 px below the pack). Would change: the visual pass (frame 1 vs `screenshots/base-with-bridge.png`) showing the base text visibly higher than the pack, then add the field with the measured value.
- F2 fixed by citing the S-28 Deploy run 41261590741 lines seen verbatim and telling the reviewer to strip ANSI codes. Rejected: keeping the regex `Tests +[0-9]+ passed` (does not match the raw log). Would change: CI switching vitest to a no-colour reporter.
- F3/F4/F5 accepted as observations, not plan changes; no CRITICAL found, so no driver or phase was changed. Would change: an implementation phase finding a claim of the plan false.
- Deep mode done inline without the skill's sub-agent: the risky claims were five file-local facts, each checked directly (contract: do the check yourself when a handful of tool calls). Would change: a plan touching many modules.
- Triage decided in place (no `AskUserQuestion`): warnings fixed in plan, observations recorded; VERDICT PROCEED.
