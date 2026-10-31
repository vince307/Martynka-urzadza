# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-implement` phase-8 step of run 2026-10-31-space-base: phase 8 (docs, gap rows 191-198, follow-ups, seam sweep) is committed (`ad8e93b`); ticked 7.5 (orchestrator) and 8.1-8.5; 8.6 [visual], 8.7-8.10 [human], 8.11 [reviewer] are not mine. Phase 7 text follows: written by the `/10x-implement` phase-7 step of run 2026-10-31-space-base: phase 7 ("Wróć" from the task screen to the choice) is committed (`bc41f65`) and ticked except 7.5 (the orchestrator's full e2e). `SAVE_VERSION` stays 6; phase 8 must not touch `src/core/save.ts` or `src/core/migrations`. WelcomeScene's own `backToAge` (the choice view's "Wróć" to the age view, child path) is a different, legitimate name: phase 8's seam-sweep grep `ageBack\|backToAge` must be narrowed to `ageBack` or it hits that method.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 5 docs + `9b537e7` p1 + `da7bccc` p2 + `5628349` p3 + `930363a` p4 + `f427d42` p5 + `d485d3a` p6 + `bc41f65` p7 + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/placement.ts` | `ageBackOffered` removed; `themeBackOffered(learner, variants, warmupLength, rooms)` is the one rule |
| `src/scenes/TaskScene.ts` | `themeBack` button, `renderThemeBack` (reads `REGISTRY_KEYS.rooms`), `backToChoice` (console.info with stage and who placed it, same cleanup order, learner null, flush, `scene.start(welcome, { placed })`); hook task target `themeBack` |
| `src/data/layout.ts`, `src/data/pl.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | renames `ageBack` -> `themeBack` (layout, touch target, `pl.round.themeBack`, hook target) |
| tests | `tests/themeBack.test.ts` (ageBack cases folded in, v1 lift and learner-less save kept), new `tests/themeBackWiring.test.ts`, `tests/layout.test.ts` renames, `tests/welcomeChoiceWiring.test.ts` guard now expects `{ placed }`; `tests/ageBack.test.ts` deleted; `first-launch.spec.ts` #12 "Wróć" case rewritten (back -> choice view -> `passChoice(page, 'space')` -> reload -> gone after round 1), parent-path case asserts `themeBack` present |

## 3. Verification

| command | result |
|---|---|
| `npm test` (p8) | 4168 passed (delta 0) |
| `npm test` (p7) | 4168 passed (baseline 4092; after p6 4170; p7 delta -2: ageBack cases folded, +wiring guards) |
| lint / typecheck / deploy + ops shell tests / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)` |
| `grep -rn ageBack src tests` | only the "gone" guard in `tests/themeBackWiring.test.ts` |
| deliberate break 1 | `scene.start(welcome, {})` without `{ placed }` -> wiring guard red; restored |
| deliberate break 2 | `themeBackOffered(..., {})` without the rooms -> wiring guard red; restored. Meta-check: source guards prove wiring only; the browser path is first-launch (below) and phase 9 |
| e2e | `npx playwright test --list` = 179 tests (179 + 0). `first-launch.spec.ts --workers=1`: 7 passed. Full suite not run (orchestrator) |

## 4. Next command

`/10x-e2e first-building-choice phase 9`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy; (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024 (choice view layout is a new state).
- (done in p8) DESIGN-GAP rows for the choice view (the code comments in `WELCOME_LAYOUT.choice` and `pl.welcome.choice` mark them): the kit has no choice screen, card, speaker spot or "Wróć" here; layout reuses the age title position, the age button face and the HUD speaker.
- **Follow-ups (phase 8):** as planned, plus: the notebook-polish follow-up #16 JSDoc nit and the audit-backdrop-fox F4 `openParent` suspender guard were NOT touched in p6 (no change needed found in the file; re-check in phase 8); the scene restart recaptures the salon backdrop once per view change (cheap, `captures` in the hook counts it).
- **Known risks (plan.md):** fresh-install first-session room art is not judged by "Obrazki" (F8, now narrowed: UIScene judges the chosen room once it has loaded); a learner-less save with a purchase skips the choice and keeps its building (F4, `hasPurchase`, guard in `WelcomeScene.place`).

## 6. Autonomous decisions

- **Phase 8 (impl):** prompts decided in place. Gap rows 191-198 (layout, copy, themeBack, Mostek wording, no base zoom-out, Mostek celebration, card stand-in, plain backdrop + Hasło words) with the code comments now citing row numbers. CLAUDE.md: the S-06 sentence's `ageBackOffered`/`backToAge` wording was the only leftover of the sweep; save version wording updated. Follow-ups file has 13 entries with Trigger lines (older follow-ups re-recorded or closed from what I know of the code; not re-read in full). Deliberate break: docs-only phase, the only checkable guard is the 8.2 count (8 rows, 6 without the first two, below the 7 limit). Visual row 8.6 left to the visual gate. Would change: the maintainer wanting a separate row for the Hasło words.
- **Phase 7 (impl):** prompts decided in place (stopped after the phase). The first-launch "Wróć" case can no longer re-pick an age (the choice view of a placed learner has no age row), so it now re-picks the building (`space`) and keeps the stage E3; the "older age" assertions were dropped. Row 7.5 left unticked (full e2e is the orchestrator's). During the commit I mistakenly ran `git reset --soft HEAD~1` once after a failed `git add`; it undid the p6 docs commit in the index only, and `git reset --soft 43c4500` restored HEAD at once (no content lost, history unchanged). Would change: the maintainer wanting the age row reachable from the task screen.

- **Phase 6 (impl):** prompts decided in place (stopped after the phase). The two views are the same scene restarted (`scene.restart({ placed, fromAge })`) rather than hiding the age widgets (`AgeButton` has no hide); `fromAge` is true only on the child age path so "Wróć" (welcome) shows for a child-placed learner only; a parent-confirmed placement never shows it. `FallbackWhere` gained `'choice'` but `FALLBACK_ORDER` was left alone so "Obrazki" gets no new line (the cards are already counted in the `ui` table). `passChoice` also accepts a straight jump to `task` (the purchase guard). The speaker keeps the HUD button look at its own rect inside the notebook (`SpeakerButton` gained an optional rect). Beyond the plan: TaskScene redraws the backdrop on `roomLoad` and UIScene refreshes the room health on a fresh install (needed by the specs and by the plan's own "plain until the room has loaded" intent); welcome backdrop specs now assert `plain`. Would change: the maintainer wanting a separate "Obrazki" line for the cards; a reviewer wanting hide/show instead of a restart.
- **Phase 5 (impl):** prompts decided in place. The choice keys are counted in the `ui` table of `BootScene.tables()` rather than a new `ArtTable`. `E2EArtSeam` gained `choice` inside the existing `e2eArt` marker.
- Earlier phases (plan review F4/F6/F7, phases 1-4): `AskUserQuestion` never called; F4 fix = skip the choice for a learner-less save that bought something (rejected: wiping the purchase, a refund); F6: P3 kept (`[human]` 8.7); F7: phase 4 driver stays `impl`; verdict PROCEED. Phase 1/2 (tdd): stubs returned wrong values so RED is an assertion; tests that corrupt or re-read a current save use `v6of('save-v5.json')`. Phase 3: DESIGN-GAP row for Mostek copy left to phase 8. Phase 4: `buildingStart` takes no `stars` and builds the start itself (save.ts imports core/house: a cycle).
