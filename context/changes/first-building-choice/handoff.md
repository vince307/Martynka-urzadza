# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-tdd` phase-1 step of run 2026-10-31-space-base: phase 1 is committed (9b537e7) and ticked. The next agent must not get this wrong: `tests/fixtures/save-v5-salon.json` is frozen (produced by the unchanged v5 code); phase 2 bumps to v6 and must leave it byte-identical.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` test(first-building-choice) phase 1 + this handoff |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 50 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/fixtures/save-v5-salon.json` | frozen v5 salon-in-progress save (stars 17, E2 child, salon tasksDone 4, generation 9, writer `tab1:n1`), made by decode + encode on unchanged v5 code through a scratchpad script |
| `src/core/placement.ts` | `hasPurchase`, `themeBackOffered` (`ageBackOffered` kept until phase 7) |
| `src/core/house.ts` | `houseRoomIds` |
| `tests/themeBack.test.ts` (new), `tests/house.test.ts`, `tests/saveV5.test.ts`, `tests/fixtureLoadPath.test.ts` | cases for the above; fixture row `save-v5-salon` |
| `context/changes/first-building-choice/plan.md` | rows 1.1-1.4 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| RED (stubs returning `[]`/`false`) | `AssertionError: expected [] to deeply equal [ 'a', 'b' ]` (houseRoomIds); `AssertionError: expected false to be true` (themeBack cases); saveV5 fixture cases ENOENT before the fixture existed |
| GREEN `npx vitest run` of the 4 files | 62 passed |
| `npm run lint` / `typecheck` | OK / OK (lint first flagged unused destructured vars in the new test; fixed) |
| `npm test` | 4107 passed; baseline 4092 on main, delta +15 |
| deploy + ops shell tests, `sample` E1-E6 | OK |
| `npm run build` | prints `e2e hook: absent (2 chunks checked)` |
| `git diff --stat fc13e8c -- src/core/save.ts src/core/migrations src/data public` | empty (row 1.3) |
| deliberate break 1 | dropped `!hasPurchase(rooms)` from `themeBackOffered` -> "is gone for a room with a purchase" red; restored |
| deliberate break 2 | removed `house` from a scratch copy of the fixture -> decode/`ok` and round-trip cases red; restored byte-identical. Meta-check: the fixture is proven a v5 write by decode + re-encode on the unchanged v5 code (round-trip test), not by the v6 migration. Note the "without house" `saveProblem` case passes by design under that break |
| e2e | not run: no UI change, orchestrator gates it (`179 + 0` expected) |

## 4. Next command

`/10x-tdd first-building-choice phase 2`

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
- **Phase 1 (tdd):** manual confirmation gate, how-to-proceed and commit-message prompts decided in place (planned set committed, stopped after the phase). Stubs returned wrong values (`[]`/`false`) so RED is an assertion; the fixture was generated after RED, so fixture cases showed ENOENT in RED. Skill ids in the fixture are real E2.1 ids. Would change: none.
