# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-e2e` phase-9 step of run 2026-10-31-space-base: the spec `tests/e2e/first-building-choice.spec.ts` (5 tests) is committed (`aa9dda6`) and rows 9.1-9.3 are ticked. Rows 8.6-8.10 and 3.7/8.11 stay for the visual gate, the human and the reviewer; do not tick them. `SAVE_VERSION` stays 6.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | `aa9dda6` p9 on top of: 5 docs + `9b537e7` p1 + `da7bccc` p2 + `5628349` p3 + `930363a` p4 + `f427d42` p5 + `d485d3a` p6 + `bc41f65` p7 + docs |
| pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/first-building-choice.spec.ts`, `playwright.config.ts` | p9: the 5-test spec; `ROUND_SPEC` gained the spec name |
| `src/core/placement.ts` | `ageBackOffered` removed; `themeBackOffered(learner, variants, warmupLength, rooms)` is the one rule |
| `src/scenes/TaskScene.ts` | `themeBack` button, `renderThemeBack` (reads `REGISTRY_KEYS.rooms`), `backToChoice` (console.info with stage and who placed it, same cleanup order, learner null, flush, `scene.start(welcome, { placed })`); hook task target `themeBack` |
| `src/data/layout.ts`, `src/data/pl.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | renames `ageBack` -> `themeBack` (layout, touch target, `pl.round.themeBack`, hook target) |
| tests | `tests/themeBack.test.ts` (ageBack cases folded in, v1 lift and learner-less save kept), new `tests/themeBackWiring.test.ts`, `tests/layout.test.ts` renames, `tests/welcomeChoiceWiring.test.ts` guard now expects `{ placed }`; `tests/ageBack.test.ts` deleted; `first-launch.spec.ts` #12 "Wróć" case rewritten (back -> choice view -> `passChoice(page, 'space')` -> reload -> gone after round 1), parent-path case asserts `themeBack` present |

## 3. Verification

| command | result |
|---|---|
| `playwright test first-building-choice.spec.ts --workers=1` | 5 passed |
| deliberate break A (`place()` always skips the choice, `if (true || hasPurchase)`) | FR-042 child test red; restored |
| break B (`BootScene` starts the welcome for a stored learner) | FR-049 test red; restored |
| break C (`TaskScene.renderThemeBack` without `themeBackOffered`) | FR-043 test red (themeBack still there after the first round); restored |
| break D (`space` -> `house-1` in `BUILDING_CHOICES`) | FR-042 child and FR-044 Mostek red; restored. Meta-check: each break flips a rule (routing, guard, mapping), not a label; git status afterwards showed only my two files |
| full e2e `--workers=3` (loaded machine) | 176 passed, 8 timeout failures in unrelated specs; `--last-failed --workers=1`: 8 passed. Total 184 = 179 + 5, equals `playwright test --list` |
| `npm test` | 4168 passed (p8 4168, delta 0) |
| lint / typecheck / build | OK; `e2e hook: absent (2 chunks checked)` |

## 4. Next command

`/10x-impl-review first-building-choice`

## 5. Open

- **Human checklist (manual Progress rows):** 2.6 v6 rollback note wording (`deploy/README.md` § 6, fourth Uwaga); 8.7 "Wróć" hidden after a purchase narrows FR-043 (P3, reviewed sound: F6); 8.8 Mostek costs 6/10/13/14/17/19/21 = 100 and cap 21; 8.9 choice-screen layout, labels, speaker, plain backdrop on a fresh install; 8.10 real tablet offline, both paths.
- **Reviewer rows:** 3.7 teacher read of Mostek copy; (CI at ship) 3.8 `room pictures — 79 of 79`, 5.7 `choice pictures — 2 of 2`, 8.11 Deploy `build` `Tests … passed` + `e2e hook: absent (`.
- **Visual row 8.6:** 9 states at 1440 and 1024 (choice view layout is a new state).
- (done in p8) DESIGN-GAP rows for the choice view (the code comments in `WELCOME_LAYOUT.choice` and `pl.welcome.choice` mark them): the kit has no choice screen, card, speaker spot or "Wróć" here; layout reuses the age title position, the age button face and the HUD speaker.
- **Follow-ups (phase 8):** as planned, plus: the notebook-polish follow-up #16 JSDoc nit and the audit-backdrop-fox F4 `openParent` suspender guard were NOT touched in p6 (no change needed found in the file; re-check in phase 8); the scene restart recaptures the salon backdrop once per view change (cheap, `captures` in the hook counts it).
- **Known risks (plan.md):** fresh-install first-session room art is not judged by "Obrazki" (F8, now narrowed: UIScene judges the chosen room once it has loaded); a learner-less save with a purchase skips the choice and keeps its building (F4, `hasPurchase`, guard in `WelcomeScene.place`).

## 6. Autonomous decisions

- **Phase 9 (e2e):** prompts decided in place. Parent-path test does not assert `choiceBack` absence (it is null on the task screen anyway, no signal); it asserts house-1/salon after choosing Dom. FR-043 test runs the warm-up (6) via `playRoundRight`, then the 5-task round. Config change: only `first-building-choice` added to `ROUND_SPEC`. Would change: a reviewer wanting a hook-level assert on the parent welcome view.

- **Phase 8 (impl):** prompts decided in place. Gap rows 191-198 (layout, copy, themeBack, Mostek wording, no base zoom-out, Mostek celebration, card stand-in, plain backdrop + Hasło words) with the code comments now citing row numbers. CLAUDE.md: the S-06 sentence's `ageBackOffered`/`backToAge` wording was the only leftover of the sweep; save version wording updated. Follow-ups file has 13 entries with Trigger lines (older follow-ups re-recorded or closed from what I know of the code; not re-read in full). Deliberate break: docs-only phase, the only checkable guard is the 8.2 count (8 rows, 6 without the first two, below the 7 limit). Visual row 8.6 left to the visual gate. Would change: the maintainer wanting a separate row for the Hasło words.
- **Phase 7 (impl):** prompts decided in place (stopped after the phase). The first-launch "Wróć" case can no longer re-pick an age (the choice view of a placed learner has no age row), so it now re-picks the building (`space`) and keeps the stage E3; the "older age" assertions were dropped. Row 7.5 left unticked (full e2e is the orchestrator's). During the commit I mistakenly ran `git reset --soft HEAD~1` once after a failed `git add`; it undid the p6 docs commit in the index only, and `git reset --soft 43c4500` restored HEAD at once (no content lost, history unchanged). Would change: the maintainer wanting the age row reachable from the task screen.

- **Phase 6 (impl):** prompts decided in place (stopped after the phase). The two views are the same scene restarted (`scene.restart({ placed, fromAge })`) rather than hiding the age widgets (`AgeButton` has no hide); `fromAge` is true only on the child age path so "Wróć" (welcome) shows for a child-placed learner only; a parent-confirmed placement never shows it. `FallbackWhere` gained `'choice'` but `FALLBACK_ORDER` was left alone so "Obrazki" gets no new line (the cards are already counted in the `ui` table). `passChoice` also accepts a straight jump to `task` (the purchase guard). The speaker keeps the HUD button look at its own rect inside the notebook (`SpeakerButton` gained an optional rect). Beyond the plan: TaskScene redraws the backdrop on `roomLoad` and UIScene refreshes the room health on a fresh install (needed by the specs and by the plan's own "plain until the room has loaded" intent); welcome backdrop specs now assert `plain`. Would change: the maintainer wanting a separate "Obrazki" line for the cards; a reviewer wanting hide/show instead of a restart.
- **Phase 5 (impl):** prompts decided in place. The choice keys are counted in the `ui` table of `BootScene.tables()` rather than a new `ArtTable`. `E2EArtSeam` gained `choice` inside the existing `e2eArt` marker.
- Earlier phases (plan review F4/F6/F7, phases 1-4): `AskUserQuestion` never called; F4 fix = skip the choice for a learner-less save that bought something (rejected: wiping the purchase, a refund); F6: P3 kept (`[human]` 8.7); F7: phase 4 driver stays `impl`; verdict PROCEED. Phase 1/2 (tdd): stubs returned wrong values so RED is an assertion; tests that corrupt or re-read a current save use `v6of('save-v5.json')`. Phase 3: DESIGN-GAP row for Mostek copy left to phase 8. Phase 4: `buildingStart` takes no `stars` and builds the start itself (save.ts imports core/house: a cycle).
