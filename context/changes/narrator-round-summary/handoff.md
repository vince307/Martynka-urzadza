# Handoff — `narrator-round-summary` (slice S-05)

Written by the `/10x-new` step of autonomous run 2026-10-12-s04-s08. The change folder and `change.md` exist (status `new`) with the roadmap-vs-repo table, design binding, triggered follow-ups and six autonomous decisions; no product code yet. The next agent must not put any `speechSynthesis`/`window` code under `src/core/` (ESLint boundary) and must not invent a furniture cost: the "Do pokoju" highlight rule takes `null` until S-09 (change.md decision 2).

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary`, cut from `main` at `8467431` |
| Commits on branch | 1 (this docs commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan yet) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/narrator-round-summary/change.md` | change identity: notes and sources, roadmap claim / repo now / correction table, design binding (kit `summary.png`, HUD speaker, room view "Wróć do notesu"), DESIGN-GAP candidates (a)–(f), migration (none), triggered follow-ups with scope takes, autonomous decisions 1–7, open questions for research |
| `context/changes/narrator-round-summary/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/narrator-round-summary` |
| Repo checks behind the table | read `src/core/round.ts`, `src/core/round/view.ts` (`roundView`, `switchVisible`), `src/scenes/TaskScene.ts` (`advance`, `freshRound`, `snapshot`), `src/scenes/UIScene.ts`, `src/data/balance.ts`, `src/data/pl.ts`, `src/data/layout.ts` (`SCENE_KEYS`), `src/core/types.ts` (`Settings.autoRead`, `RoomTaskDef.cost`), `src/core/tasks/types.ts` (`Task.speak`), `eslint.config.mjs` (browser globals only in scenes/pwa/ui/testing/main), kit `summary.png`, `task-keypad.png`, `preview.js` `speak`/`hud`, `maths.css` |
| Gates (lint, typecheck, unit, build, e2e) | not run: docs-only step, no code changed |

## 4. Next command

/10x-research narrator-round-summary

## 5. Open

- Unknown carried from the roadmap: Polish system voice quality on the target tablets (PRD Open Questions 7) — only a `[human]` device check can answer it; headless Chromium has no voices.
- DESIGN-GAP candidates to confirm in research/plan (change.md "Design binding"): highlighted "Do pokoju" variant, bonus display in the summary, meaning of the 5-star row, no-voice behaviour (kit asks an adult, PRD hides the button), empty room scene; `docs/design-gaps.md` row 5 to close, row 4 depends on decision 3.
- Triggered follow-ups (`context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md`): HUD task/room switch — in scope as the last code phase; e2e counter vs drawn `StarCounter.value` — in scope; `pl.title` — re-trigger S-06; solution step dots — deferred (next change to `SolutionSteps`).
- New follow-up to write when the plan is made: `Trigger: S-09` — feed the current renovation task cost into the summary highlight rule.

## 6. Autonomous decisions

See `change.md` § Autonomous decisions (1–7); in short:
1. Speech in a `src/ui/` module over `speechSynthesis`; pure rules (text to read with symbols spelled in `pl.ts`, `autoRead` default per stage, voice pick from plain data) in `core`. Rejected: recordings, scene logic, a new `src/audio/` dir. Would change: iOS gesture rule blocks auto-read of the first task (then auto-read starts after the first tap, recorded as a limitation).
2. Highlight rule in `core` with `nextRoomTaskCost: null` until S-09. Rejected: a provisional cost in `balance.ts`, deferring the rule. Would change: maintainer wants the highlight visible now (then a temporary `balance` cost).
3. "Do pokoju" opens an empty `RoomScene` with "Wróć do notesu"; HUD switch between tasks as the last, cuttable code phase resuming the same round. Would change: plan grows beyond ~6 code phases, or Phaser sleep/wake breaks the round.
4. Summary replaces the `roundEnd` bar; "+N" includes the bonus. Would change: teacher/visual read wants a separate bonus line.
5. `autoRead` in session memory, default from stage (E3 ⇒ off), no parent toggle before S-08. Would change: auto-read cannot be verified outside unit tests (then only via the e2e build).
6. Next step `/10x-research`, not the skill's default `/10x-plan` (fixed by the step prompt). 7. Clipboard skipped (no recipient in an unattended session).
