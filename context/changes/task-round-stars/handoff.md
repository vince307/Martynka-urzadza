# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-implement task-round-stars phase 8` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306), 2 (d77b9c8), 3 (7d99976), 4 (6593472), 5 (4471d8c), 6 (6396fcb), 7 (6ab3f66) and 8 (bc357da) are committed; phases 9–11 are untouched. Phase 8 added the UI overlay with the star counter, the star flight and the round restart.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1..p8 (p8 `bc357da`) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 28 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/UIScene.ts` | Overlay launched by `TaskScene` (`scene.launch`), listed last in `main.ts`; creates `StarCounter`, listens to `changedata-stars` on the registry, no input |
| `src/ui/widgets/StarCounter.ts` | Pill top right (kit position, 196x100) with a code-drawn star and the number; exports `drawStar` and `starCounterTarget()`; `setValue`, `value()` |
| `src/scenes/TaskScene.ts` | `stage`/`rng`/`sessionStars`; `freshRound()`; `advance()` on a finished round starts the next one; `syncStars` sets registry `stars` = session total at once and calls `flyStar` (`tweens.chain` pop + travel, 850 ms, never blocks) from `answerSpot` (tapped tile, or the keypad OK key) or the "Dalej" button for the bonus |
| `src/ui/widgets/FeedbackBar.ts` | roundEnd bar now has the "Dalej" button too |
| `src/data/layout.ts` | `SCENE_KEYS.ui`, `REGISTRY_KEYS.stars`, `TASK_LAYOUT.starCounter`, `ANIMATION.starPopMs/starPopScale`, `FONT_SIZES.counter` |
| `plan.md` | Progress rows 8.1-8.3 ticked with bc357da |

## 3. Verification

| Command | Result |
|---|---|
| Unit | Tests 584 passed (branch baseline 584, +0; as planned, no new logic) |
| Deliberate break | `next` pays the bonus twice (`2 * bonus`): `tests/round.test.ts` red, 4 failed, e.g. "a clean round pays 5 + 2": expected 9 to be 7. Restored. Meta-check: proves the reducer, not the counter on screen (spec of phase 11) |
| `npm run lint` / `typecheck` | OK / OK |
| deploy + ops tests, `sample` E1-E6 | OK; `Naruszenia: 0` each |
| `npm run build` | OK |
| `npx playwright test` | 1 passed (baseline 1, +0); run with `dangerouslyDisableSandbox` |
| Browser look | NOT done (Chromium cannot start in the sandbox; visual gate is the orchestrator's). The flight and counter were never run in a browser: first runtime proof is the visual gate or phase 11 |

## 4. Next command

`/10x-implement task-round-stars phase 9`

## 5. Open

- Manual rows 8.4 `[visual]`, 8.5 `[human]` NOT ticked; also carried 1.5, 2.5, 5.5 `[reviewer]`, 5.6, 6.4, 7.4 `[visual]`, 7.5 `[reviewer]`, human rows 10.5-10.8.
- Visual gate to check: counter position vs the kit (top right, 1622-1818 x 46-146), the round-end bar with "Runda bez błędu! +2 ★" and "Dalej", counter 7 after a clean round, 420x760 with the rotate overlay.
- Counter shows only the number beside a drawn star (the font may lack the "★" glyph); `pl.round.stars` is now unused by scenes (left in `pl.ts`; remove or use in phase 10 seam sweep).
- Reduced-motion switch for the flight is S-08; no setting exists yet.
- Phase 9 needs the hook to read `TaskScene` state: `snapshot()`/`targets()` are not written yet (the widgets already expose `targets()`/`nextTarget()`; `StarCounter.value()` exists for the counter assertion).

## 6. Autonomous decisions

1. **Flight is drawn in `TaskScene`, not the overlay**: the target is a layout constant (`starCounterTarget`), so the two scenes share no object. Would change: the visual gate wanting the star above the notebook of another scene (then move it to `UIScene`).
2. **Counter updates the registry at once; total = `sessionStars` + `state.starsEarned`**, where `sessionStars` sums finished rounds in the scene. Rejected: storing the total in core (save is S-11).
3. **Bonus star flies from the "Dalej" button** at the end of the round (no tile any more). Would change: a kit view for round end.
4. **New round reuses the scene's rng and stage**; no new Polish strings (all existed), so no teacher read needed.
5. **Counter shows a drawn star + number, not the "★" character**, because glyph coverage of the bundled font is unverified.
6. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 8.
