# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-plan-review` step of run 2026-10-31-space-base: verdict PROCEED, five findings fixed in `plan.md`, `change.md` is `plan_reviewed`, and phase 1 is next. The next agent must not get this wrong: the frozen `save-v5-salon.json` is produced in **phase 1 by the unchanged v5 code** (decode + re-encode round-trip, `git diff` guard on `src/core/save.ts`), and the v6 bump comes only in phase 2; phase 1 now also adds the pure `hasPurchase(rooms)` (plan-review F4).

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5: change identity (4e6b8d9), research (c5c2a21), plan (10d7cad), this step's `docs(first-building-choice): plan review` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 54 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/first-building-choice/reviews/plan-review.md` | the review: 3 critical, 2 warnings, 3 observations, triage, `VERDICT: PROCEED` |
| `context/changes/first-building-choice/plan.md` | fixed in place: phase 3 adds `tests/houseCells.test.ts` (F1); 3.4/5.4 use `grep -o … \| wc -l` (F2); 8.3 greps `'space'` only (F3); `hasPurchase` in phase 1 and the purchase guard in phase 6 + 6.2 break (F4); phase 8 names four triggered follow-ups (F5); new `## Known risks` (F4, F8) |
| `context/changes/first-building-choice/change.md` | `status: plan_reviewed` |
| `context/changes/first-building-choice/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/first-building-choice` |
| `grep -n "for (const h of HOUSES)" tests/houseCells.test.ts` | two cases iterate `HOUSES` and require `HOUSE_GEOMETRY[h.id]` → would be red after phase 3 (F1) |
| `grep -c "assets/rooms/" dist/sw.js` vs `grep -o "assets/rooms/[a-z]*/" dist/sw.js \| sort \| uniq -c` | `1` vs `37 salon`, `21 kitchen` → `grep -c` criteria unsatisfiable (F2) |
| `grep -rnE "'(house\|space)'" src` | `'house'` in `HouseScene.ts`, `artHealth.ts`, `artPick.ts`, `celebration.ts`, `save.ts` (F3) |
| `TaskScene.syncStars` + `roundView.switchVisible` read | stars per task, room open between tasks; `ageBackOffered` ignores rooms → learner-less save with purchase possible (F4) |
| criteria ↔ Progress check (python extract, pairwise) | 54 Progress rows equal the first 54 phase criteria texts |
| `ls designs/bystrow-space-base-v1/assets/{room,furniture,choice}` + manifest slots | 3 + 18 + 2 files, six bridge slot ids as in phase 3 |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code touched |

## 4. Next command

`/10x-tdd first-building-choice phase 1`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording; 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy; (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024.
- **Known risks (plan.md):** fresh-install first-session room art is not judged by "Obrazki" (F8); a learner-less save with a purchase skips the choice and keeps its building (F4, `hasPurchase` in `src/core/placement.ts`, guard in `WelcomeScene`).
- **Follow-ups (phase 8, `follow-ups/review-fixes.md`):** as planned, plus salon-load-health `FontFace` limit and loader-timeout guard, art-stand-in S14-08, minigame-daily-puzzle "next save-format change or S-17" (F5).
- **Risk:** phase 6 changes `tests/e2e/support/welcome.ts`, used by 43 e2e files.

## 6. Autonomous decisions

- `AskUserQuestion` never called; the skill's "how to proceed" and per-finding triage were decided in place: fix every CRITICAL and the two obvious WARNINGs in `plan.md`, record the observations.
- **F4 fix = skip the choice for a learner-less save that bought something.** Rejected: asking the theme and wiping the purchase (loses stars spent, against FR-049/"never lose progress"); a refund (second star source). Would change: the maintainer wanting every learner-less save asked the theme.
- **F6: P3 kept, not overturned** (hiding "Wróć" after a purchase is the only option compatible with no refund and one building; `[human]` 8.7 names it). Would change: the maintainer preferring the literal FR-043 with a refund.
- **F7: phase 4 driver stays `impl`** (thin wrapper + characterization; deliberate breaks cover the new rule). Would change: `buildingStart` growing real branching.
- **Verdict PROCEED, not RETHINK:** the approach is sound; all defects were local and fixed.
