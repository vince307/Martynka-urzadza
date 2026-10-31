# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-tdd` phase-2 step of run 2026-10-31-space-base: phase 2 is committed (da7bccc) and ticked. The next agent must not get this wrong: `SAVE_VERSION` is 6 now; `tests/fixtures/save-v5*.json` and `save-v6.json` are frozen; phase 3 touches art and room data only, never `src/core/save.ts` or `src/core/migrations`.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` phase 1 + `da7bccc` feat(first-building-choice) phase 2 + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 45 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/migrations/building.ts` (new) | `LIFT_V5_BUILDING`: `{ ...raw, version: 6 }`, frozen |
| `src/core/save.ts`, `src/core/types.ts` | `SAVE_VERSION` 6, `MIGRATIONS[5]`, `SaveV6`, `SaveState = SaveV6` |
| `tests/saveV6.test.ts`, `tests/fixtures/save-v6.json` (new, frozen) | v6 cases; base save `base-1`/`bridge` |
| `tests/{save,saveV4,saveV5,saveFile,autosave,legacySalonMigration,fixtureLoadPath,idbStore}.test.ts`, `tests/e2e/rooms-as-data.spec.ts` | version pins moved; tests that need a current-version base use `v6of('save-v5.json')` (a literal spread) |
| `deploy/README.md` | rollback note "format v6" |
| `plan.md` | rows 2.1-2.5 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| RED (before `building.ts`/bump) | `AssertionError: expected 5 to be 6` (version pin); `TypeError: MIGRATIONS[5] is not a function`; `AssertionError: expected null to be 5` (migratedFrom). Not a missing import |
| GREEN | `npx vitest run`: 224 files, 4116 passed (4107 after p1, delta +9: 7 saveV6 + 1 idbStore backup-v5 + 1 fixtureLoadPath row) |
| `npm run lint` / `typecheck` | OK / OK (lint first flagged 3 unnecessary type assertions in test helpers; fixed with `--fix`) |
| deploy + ops shell tests, `sample` E1-E6 | OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| row 2.3 | `git diff 9b537e7` of older fixtures and `house.ts`/`legacySalon.ts` empty |
| row 2.4 | `git diff --stat 9b537e7 -- deploy/` = `deploy/README.md` only (1 line) |
| deliberate break 1 | `copyHouse` in `building.ts` -> source guard red; restored |
| deliberate break 2 | `house: undefined` in the lift -> deep-equal, decode and import cases red (3); restored |
| deliberate break 3 | `SAVE_VERSION` 5 with `MIGRATIONS[5]` present -> version pin, 3 saveV6 cases and `fixtureLoadPath` "save-v6 ... writes v6" red (5); restored. Meta-check: oracles are the phase-1 v5 fixture (proven by v5 code) and a literal spread of it, not the migration output |
| e2e | not run: no UI change; `rooms-as-data.spec.ts` pin moved to 6 (title too), orchestrator gates it (`179 + 0`) |

## 4. Next command

`/10x-implement first-building-choice phase 3`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
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
- **Phase 2 (tdd):** manual gate, how-to-proceed, commit-message prompts decided in place (planned set committed, stopped). The plan's wording "every `toBe(5)` moves" was refined: tests that corrupt or re-read a current save need a `room 'living'` base, so they use `v6of('save-v5.json')` instead of the bridge-only `save-v6.json`. The `saveV5.test.ts` "unmigrated" cases now expect `migratedFrom: 5`. The source guard forbids the word `copyHouse` in `building.ts` comments too. Would change: none.
