# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-impl-review` step of run 2026-10-31-space-base: the full plan (phases 1-9) is reviewed, `MERGE: CLEAR`, and the review fixes are committed (`f6e9b17`). The next step is the visual gate (row 8.6); do not tick the `[human]` or `(CI at ship)` rows. `SAVE_VERSION` stays 6.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 24 in `fc13e8c..HEAD`: phases p1-p9 (`9b537e7` … `aa9dda6`), docs, review fix `f6e9b17`, review docs commit on top |
| pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (updated 2026-11-01) |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`): 2.6, 3.8, 5.7, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11 (3.7 ticked by this step) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/first-building-choice/reviews/impl-review.md` | the review: verdicts, suites, breaks, 12 findings with decisions, ends `MERGE: CLEAR — …` |
| `src/ui/roomArtLoader.ts` | `attachLoader` drops rooms still pending on a shut-down loader back to "not attempted" (review F1) |
| `src/scenes/TaskScene.ts` | `backToChoice` starts the welcome with `{ placed, fromAge: placed !== undefined && !placed.stageOverriddenByParent }` (review F2, playtest F-02 b) |
| `tests/roomArtLoader.test.ts` | new case "a room still pending when its loader shut down is queued again on the next loader"; rig exposes `loader` |
| `tests/house.test.ts` | new case: `buildingStart` field-equal to `freshSession` for both choices (F9) |
| `tests/e2e/first-launch.spec.ts` | "#12 "Wróć" returns to the building choice…" again taps `choiceBack`, age 9, Baza, expects E5 after a reload |
| `tests/themeBackWiring.test.ts`, `tests/welcomeChoiceWiring.test.ts`, `tests/layout.test.ts` | guards follow the new `scene.start` call; stale describe title renamed |
| `docs/design-gaps.md` (rows 195, 197, 198), `src/core/artPick.ts` (`DrawnFallbackWhere` comment), `CLAUDE.md` (S-28 sentence) | texts corrected to the code (F3) |
| `context/changes/first-building-choice/follow-ups/review-fixes.md` | entries 4-8, 11 rewritten against their sources (F5); new 14-18 |
| `context/changes/first-building-choice/plan.md` | row 3.7 ticked (teacher read pass) |
| `context/changes/first-building-choice/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK before and after the fixes |
| `npm test` | `ff22e33`: 4168 passed (baseline 4092, +76); after fixes 4170 (+78) |
| deploy / ops shell tests, `sample` E1-E6 | OK, all six exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --list` | 184 tests (baseline 179, +5) |
| full e2e `--workers=3` at `ff22e33`, load 20-43 | 177 passed, 7 failed (timeouts / `loading`) |
| `--last-failed --workers=1` (fixed code) | 6 passed, 1 failed (money-pay #11, known load flake); `money-pay.spec.ts` alone 4 passed |
| first-launch + first-building-choice after the fixes | 12 passed |
| break C (`true \|\| themeBackOffered` in `renderThemeBack`) | FR-043 test red (`toBeNull`, received `{x: 90, y: 928}`); restored. Meta: flips the guard, not a label |
| break F2 (`fromAge: false`) | first-launch #12 red (`choiceBack` null); restored |
| break F1 (unfixed `attachLoader`) | new unit case red 1/10; green after |
| tdd p1 RED re-executed (`hasPurchase` `> 99`) | `themeBack.test.ts` 2 failed / 8 passed; restored 10 passed |
| `git diff --stat fc13e8c -- tests/fixtures` | only 3 added files; older fixtures byte-unchanged |
| `validate-rule-files.sh` | PASS |

## 4. Next command

`visual gate`

## 5. Open

- **Visual row 8.6** (`[visual]`): 9 states at 1440 and 1024; also check the choice view after the task-screen "Wróć" now shows its own "Wróć" on the child path (`WelcomeScene.createChoice`, `fromAge`).
- **Human checklist:** 2.6 v6 rollback note (`deploy/README.md` § 6); 8.7 "Wróć" hidden after a purchase (P3); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100, cap 21; 8.9 choice layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline.
- **(CI at ship):** 3.8 Deploy `deploy` step `Smoke check (deploy)`: `ok   precache covers room pictures — 79 of 79 room pictures precached`; 5.7 same step: `ok   precache covers choice pictures — 2 of 2 choice pictures precached`; 8.11 Deploy `build`: `Tests +[0-9]+ passed` and `e2e hook: absent (`.
- **Follow-ups** (`follow-ups/review-fixes.md`): 14 welcome backdrop-restore e2e asserts `plain` only (`WelcomeScene`, `SalonBackdrop.render`); 15 `tests/buildingNeutral.test.ts` round equality by construction; 16 `UIScene.create` `refreshHealth` only when `total === 0`; 17 `TaskScene.backToChoice` leaves a sleeping `HouseScene` (Trigger S-29); 18 small seams (`ChoiceCard`, `FIRST_ROOM` fallbacks).
- **Known risks:** fresh-install room art not judged by "Obrazki" until loaded (F8); a learner-less save with a purchase skips the choice (`WelcomeScene.place`, `hasPurchase`).

## 6. Autonomous decisions

- **Impl-review triage** (no `AskUserQuestion`): fixed F1 (room re-queue in `attachLoader`; rejected a UIScene shutdown hook: two places instead of one; would change: a browser repro still stuck after the fix), F2 (restore the child's way back to the age; rejected keeping the phase-7 narrowing because it silently removed the playtest F-02 b fix the plan did not ask to drop; would change: the maintainer preferring the choice view without an age back), F3, F5 (docs to the code and sources), F9 (pin test). Deferred F4/F6 as follow-ups (cost: new e2e path / test redesign; would change: a failing restore report or an FR-050 regression). Accepted p6 extras (F11). Ticked 3.7 after the teacher read.
- e2e load failures re-judged with `--last-failed --workers=1` on the fixed code rather than a second full run (38.8 min under load); would change: a failure outside the profile's known load-flake list.
- Earlier steps' decisions (plan review F4/F6/F7, phases 1-9) stand as recorded in `plan.md` and the previous handoff; phase 7's "no `fromAge` from the task screen" is overturned by F2 above.
