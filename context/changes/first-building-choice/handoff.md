# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-implement` phase-6 step of run 2026-10-31-space-base: phase 6 (the choice view) is committed and ticked. The next agent must not get this wrong: `SAVE_VERSION` is 6; phases 7+ must not touch `src/core/save.ts` or `src/core/migrations`; the welcome scene now RESTARTS itself between views (`scene.restart({ placed, fromAge })`), so phase 7 reopens the choice by starting `SCENE_KEYS.welcome` with `{ placed }` (no `fromAge`: the welcome's own "Wróć" is then hidden, the task screen's "Wróć" is phase 7's).

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` p1 + `da7bccc` p2 + `5628349` p3 + `930363a` p4 + `f427d42` p5 + p6 (see `git log`) + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/WelcomeScene.ts` | `create(data?: WelcomeData)`: `{ placed, fromAge }` opens the `choice` view, else the `age` view; `place()` (hasPurchase guard, then `scene.restart`), `pick()` (`buildingStart` -> `REGISTRY_KEYS.house/rooms/currentRoom`, then `start`), `backToAge()`, `viewState()`, `targets()` with `choices`/`choiceBack` |
| `src/ui/widgets/ChoiceCard.ts` | new card widget (ChunkyFace `LIPS.age`, `CHOICE_ART` texture or a stand-in box, `drawn`, `target()`) |
| `src/ui/widgets/SpeakerButton.ts` | optional `SpeakerRect` third argument (default the HUD rect) |
| `src/data/layout.ts`, `src/data/pl.ts`, `src/core/artPick.ts` | `WELCOME_LAYOUT.choice`, `WELCOME_TOUCH_TARGETS.choice*`, `pl.welcome.choice`, `FallbackWhere` + `'choice'` (no "Obrazki" line: the cards are counted in the UI table) |
| `src/testing/e2eHook.ts`, `tests/e2e/support/{hook,welcome}.ts` | welcome snapshot `welcomeView`/`choiceSpeaker`; targets `choices`/`choiceBack`; `passChoice(page, building)`; `passWelcome*` take `building`; five specs that tap an age by hand call `passChoice` |
| `src/scenes/TaskScene.ts`, `src/scenes/UIScene.ts` | TaskScene redraws its backdrop on `changedata-roomLoad` (a fresh install's first round shows the salon as soon as it has loaded) and starts the welcome with `{}`; UIScene calls `refreshHealth(chosenRoom)` when boot judged no room (`roomArtHealth.total === 0`), so "Obrazki" judges the chosen room in the first session (closes the F8 risk) |
| tests | new `tests/welcomeChoiceWiring.test.ts`; `tests/layout.test.ts` choice-view case; e2e specs adapted to the fresh-install boot (welcome backdrop is plain, no salon at boot): `notebook-polish`, `backdrop-restore`, `canvas-renderer`, `salon-style`, `salon-load-health`, `final-art-loading`, `load-and-tab-guard` (held `assets/choice/*` instead of the salon), plus `passChoice` after hand-made age/stage taps |

## 3. Verification

| command | result |
|---|---|
| `npm test` | 4170 passed (baseline 4092; after p5 4162; p6 delta +8) |
| lint / typecheck / deploy + ops shell tests / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)` |
| `git diff --stat f427d42 -- src/core/save.ts src/data/balance.ts src/scenes/BootScene.ts src/scenes/RoomScene.ts` | empty |
| deliberate break 1 | `this.start(placed)` before the building in `pick()` -> order guard red; restored |
| deliberate break 2 | choice speaker moved onto a card (`left 400, top 420`) -> layout case red; restored |
| deliberate break 3 | first try `if (false && hasPurchase(rooms))` stayed GREEN (wrong break: the regex still matched); removing the guard block -> `hasPurchase` case red; restored. Meta-check: the guards prove source wiring only; the browser path is the e2e helpers and phase 9 |
| e2e | see the commit message / report line below |

E2E result: `npx playwright test --list` = 179 tests in 47 files (179 + 0). Full `--workers=4` run: 154 passed, 15 failed, every one a load timeout of a long spec (adaptive, first-launch #12, fox-guide, health-lines, money-pay x2, parent-settings, room-purchase, save-backup-health, save-transfer, stale-tab x5); `--last-failed --workers=1` passed 24 of 25 and the one real failure (first-launch "Wróć": Phaser keeps the previous start's scene data, so the welcome reopened the choice view) was fixed (explicit `{}` data) and `first-launch.spec.ts` passed 7/7. An earlier full run (before the spec fixes) had 25 failures: 9 real fresh-install expectations fixed below, the rest load timeouts.

## 4. Next command

`/10x-implement first-building-choice phase 7`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy; (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024 (choice view layout is a new state).
- **Phase 8 must add DESIGN-GAP rows** for the choice view (the code comments in `WELCOME_LAYOUT.choice` and `pl.welcome.choice` mark them): the kit has no choice screen, card, speaker spot or "Wróć" here; layout reuses the age title position, the age button face and the HUD speaker.
- **Follow-ups (phase 8):** as planned, plus: the notebook-polish follow-up #16 JSDoc nit and the audit-backdrop-fox F4 `openParent` suspender guard were NOT touched in p6 (no change needed found in the file; re-check in phase 8); the scene restart recaptures the salon backdrop once per view change (cheap, `captures` in the hook counts it).
- **Known risks (plan.md):** fresh-install first-session room art is not judged by "Obrazki" (F8, now narrowed: UIScene judges the chosen room once it has loaded); a learner-less save with a purchase skips the choice and keeps its building (F4, `hasPurchase`, guard in `WelcomeScene.place`).

## 6. Autonomous decisions

- **Phase 6 (impl):** prompts decided in place (stopped after the phase). The two views are the same scene restarted (`scene.restart({ placed, fromAge })`) rather than hiding the age widgets (`AgeButton` has no hide); `fromAge` is true only on the child age path so "Wróć" (welcome) shows for a child-placed learner only; a parent-confirmed placement never shows it. `FallbackWhere` gained `'choice'` but `FALLBACK_ORDER` was left alone so "Obrazki" gets no new line (the cards are already counted in the `ui` table). `passChoice` also accepts a straight jump to `task` (the purchase guard). The speaker keeps the HUD button look at its own rect inside the notebook (`SpeakerButton` gained an optional rect). Beyond the plan: TaskScene redraws the backdrop on `roomLoad` and UIScene refreshes the room health on a fresh install (needed by the specs and by the plan's own "plain until the room has loaded" intent); welcome backdrop specs now assert `plain`. Would change: the maintainer wanting a separate "Obrazki" line for the cards; a reviewer wanting hide/show instead of a restart.
- **Phase 5 (impl):** prompts decided in place. The choice keys are counted in the `ui` table of `BootScene.tables()` rather than a new `ArtTable`. `E2EArtSeam` gained `choice` inside the existing `e2eArt` marker.
- Earlier phases (plan review F4/F6/F7, phases 1-4): `AskUserQuestion` never called; F4 fix = skip the choice for a learner-less save that bought something (rejected: wiping the purchase, a refund); F6: P3 kept (`[human]` 8.7); F7: phase 4 driver stays `impl`; verdict PROCEED. Phase 1/2 (tdd): stubs returned wrong values so RED is an assertion; tests that corrupt or re-read a current save use `v6of('save-v5.json')`. Phase 3: DESIGN-GAP row for Mostek copy left to phase 8. Phase 4: `buildingStart` takes no `stars` and builds the start itself (save.ts imports core/house: a cycle).
