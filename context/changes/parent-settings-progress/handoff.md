# Handoff — `parent-settings-progress` (slice S-08)

Written by the `new` step (autonomous run 2026-10-12-s04-s08): change folder created, roadmap claims checked against the
repo, S-08 follow-ups triaged, seven autonomous decisions recorded in `change.md`. The next agent must not restart
`TaskScene` to change the stage: `TaskScene.create` zeroes `REGISTRY_KEYS.stars` and `sessionStars` (decision 2).

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | one docs commit from this step: `docs(parent-settings-progress): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/parent-settings-progress/change.md` | identity, roadmap claim vs repo table, design binding (no kit view: DESIGN-GAPs for icon, panel, progress view), migration (none), triggered follow-ups (5, all in scope; e2e helper refactor partly done in S-07), autonomous decisions 1–7, open questions for research |
| `context/changes/parent-settings-progress/handoff.md` | this file |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/parent-settings-progress` |
| Local gate | not run: docs-only step, no source file changed |
| Repo checks behind the claims table | read in this step: `src/core/mastery.ts` `recordRound` (history = `{skillId, ok, firstTry, at}`), `src/core/round.ts` `RoundState` (no given answer kept), `src/scenes/TaskScene.ts` `create` (zeroes stars), `autoRead` field, `src/scenes/UIScene.ts` (no settings icon), `src/ui/dom/stagePanel.ts` `openStagePanel` (age + `placeByParent`), `tests/e2e/support/hook.ts` (exists; copies left in `first-launch`, `narrator`, `task-round` specs), kit `screen.css` `.hud` (no settings icon) |
| Deliberate break | none: no test or code in this step |

## 4. Next command

/10x-research parent-settings-progress

## 5. Open

- Open questions for research are listed at the end of `change.md` (icon spot, long press in Phaser 4 and Playwright
  touch via CDP, input off on every active scene under dialogs, stage change inside `TaskScene` without restart, where to
  keep the first wrong answer in `core/round.ts` `answer`, parent-facing skill names, DOM test setup of S-06).
- DESIGN-GAPs expected (rows after 24 in `docs/design-gaps.md`): settings icon and spot, parent settings panel,
  progress view with empty state.
- `[human]` rows the plan must carry: settings and stage choice are session-only until S-11 (cold start = welcome again,
  empty progress view); open round is abandoned on a parent stage change (stars kept, answers not counted to mastery).
- Follow-up proposal for `/10x-test-plan refresh`: risk #14 (child reaches settings / stage change not effective next round).

## 6. Autonomous decisions

All seven are in `change.md` `## Autonomous decisions` with chosen / rejected / why / what would change the answer:
1 icon in `UIScene` HUD bottom-right margin outside the notebook, long press (2000 ms in `balance`, movement slop) as a
pure state machine in `core`, S-06 gate unchanged + new DOM settings panel sharing the stage-button group with
`stagePanel.ts`, input off on every active scene under dialogs; 2 stage change = pure function on `SessionLearner`
(clears `pendingUnlock`, warm-up, easing; keeps `unlockedStep`, mastery, history) + fresh round without `scene.restart`,
stars of the abandoned round kept; 3 history entries with a first-try miss get `{ prompt, given, answer }`, `RoundState`
keeps the first wrong answer, weakest 3 of the current stage by mastery then misses; 4 `autoRead` as a session setting in
the registry, parent choice wins across stage changes; 5 everything session-only until S-11; 6 privacy (no network, gate
answer never in the hook) and tests (tdd core, one local e2e with long press via CDP touch); 7 next step research
(prompt-fixed), clipboard skipped.
