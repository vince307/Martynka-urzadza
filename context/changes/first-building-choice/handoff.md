# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-implement` phase-3 step of run 2026-10-31-space-base: phase 3 (Mostek art and room data) is committed (5628349) and ticked. The next agent must not get this wrong: `SAVE_VERSION` is 6 now; `tests/fixtures/save-v5*.json` and `save-v6.json` are frozen; phase 4 must not touch `src/core/save.ts` or `src/core/migrations`; `base-1` has NO `HOUSE_GEOMETRY` (S-29), tests pin that.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` p1 + `da7bccc` p2 + `5628349` p3 + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 39 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `scripts/make-task-art.mjs` | `SPACE_BASE` root + `ROOM_PACKS` row `bridge` |
| `public/assets/rooms/bridge/*.webp` (21 new) | 3 scenes + 18 furniture, 699 124 B total (131 files, 3 395 024 B in the whole `npm run art` log) |
| `src/data/rooms.ts` | `BRIDGE` (6 slots from the manifest, tasks cost 6/10/13/14/17/19/21 = 100), `ROOMS` gains it |
| `src/data/roomArt.ts`, `src/data/pl.ts`, `src/data/houses.ts` | `ROOM_SCENE_FILES.bridge`; Mostek names, task labels (DESIGN-GAP comment), variant names; `HOUSES` gains `base-1` (no geometry) |
| `tests/roomArt.test.ts`, `tests/fixtures/room-art-bridge.json` (new), `tests/roomsData.test.ts`, `tests/houseCells.test.ts` | bridge art snapshot (sizes from the pack manifest), cost pins, one-house placement, `nextRoom` stays in Mostek, geometry pin `['base-1']` |
| `plan.md` | rows 3.1-3.6 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| `npm run art` | ran in the sandbox; `git status --short public/assets` = only `rooms/bridge/` |
| 5 targeted suites | 74 passed |
| `npm test` | 224 files, 4120 passed (baseline 4092; after p2 4116, delta +4) |
| lint / typecheck / deploy + ops shell tests / sample E1-E6 / build | OK; `e2e hook: absent` |
| `grep -o "assets/rooms/bridge/" dist/sw.js \| wc -l` | 21 |
| row 3.5 diff (salon, kitchen, balance, curriculum, core, scenes, main) | empty |
| deliberate break 1 | a bridge WebP moved away -> 3 roomArt cases red (size, no-orphan, weight); restored |
| deliberate break 2 | console cost 10 -> 9 -> the cost-pin case red; restored. Meta-check: 9 is still above the salon's 7, so the pin (literal list from FR-044) caught it, not the "above the salon" assertion; the oracles are the literal list and the manifest sizes |
| e2e | not run: no UI change; orchestrator gates it (`179 + 0`) |

## 4. Next command

`/10x-implement first-building-choice phase 4`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy (task labels `Postaw pulpit`, `Postaw fotel pilota`, `Ustaw teleskop`, `Postaw regał z planetami`, `Połóż matę orbitalną`, `Ustaw kapsułę roślinną` in `pl.room.tasks`); (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
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
- **Phase 3 (impl):** manual gate and commit-message prompts decided in place (stopped after the phase). The DESIGN-GAP row for Mostek copy is left to phase 8 (the code comment already marks it). Variant names: four masculine (pulpit, fotel, teleskop, regał), two feminine (mata, kapsuła) as the plan says. Would change: the teacher read finding a wording fault.
