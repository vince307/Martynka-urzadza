# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-implement` phase-5 step of run 2026-10-31-space-base: phase 5 (fresh-install boot, choice-card art) is committed (f427d42) and ticked. The next agent must not get this wrong: `SAVE_VERSION` is 6; phases 5+ must not touch `src/core/save.ts` or `src/core/migrations`; `base-1` has NO `HOUSE_GEOMETRY` (S-29), so RoomScene hides "Dom" there; `buildingStart` takes no `stars` argument (it returns house/rooms/currentRoom only; the caller keeps stars).

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` p1 + `da7bccc` p2 + `5628349` p3 + `930363a` p4 + `f427d42` p5 + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 28 (`grep -c '^- \[ \]' plan.md`) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/types.ts`, `src/data/houses.ts` | `BuildingChoice`; `BUILDING_CHOICES` (`house` -> `house-1`, `space` -> `base-1`, art keys `choice/house`, `choice/space` for phase 5) |
| `src/core/house.ts` | `buildingStart(choice, choices, houses)` (pure, throws `RangeError` on unknown choice/house; does not import save.ts) |
| `src/main.ts` | load path repairs `currentRoom` with `houseRoomIds(savedLayout, ROOMS)` and that building's first room; `FIRST_ROOM` import gone |
| `src/scenes/RoomScene.ts` | "Dom" button shown only when `HOUSE_GEOMETRY` has the saved house id |
| `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs` | seam `?e2eSave=v5-salon` (frozen `save-v5-salon.json`), marker `v5-salon` |
| tests | new `tests/buildingNeutral.test.ts`; changed `house`, `roomsData`, `houseWiring`, `freshRoundWiring`, `fixtureLoadPath`, `e2eHookGuard`, `roomVisitWiring` (regex follows the new condition) |

Phase 5 adds: `src/data/choiceArt.ts` (`CHOICE_ART`, keys `choice/house`, `choice/space`), `public/assets/choice/*.webp` (from `npm run art`), `bootGroups(placementNeeded)` and the `choice` `BootGroup` in `src/core/artHealth.ts`, `BootScene` (`placementNeeded()`, choice queuer, no room judged on a fresh install, choice keys counted in the `ui` table), `UIScene.create` ensures the chosen room, `check-deploy.ts` line `choice pictures`, seam `?e2eArt=choice`; tests `tests/choiceArt.test.ts` (new), `artHealth`, `bootBudget`.

## 3. Verification

| command | result |
|---|---|
| `npm test` | 4162 passed (baseline 4092; after p4 4151, p5 delta +11) |
| lint / typecheck / deploy + ops shell tests / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)`; `grep -o assets/choice/ dist/sw.js` = 2 |
| `npm run art` | only `public/assets/choice/` changed; diff vs p4 on roomArtLoader, balance, rooms/ui/tasks art empty |
| deliberate break 1 | `bootGroups(true)` with `room` added -> `artHealth` bootGroups case red; restored |
| deliberate break 2 | deleted `choice-space.webp` -> `choiceArt` file/orphan/weight cases and `bootBudget` fresh-install case red; restored. Meta-check: proof is the pure group list, the files and the BootScene source guards; the browser proof that the welcome shows the cards is phase 9 |
| e2e | not run (no visible change yet: the cards are loaded, not drawn); orchestrator gates `179 + 0` |

## 4. Next command

`/10x-implement first-building-choice phase 6`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy (task labels `Postaw pulpit`, `Postaw fotel pilota`, `Ustaw teleskop`, `Postaw regał z planetami`, `Połóż matę orbitalną`, `Ustaw kapsułę roślinną` in `pl.room.tasks`); (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024.
- **Known risks (plan.md):** fresh-install first-session room art is not judged by "Obrazki" (F8); a learner-less save with a purchase skips the choice and keeps its building (F4, `hasPurchase` in `src/core/placement.ts`, guard in `WelcomeScene`).
- **Follow-ups (phase 8, `follow-ups/review-fixes.md`):** as planned, plus salon-load-health `FontFace` limit and loader-timeout guard, art-stand-in S14-08, minigame-daily-puzzle "next save-format change or S-17" (F5).
- **Risk:** phase 6 changes `tests/e2e/support/welcome.ts`, used by 43 e2e files.

## 6. Autonomous decisions

- **Phase 5 (impl):** prompts decided in place (stopped after the phase). The choice keys are counted in the `ui` table of `BootScene.tables()` (logged as Ui, cut counted as pictures) rather than a new `ArtTable`, per the plan. `E2EArtSeam` gained `choice` inside the existing `e2eArt` marker. Would change: a reviewer wanting a separate `choice` table in `cutByTable`.

- `AskUserQuestion` never called; the skill's "how to proceed" and per-finding triage were decided in place: fix every CRITICAL and the two obvious WARNINGs in `plan.md`, record the observations.
- **F4 fix = skip the choice for a learner-less save that bought something.** Rejected: asking the theme and wiping the purchase (loses stars spent, against FR-049/"never lose progress"); a refund (second star source). Would change: the maintainer wanting every learner-less save asked the theme.
- **F6: P3 kept, not overturned** (hiding "Wróć" after a purchase is the only option compatible with no refund and one building; `[human]` 8.7 names it). Would change: the maintainer preferring the literal FR-043 with a refund.
- **F7: phase 4 driver stays `impl`** (thin wrapper + characterization; deliberate breaks cover the new rule). Would change: `buildingStart` growing real branching.
- **Verdict PROCEED, not RETHINK:** the approach is sound; all defects were local and fixed.
- **Phase 1 (tdd):** manual confirmation gate, how-to-proceed and commit-message prompts decided in place (planned set committed, stopped after the phase). Stubs returned wrong values (`[]`/`false`) so RED is an assertion; the fixture was generated after RED, so fixture cases showed ENOENT in RED. Skill ids in the fixture are real E2.1 ids. Would change: none.
- **Phase 2 (tdd):** manual gate, how-to-proceed, commit-message prompts decided in place (planned set committed, stopped). The plan's wording "every `toBe(5)` moves" was refined: tests that corrupt or re-read a current save need a `room 'living'` base, so they use `v6of('save-v5.json')` instead of the bridge-only `save-v6.json`. The `saveV5.test.ts` "unmigrated" cases now expect `migratedFrom: 5`. The source guard forbids the word `copyHouse` in `building.ts` comments too. Would change: none.
- **Phase 3 (impl):** manual gate and commit-message prompts decided in place (stopped after the phase). The DESIGN-GAP row for Mostek copy is left to phase 8 (the code comment already marks it). Variant names: four masculine (pulpit, fotel, teleskop, regał), two feminine (mata, kapsuła) as the plan says. Would change: the teacher read finding a wording fault.
- **Phase 4 (impl):** manual gate and commit-message prompts decided in place (stopped after the phase). `buildingStart` drops the plan's `stars` parameter (unused, lint) and builds the start itself instead of calling `freshSession` (save.ts imports core/house: a cycle); `fixtureLoadPath` has a test that it equals the `freshSession` shape via the fixtures. FR-050 test compares rounds as JSON (tasks hold closures). Would change: a reviewer wanting `freshSession` reuse via a shared module.
